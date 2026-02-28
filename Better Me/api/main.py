"""
BetterMe Drone Delivery — Tax Admin API

Auth endpoints:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/auth/me
  PUT  /api/auth/profile

Admin endpoints:
  GET  /api/admin/users
  PUT  /api/admin/users/:id
  DELETE /api/admin/users/:id
  GET  /api/admin/activity

Order endpoints:
  POST /api/orders/import-csv
  POST /api/orders
  POST /api/orders/calculate-tax
  GET  /api/orders
  GET  /api/orders/:id
  GET  /api/stats
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime, timezone
import csv
import io

from models import (
    Order, OrderCreate, TaxCalculationRequest,
    RegisterRequest, LoginRequest, AuthResponse, ProfileUpdate,
    AdminUserUpdate, UserPublic,
)
from tax_calculator import calculate_tax
from auth import (
    hash_password, verify_password, create_token,
    get_current_user_id, get_optional_user_id, require_admin,
)
import database as db

app = FastAPI(title="BetterMe Drone Delivery — Tax Admin API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    db.init_db()
    # Create default admin if not exists
    if not db.user_exists("admin@betterme.com"):
        db.create_user(
            email="admin@betterme.com",
            name="Admin User",
            password_hash=hash_password("admin123"),
            role="admin",
        )
    if not db.user_exists("user@example.com"):
        db.create_user(
            email="user@example.com",
            name="Regular User",
            password_hash=hash_password("user123"),
            role="user",
        )


# ── Helpers ─────────────────────────────────────────────────────────────────

def _build_order(order_id: str, latitude: float, longitude: float,
                 subtotal: float, timestamp: Optional[str] = None,
                 user_id: Optional[str] = None) -> Order:
    breakdown, jurisdictions = calculate_tax(latitude, longitude, subtotal)
    tax_amount = round(
        breakdown.state.amount + breakdown.county.amount +
        breakdown.city.amount + breakdown.special.amount, 2
    )
    total = round(subtotal + tax_amount, 2)
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()
    return Order(
        id=order_id, timestamp=timestamp,
        latitude=latitude, longitude=longitude,
        subtotal=subtotal, taxRate=breakdown.composite,
        taxAmount=tax_amount, total=total,
        jurisdictions=jurisdictions, taxBreakdown=breakdown,
        userId=user_id,
    )


# ═══════════════════════════════════════════════════════════════════════════
#  AUTH ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/auth/register")
async def register(body: RegisterRequest):
    if db.user_exists(body.email):
        raise HTTPException(400, "Email already registered")
    hashed = hash_password(body.password)
    user = db.create_user(email=body.email, name=body.name, password_hash=hashed)
    token = create_token(user.id, user.role)
    db.add_activity(user.id, user.name, "register", f"New user registered: {user.email}")
    return {"token": token, "user": user.model_dump()}


@app.post("/api/auth/login")
async def login(body: LoginRequest):
    user_row = db.get_user_by_email(body.email)
    if not user_row:
        raise HTTPException(401, "Invalid email or password")
    if not verify_password(body.password, user_row["password"]):
        raise HTTPException(401, "Invalid email or password")
    if not user_row.get("is_active", 1):
        raise HTTPException(403, "Account is deactivated")
    token = create_token(user_row["id"], user_row["role"])
    db.update_last_active(user_row["id"])
    db.add_activity(user_row["id"], user_row["name"], "login", f"User logged in: {user_row['email']}")
    user_public = UserPublic(
        id=user_row["id"], email=user_row["email"], name=user_row["name"],
        role=user_row["role"], phone=user_row.get("phone"),
        company=user_row.get("company"), avatar=user_row.get("avatar"),
        createdAt=user_row.get("created_at", ""),
    )
    return {"token": token, "user": user_public.model_dump()}


@app.get("/api/auth/me")
async def get_me(request: Request):
    user_id = get_current_user_id(request)
    user_row = db.get_user_by_id(user_id)
    if not user_row:
        raise HTTPException(404, "User not found")
    db.update_last_active(user_id)
    return UserPublic(
        id=user_row["id"], email=user_row["email"], name=user_row["name"],
        role=user_row["role"], phone=user_row.get("phone"),
        company=user_row.get("company"), avatar=user_row.get("avatar"),
        createdAt=user_row.get("created_at", ""),
    ).model_dump()


@app.put("/api/auth/profile")
async def update_profile(body: ProfileUpdate, request: Request):
    user_id = get_current_user_id(request)
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(400, "No data to update")
    # If changing email, check uniqueness
    if "email" in data:
        existing = db.get_user_by_email(data["email"])
        if existing and existing["id"] != user_id:
            raise HTTPException(400, "Email already taken")
    updated = db.update_user(user_id, data)
    if not updated:
        raise HTTPException(404, "User not found")
    user_row = db.get_user_by_id(user_id)
    db.add_activity(user_id, user_row["name"], "profile_update", "Profile updated")
    return updated.model_dump()


# ═══════════════════════════════════════════════════════════════════════════
#  ADMIN ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/admin/users")
async def admin_list_users(request: Request):
    require_admin(request)
    return [u.model_dump() for u in db.get_all_users()]


@app.put("/api/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUserUpdate, request: Request):
    admin_id = require_admin(request)
    data = {}
    if body.name is not None: data["name"] = body.name
    if body.email is not None: data["email"] = body.email
    if body.phone is not None: data["phone"] = body.phone
    if body.company is not None: data["company"] = body.company
    if body.role is not None: data["role"] = body.role
    if body.is_active is not None: data["is_active"] = 1 if body.is_active else 0
    if not data:
        raise HTTPException(400, "No data to update")
    updated = db.update_user(user_id, data)
    if not updated:
        raise HTTPException(404, "User not found")
    admin_row = db.get_user_by_id(admin_id)
    db.add_activity(admin_id, admin_row["name"], "user_update", f"Updated user {updated.name}")
    return updated.model_dump()


@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    admin_id = require_admin(request)
    user_row = db.get_user_by_id(user_id)
    if not user_row:
        raise HTTPException(404, "User not found")
    if user_row["role"] == "admin":
        raise HTTPException(400, "Cannot delete admin users")
    admin_row = db.get_user_by_id(admin_id)
    db.add_activity(admin_id, admin_row["name"], "user_delete", f"Deleted user {user_row['name']}")
    db.delete_user(user_id)
    return {"message": "User deleted"}


@app.get("/api/admin/activity")
async def admin_activity_log(request: Request, limit: int = 50):
    require_admin(request)
    logs = db.get_activity_log(limit)
    return [l.model_dump() for l in logs]


# ═══════════════════════════════════════════════════════════════════════════
#  ORDER ROUTES
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/orders")
async def list_orders(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    searchId: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    subtotalMin: Optional[float] = None,
    subtotalMax: Optional[float] = None,
    taxRate: Optional[float] = None,
):
    # Auth is optional for orders list (works with or without token)
    user_id = get_optional_user_id(request)
    # If user is logged in, check role
    user_filter = None
    if user_id:
        user_row = db.get_user_by_id(user_id)
        if user_row and user_row["role"] != "admin":
            user_filter = user_id  # regular users see only their orders

    return db.get_orders(
        page=page, limit=limit, search_id=searchId,
        date_from=dateFrom, date_to=dateTo,
        subtotal_min=subtotalMin, subtotal_max=subtotalMax,
        tax_rate=taxRate, user_id=user_filter,
    )


@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    order = db.get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@app.post("/api/orders")
async def create_order(body: OrderCreate, request: Request):
    user_id = get_optional_user_id(request)
    next_num = db.get_order_count() + 1
    order_id = f"ORD-{next_num:05d}"
    while db.order_exists(order_id):
        next_num += 1
        order_id = f"ORD-{next_num:05d}"

    order = _build_order(
        order_id=order_id,
        latitude=body.latitude, longitude=body.longitude,
        subtotal=body.subtotal, timestamp=body.timestamp,
        user_id=user_id,
    )
    db.insert_order(order)

    # Log activity
    if user_id:
        user_row = db.get_user_by_id(user_id)
        if user_row:
            db.add_activity(user_id, user_row["name"], "created_order",
                            f"Created order {order_id} (${order.total})")
    return order


@app.post("/api/orders/calculate-tax")
async def preview_tax(body: TaxCalculationRequest):
    breakdown, jurisdictions = calculate_tax(body.latitude, body.longitude, body.subtotal)
    tax_amount = round(
        breakdown.state.amount + breakdown.county.amount +
        breakdown.city.amount + breakdown.special.amount, 2
    )
    return {
        "taxBreakdown": breakdown.model_dump(),
        "jurisdictions": [j.model_dump() for j in jurisdictions],
        "taxRate": breakdown.composite,
        "taxAmount": tax_amount,
        "total": round(body.subtotal + tax_amount, 2),
        "jurisdiction": ", ".join(j.name for j in jurisdictions),
    }


@app.post("/api/orders/import-csv")
async def import_csv(file: UploadFile = File(...), request: Request = None):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "File must be a .csv")

    user_id = get_optional_user_id(request) if request else None
    contents = await file.read()
    text = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames:
        reader.fieldnames = [f.strip().lower() for f in reader.fieldnames]

    imported, errors = [], []
    for idx, row in enumerate(reader, start=2):
        try:
            oid = (row.get("id") or row.get("order_id") or "").strip()
            lat_str = (row.get("latitude") or row.get("lat") or "").strip()
            lon_str = (row.get("longitude") or row.get("lng") or row.get("lon") or "").strip()
            ts = (row.get("timestamp") or row.get("date") or "").strip()
            sub_str = (row.get("subtotal") or row.get("amount") or "").strip()
            if not oid or not lat_str or not lon_str or not sub_str:
                errors.append({"row": idx, "error": "Missing required field(s)"})
                continue
            lat, lon, subtotal = float(lat_str), float(lon_str), float(sub_str)
            if subtotal <= 0:
                errors.append({"row": idx, "error": f"Invalid subtotal: {sub_str}"})
                continue
            if db.order_exists(oid):
                errors.append({"row": idx, "error": f"Duplicate order ID: {oid}"})
                continue
            order = _build_order(order_id=oid, latitude=lat, longitude=lon,
                                 subtotal=subtotal, timestamp=ts or None, user_id=user_id)
            db.insert_order(order)
            imported.append(order)
        except ValueError as e:
            errors.append({"row": idx, "error": f"Invalid data: {e}"})
        except Exception as e:
            errors.append({"row": idx, "error": str(e)})

    # Log activity
    if user_id:
        user_row = db.get_user_by_id(user_id)
        if user_row:
            db.add_activity(user_id, user_row["name"], "imported_csv",
                            f"Imported {len(imported)} orders from CSV")

    return {"success": len(imported), "failed": len(errors), "orders": imported, "errors": errors}


@app.get("/api/stats")
async def stats(request: Request):
    user_id = get_optional_user_id(request)
    user_filter = None
    if user_id:
        user_row = db.get_user_by_id(user_id)
        if user_row and user_row["role"] != "admin":
            user_filter = user_id
    return db.get_statistics(user_id=user_filter)


@app.get("/")
async def root():
    return {"message": "BetterMe Drone Delivery Tax Admin API", "version": "2.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
