"""
BetterMe Drone Delivery — Tax Admin API

Endpoints:
  POST /api/orders/import-csv   Import orders from CSV
  POST /api/orders              Create a single order
  POST /api/orders/calculate-tax  Preview tax for coordinates
  GET  /api/orders              List orders (paginated + filters)
  GET  /api/orders/:id          Get single order
  GET  /api/stats               Dashboard statistics
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime, timezone
import csv
import io

from models import (
    Order, OrderCreate, TaxCalculationRequest,
    OrdersListResponse, ImportResponse, StatsResponse,
    TaxBreakdown, Jurisdiction,
)
from tax_calculator import calculate_tax
import database as db

# ── App setup ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="BetterMe Drone Delivery — Tax Admin API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    db.init_db()


# ── Helpers ─────────────────────────────────────────────────────────────────

def _build_order(
    order_id: str,
    latitude: float,
    longitude: float,
    subtotal: float,
    timestamp: Optional[str] = None,
) -> Order:
    """Calculate tax and construct a full Order object."""
    breakdown, jurisdictions = calculate_tax(latitude, longitude, subtotal)
    tax_amount = breakdown.state.amount + breakdown.county.amount + \
                 breakdown.city.amount + breakdown.special.amount
    tax_amount = round(tax_amount, 2)
    total = round(subtotal + tax_amount, 2)

    if timestamp is None:
        timestamp = datetime.now(timezone.utc).isoformat()

    return Order(
        id=order_id,
        timestamp=timestamp,
        latitude=latitude,
        longitude=longitude,
        subtotal=subtotal,
        taxRate=breakdown.composite,
        taxAmount=tax_amount,
        total=total,
        jurisdictions=jurisdictions,
        taxBreakdown=breakdown,
    )


# ── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "BetterMe Drone Delivery Tax Admin API",
        "version": "1.0.0",
        "docs": "/docs",
    }


# ---------- Orders CRUD ----------

@app.get("/api/orders")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    searchId: Optional[str] = None,
    dateFrom: Optional[str] = None,
    dateTo: Optional[str] = None,
    subtotalMin: Optional[float] = None,
    subtotalMax: Optional[float] = None,
    taxRate: Optional[float] = None,
):
    """Paginated order list with filters."""
    result = db.get_orders(
        page=page,
        limit=limit,
        search_id=searchId,
        date_from=dateFrom,
        date_to=dateTo,
        subtotal_min=subtotalMin,
        subtotal_max=subtotalMax,
        tax_rate=taxRate,
    )
    return result


@app.get("/api/orders/{order_id}")
async def get_order(order_id: str):
    order = db.get_order(order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@app.post("/api/orders", response_model=Order)
async def create_order(body: OrderCreate):
    """Create a single order with auto tax calculation."""
    # Generate sequential ID
    stats = db.get_statistics()
    next_num = stats["totalOrders"] + 1
    order_id = f"ORD-{next_num:05d}"

    # Avoid collisions
    while db.order_exists(order_id):
        next_num += 1
        order_id = f"ORD-{next_num:05d}"

    order = _build_order(
        order_id=order_id,
        latitude=body.latitude,
        longitude=body.longitude,
        subtotal=body.subtotal,
        timestamp=body.timestamp,
    )
    db.insert_order(order)
    return order


# ---------- Tax preview ----------

@app.post("/api/orders/calculate-tax")
async def preview_tax(body: TaxCalculationRequest):
    """Calculate tax without creating an order (live preview)."""
    breakdown, jurisdictions = calculate_tax(
        body.latitude, body.longitude, body.subtotal,
    )
    tax_amount = round(
        breakdown.state.amount + breakdown.county.amount +
        breakdown.city.amount + breakdown.special.amount, 2
    )
    total = round(body.subtotal + tax_amount, 2)

    return {
        "taxBreakdown": breakdown.model_dump(),
        "jurisdictions": [j.model_dump() for j in jurisdictions],
        "taxRate": breakdown.composite,
        "taxAmount": tax_amount,
        "total": total,
        "jurisdiction": ", ".join(j.name for j in jurisdictions),
    }


# ---------- CSV import ----------

@app.post("/api/orders/import-csv")
async def import_csv(file: UploadFile = File(...)):
    """
    Import orders from CSV.
    Expected columns: id, latitude, longitude, timestamp, subtotal
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "File must be a .csv")

    contents = await file.read()
    text = contents.decode("utf-8-sig")         # handle BOM
    reader = csv.DictReader(io.StringIO(text))

    # Normalise header names (strip whitespace, lowercase)
    if reader.fieldnames:
        reader.fieldnames = [f.strip().lower() for f in reader.fieldnames]

    imported: list[Order] = []
    errors: list[dict] = []

    for idx, row in enumerate(reader, start=2):
        try:
            # Accept various column name formats
            oid = (row.get("id") or row.get("order_id") or "").strip()
            lat_str = (row.get("latitude") or row.get("lat") or "").strip()
            lon_str = (row.get("longitude") or row.get("lng") or row.get("lon") or "").strip()
            ts = (row.get("timestamp") or row.get("date") or "").strip()
            sub_str = (row.get("subtotal") or row.get("amount") or "").strip()

            if not oid or not lat_str or not lon_str or not sub_str:
                errors.append({"row": idx, "error": "Missing required field(s)"})
                continue

            lat = float(lat_str)
            lon = float(lon_str)
            subtotal = float(sub_str)

            if subtotal <= 0:
                errors.append({"row": idx, "error": f"Invalid subtotal: {sub_str}"})
                continue

            if db.order_exists(oid):
                errors.append({"row": idx, "error": f"Duplicate order ID: {oid}"})
                continue

            order = _build_order(
                order_id=oid,
                latitude=lat,
                longitude=lon,
                subtotal=subtotal,
                timestamp=ts or None,
            )
            db.insert_order(order)
            imported.append(order)

        except ValueError as e:
            errors.append({"row": idx, "error": f"Invalid data: {e}"})
        except Exception as e:
            errors.append({"row": idx, "error": str(e)})

    return {
        "success": len(imported),
        "failed": len(errors),
        "orders": imported,
        "errors": errors,
    }


# ---------- Stats ----------

@app.get("/api/stats")
async def stats():
    return db.get_statistics()


# ── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
