"""
Pydantic models for the BetterMe Drone Delivery Tax Admin API.
Models match the frontend TypeScript interfaces exactly.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# ── Tax models (match frontend TaxBreakdown interface) ──────────────────────

class TaxComponent(BaseModel):
    """Single tax layer: rate in PERCENT (e.g. 4.0) and dollar amount."""
    rate: float
    amount: float


class TaxBreakdown(BaseModel):
    """
    Matches frontend:
      taxBreakdown: {
        state:   { rate: number; amount: number };
        county:  { rate: number; amount: number };
        city:    { rate: number; amount: number };
        special: { rate: number; amount: number };
        composite: number;
      }
    All rates are in PERCENT (e.g. 4.0 not 0.04).
    """
    state: TaxComponent
    county: TaxComponent
    city: TaxComponent
    special: TaxComponent       # MCTD surcharge (0.375% in MCTD zone)
    composite: float            # sum of all rates


# ── Jurisdiction model ──────────────────────────────────────────────────────

class Jurisdiction(BaseModel):
    """
    Matches frontend:
      { name: string; type: "State" | "County" | "City" | "Special" }
    """
    name: str
    type: Literal["State", "County", "City", "Special"]


# ── Order model (what GET /orders returns) ──────────────────────────────────

class Order(BaseModel):
    """
    Matches frontend Order interface exactly.
    """
    id: str                         # e.g. "ORD-01000"
    timestamp: str                  # ISO 8601
    latitude: float
    longitude: float
    subtotal: float
    taxRate: float                  # composite rate in %
    taxAmount: float
    total: float
    jurisdictions: List[Jurisdiction]
    taxBreakdown: TaxBreakdown


# ── Request models ──────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    """POST /orders — manual order creation."""
    latitude: float = Field(..., ge=40.0, le=45.1)
    longitude: float = Field(..., ge=-80.0, le=-71.0)
    subtotal: float = Field(..., gt=0)
    timestamp: Optional[str] = None     # ISO 8601; defaults to now


class TaxCalculationRequest(BaseModel):
    """POST /orders/calculate-tax — preview tax for coordinates."""
    latitude: float
    longitude: float
    subtotal: float = Field(..., gt=0)


# ── Response models ─────────────────────────────────────────────────────────

class OrdersListResponse(BaseModel):
    orders: List[Order]
    total: int
    page: int
    limit: int
    totalPages: int


class ImportResponse(BaseModel):
    success: int
    failed: int
    orders: List[Order]
    errors: List[dict]


class StatsResponse(BaseModel):
    totalOrders: int
    totalRevenue: float
    totalTax: float
    avgTaxRate: float
