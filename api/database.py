"""
SQLite-backed database for orders.

The DB file is created in the api/ directory as `orders.db`.
Schema is auto-created on first run.
"""

import sqlite3
import json
import os
from typing import List, Optional, Dict, Any
from models import Order, TaxBreakdown, TaxComponent, Jurisdiction

DB_PATH = os.path.join(os.path.dirname(__file__), "orders.db")

SCHEMA = """
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
    created_at      TEXT DEFAULT (datetime('now'))
);
"""


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = _get_conn()
    conn.executescript(SCHEMA)
    conn.close()


def _row_to_order(row: sqlite3.Row) -> Order:
    """Convert a DB row to an Order pydantic model."""
    return Order(
        id=row["id"],
        timestamp=row["timestamp"],
        latitude=row["latitude"],
        longitude=row["longitude"],
        subtotal=row["subtotal"],
        taxRate=row["tax_rate"],
        taxAmount=row["tax_amount"],
        total=row["total"],
        jurisdictions=[
            Jurisdiction(**j) for j in json.loads(row["jurisdictions"])
        ],
        taxBreakdown=TaxBreakdown(
            state=TaxComponent(rate=row["state_rate"], amount=row["state_amount"]),
            county=TaxComponent(rate=row["county_rate"], amount=row["county_amount"]),
            city=TaxComponent(rate=row["city_rate"], amount=row["city_amount"]),
            special=TaxComponent(rate=row["special_rate"], amount=row["special_amount"]),
            composite=row["composite_rate"],
        ),
    )


# ── CRUD ────────────────────────────────────────────────────────────────────

def insert_order(order: Order) -> Order:
    """Insert an order into the database."""
    conn = _get_conn()
    conn.execute(
        """INSERT INTO orders
           (id, timestamp, latitude, longitude, subtotal,
            tax_rate, tax_amount, total,
            state_rate, state_amount, county_rate, county_amount,
            city_rate, city_amount, special_rate, special_amount,
            composite_rate, jurisdictions)
           VALUES (?,?,?,?,?, ?,?,?, ?,?,?,?, ?,?,?,?, ?,?)""",
        (
            order.id,
            order.timestamp,
            order.latitude,
            order.longitude,
            order.subtotal,
            order.taxRate,
            order.taxAmount,
            order.total,
            order.taxBreakdown.state.rate,
            order.taxBreakdown.state.amount,
            order.taxBreakdown.county.rate,
            order.taxBreakdown.county.amount,
            order.taxBreakdown.city.rate,
            order.taxBreakdown.city.amount,
            order.taxBreakdown.special.rate,
            order.taxBreakdown.special.amount,
            order.taxBreakdown.composite,
            json.dumps([j.model_dump() for j in order.jurisdictions]),
        ),
    )
    conn.commit()
    conn.close()
    return order


def get_orders(
    page: int = 1,
    limit: int = 10,
    search_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    subtotal_min: Optional[float] = None,
    subtotal_max: Optional[float] = None,
    tax_rate: Optional[float] = None,
) -> Dict[str, Any]:
    """Return paginated, filtered orders."""
    conn = _get_conn()
    where_clauses = []
    params: list = []

    if search_id:
        where_clauses.append("id LIKE ?")
        params.append(f"%{search_id}%")
    if date_from:
        where_clauses.append("timestamp >= ?")
        params.append(date_from)
    if date_to:
        # Include the entire day
        where_clauses.append("timestamp <= ?")
        params.append(date_to + "T23:59:59.999Z")
    if subtotal_min is not None:
        where_clauses.append("subtotal >= ?")
        params.append(subtotal_min)
    if subtotal_max is not None:
        where_clauses.append("subtotal <= ?")
        params.append(subtotal_max)
    if tax_rate is not None:
        where_clauses.append("ABS(composite_rate - ?) < 0.01")
        params.append(tax_rate)

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Count
    count_row = conn.execute(
        f"SELECT COUNT(*) as cnt FROM orders{where_sql}", params
    ).fetchone()
    total = count_row["cnt"]

    # Fetch page
    offset = (page - 1) * limit
    rows = conn.execute(
        f"SELECT * FROM orders{where_sql} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()
    conn.close()

    orders = [_row_to_order(r) for r in rows]
    total_pages = max(1, (total + limit - 1) // limit)

    return {
        "orders": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
    }


def get_order(order_id: str) -> Optional[Order]:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    conn.close()
    return _row_to_order(row) if row else None


def get_statistics() -> Dict[str, Any]:
    conn = _get_conn()
    row = conn.execute(
        """SELECT
             COUNT(*)        as cnt,
             COALESCE(SUM(total), 0)       as revenue,
             COALESCE(SUM(tax_amount), 0)  as tax,
             COALESCE(SUM(subtotal), 0)    as subtotals
           FROM orders"""
    ).fetchone()
    conn.close()

    cnt = row["cnt"]
    revenue = row["revenue"]
    tax = row["tax"]
    subtotals = row["subtotals"]
    avg_rate = (tax / subtotals * 100) if subtotals > 0 else 0

    return {
        "totalOrders": cnt,
        "totalRevenue": round(revenue, 2),
        "totalTax": round(tax, 2),
        "avgTaxRate": round(avg_rate, 2),
    }


def order_exists(order_id: str) -> bool:
    conn = _get_conn()
    row = conn.execute(
        "SELECT 1 FROM orders WHERE id = ?", (order_id,)
    ).fetchone()
    conn.close()
    return row is not None
