"""
SQLite database for orders, users, and activity log.
"""
import sqlite3
import json
import os
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from models import (
    Order, TaxBreakdown, TaxComponent, Jurisdiction,
    UserPublic, UserWithStats, ActivityLog,
)

DB_PATH = os.path.join(os.path.dirname(__file__), "orders.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user',
    phone       TEXT,
    company     TEXT,
    avatar      TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT DEFAULT (datetime('now')),
    last_active TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    timestamp       TEXT NOT NULL,
    latitude        REAL NOT NULL,
    longitude       REAL NOT NULL,
    subtotal        REAL NOT NULL,
    tax_rate        REAL NOT NULL,
    tax_amount      REAL NOT NULL,
    total           REAL NOT NULL,
    state_rate      REAL NOT NULL,
    state_amount    REAL NOT NULL,
    county_rate     REAL NOT NULL,
    county_amount   REAL NOT NULL,
    city_rate       REAL NOT NULL,
    city_amount     REAL NOT NULL,
    special_rate    REAL NOT NULL,
    special_amount  REAL NOT NULL,
    composite_rate  REAL NOT NULL,
    jurisdictions   TEXT NOT NULL,
    user_id         TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS activity_log (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    user_name   TEXT NOT NULL,
    action      TEXT NOT NULL,
    details     TEXT NOT NULL,
    timestamp   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
"""


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = _get_conn()
    conn.executescript(SCHEMA)
    conn.close()


# ── Users ───────────────────────────────────────────────────────────────────

def create_user(email: str, name: str, password_hash: str, role: str = "user") -> UserPublic:
    conn = _get_conn()
    uid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO users (id, email, name, password, role, created_at) VALUES (?,?,?,?,?,?)",
        (uid, email, name, password_hash, role, now),
    )
    conn.commit()
    conn.close()
    return UserPublic(id=uid, email=email, name=name, role=role, createdAt=now)


def get_user_by_email(email: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def get_user_by_id(user_id: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def update_user(user_id: str, data: dict) -> Optional[UserPublic]:
    conn = _get_conn()
    sets = []
    params = []
    for k, v in data.items():
        if v is not None:
            sets.append(f"{k} = ?")
            params.append(v)
    if not sets:
        conn.close()
        return None
    params.append(user_id)
    conn.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = ?", params)
    conn.commit()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return _row_to_user_public(row)


def delete_user(user_id: str) -> bool:
    conn = _get_conn()
    cursor = conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return cursor.rowcount > 0


def get_all_users() -> List[UserWithStats]:
    conn = _get_conn()
    rows = conn.execute(
        """SELECT u.*,
                  COUNT(o.id) as order_count,
                  COALESCE(SUM(o.total), 0) as total_spent
           FROM users u
           LEFT JOIN orders o ON o.user_id = u.id
           GROUP BY u.id
           ORDER BY u.created_at DESC"""
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append(UserWithStats(
            id=r["id"],
            email=r["email"],
            name=r["name"],
            role=r["role"],
            phone=r["phone"],
            company=r["company"],
            avatar=r["avatar"],
            is_active=bool(r["is_active"]),
            createdAt=r["created_at"] or "",
            lastActive=r["last_active"],
            totalOrders=r["order_count"],
            totalSpent=round(r["total_spent"], 2),
        ))
    return result


def update_last_active(user_id: str):
    conn = _get_conn()
    conn.execute(
        "UPDATE users SET last_active = ? WHERE id = ?",
        (datetime.now(timezone.utc).isoformat(), user_id),
    )
    conn.commit()
    conn.close()


def _row_to_user_public(row) -> UserPublic:
    return UserPublic(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        role=row["role"],
        phone=row["phone"],
        company=row["company"],
        avatar=row["avatar"],
        createdAt=row["created_at"] or "",
    )


def user_exists(email: str) -> bool:
    conn = _get_conn()
    row = conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return row is not None


# ── Orders ──────────────────────────────────────────────────────────────────

def _row_to_order(row: sqlite3.Row) -> Order:
    return Order(
        id=row["id"],
        timestamp=row["timestamp"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        subtotal=row["subtotal"],
        taxRate=row["tax_rate"],
        taxAmount=row["tax_amount"],
        total=row["total"],
        userId=row["user_id"],
        jurisdictions=[Jurisdiction(**j) for j in json.loads(row["jurisdictions"])],
        taxBreakdown=TaxBreakdown(
            state=TaxComponent(rate=row["state_rate"], amount=row["state_amount"]),
            county=TaxComponent(rate=row["county_rate"], amount=row["county_amount"]),
            city=TaxComponent(rate=row["city_rate"], amount=row["city_amount"]),
            special=TaxComponent(rate=row["special_rate"], amount=row["special_amount"]),
            composite=row["composite_rate"],
        ),
    )


def insert_order(order: Order) -> Order:
    conn = _get_conn()
    conn.execute(
        """INSERT INTO orders
           (id, timestamp, latitude, longitude, subtotal,
            tax_rate, tax_amount, total,
            state_rate, state_amount, county_rate, county_amount,
            city_rate, city_amount, special_rate, special_amount,
            composite_rate, jurisdictions, user_id)
           VALUES (?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?)""",
        (
            order.id, order.timestamp, order.latitude, order.longitude, order.subtotal,
            order.taxRate, order.taxAmount, order.total,
            order.taxBreakdown.state.rate, order.taxBreakdown.state.amount,
            order.taxBreakdown.county.rate, order.taxBreakdown.county.amount,
            order.taxBreakdown.city.rate, order.taxBreakdown.city.amount,
            order.taxBreakdown.special.rate, order.taxBreakdown.special.amount,
            order.taxBreakdown.composite,
            json.dumps([j.model_dump() for j in order.jurisdictions]),
            order.userId,
        ),
    )
    conn.commit()
    conn.close()
    return order


def get_orders(
    page: int = 1, limit: int = 10,
    search_id: Optional[str] = None,
    date_from: Optional[str] = None, date_to: Optional[str] = None,
    subtotal_min: Optional[float] = None, subtotal_max: Optional[float] = None,
    tax_rate: Optional[float] = None,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    conn = _get_conn()
    where, params = [], []

    if search_id:
        where.append("id LIKE ?"); params.append(f"%{search_id}%")
    if date_from:
        where.append("timestamp >= ?"); params.append(date_from)
    if date_to:
        where.append("timestamp <= ?"); params.append(date_to + "T23:59:59.999Z")
    if subtotal_min is not None:
        where.append("subtotal >= ?"); params.append(subtotal_min)
    if subtotal_max is not None:
        where.append("subtotal <= ?"); params.append(subtotal_max)
    if tax_rate is not None:
        where.append("ABS(composite_rate - ?) < 0.01"); params.append(tax_rate)
    if user_id:
        where.append("user_id = ?"); params.append(user_id)

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""
    total = conn.execute(f"SELECT COUNT(*) as cnt FROM orders{where_sql}", params).fetchone()["cnt"]
    offset = (page - 1) * limit
    rows = conn.execute(
        f"SELECT * FROM orders{where_sql} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    conn.close()

    return {
        "orders": [_row_to_order(r) for r in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit),
    }


def get_order(order_id: str) -> Optional[Order]:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    return _row_to_order(row) if row else None


def order_exists(order_id: str) -> bool:
    conn = _get_conn()
    row = conn.execute("SELECT 1 FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    return row is not None


def get_statistics(user_id: Optional[str] = None) -> Dict[str, Any]:
    conn = _get_conn()
    where = ""
    params = []
    if user_id:
        where = " WHERE user_id = ?"
        params = [user_id]
    row = conn.execute(
        f"""SELECT COUNT(*) as cnt, COALESCE(SUM(total),0) as revenue,
                   COALESCE(SUM(tax_amount),0) as tax, COALESCE(SUM(subtotal),0) as subtotals
            FROM orders{where}""",
        params,
    ).fetchone()
    conn.close()
    cnt, revenue, tax, subtotals = row["cnt"], row["revenue"], row["tax"], row["subtotals"]
    return {
        "totalOrders": cnt,
        "totalRevenue": round(revenue, 2),
        "totalTax": round(tax, 2),
        "avgTaxRate": round(tax / subtotals * 100, 2) if subtotals > 0 else 0,
    }


def get_order_count() -> int:
    conn = _get_conn()
    row = conn.execute("SELECT COUNT(*) as cnt FROM orders").fetchone()
    conn.close()
    return row["cnt"]


# ── Activity Log ────────────────────────────────────────────────────────────

def add_activity(user_id: str, user_name: str, action: str, details: str):
    conn = _get_conn()
    conn.execute(
        "INSERT INTO activity_log (id, user_id, user_name, action, details) VALUES (?,?,?,?,?)",
        (str(uuid.uuid4()), user_id, user_name, action, details),
    )
    conn.commit()
    conn.close()


def get_activity_log(limit: int = 50) -> List[ActivityLog]:
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [
        ActivityLog(
            id=r["id"], userId=r["user_id"], userName=r["user_name"],
            action=r["action"], details=r["details"], timestamp=r["timestamp"],
        )
        for r in rows
    ]
