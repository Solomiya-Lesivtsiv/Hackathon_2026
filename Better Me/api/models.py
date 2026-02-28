"""
Pydantic models for BetterMe Drone Delivery Tax Admin API.
Covers: Orders, Tax, Auth, Users, Activity Log.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


# ── Tax ─────────────────────────────────────────────────────────────────────

class TaxComponent(BaseModel):
    rate: float
    amount: float

class TaxBreakdown(BaseModel):
    state: TaxComponent
    county: TaxComponent
    city: TaxComponent
    special: TaxComponent
    composite: float

class Jurisdiction(BaseModel):
    name: str
    type: Literal["State", "County", "City", "Special"]


# ── Orders ──────────────────────────────────────────────────────────────────

class Order(BaseModel):
    id: str
    timestamp: str
    latitude: float
    longitude: float
    subtotal: float
    taxRate: float
    taxAmount: float
    total: float
    jurisdictions: List[Jurisdiction]
    taxBreakdown: TaxBreakdown
    userId: Optional[str] = None  # who created this order

class OrderCreate(BaseModel):
    latitude: float = Field(..., ge=40.0, le=45.1)
    longitude: float = Field(..., ge=-80.0, le=-71.0)
    subtotal: float = Field(..., gt=0)
    timestamp: Optional[str] = None

class TaxCalculationRequest(BaseModel):
    latitude: float
    longitude: float
    subtotal: float = Field(..., gt=0)


# ── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1)
    email: str
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: "UserPublic"

class UserPublic(BaseModel):
    """User data returned to frontend (no password)."""
    id: str
    email: str
    name: str
    role: Literal["admin", "user"]
    phone: Optional[str] = None
    company: Optional[str] = None
    avatar: Optional[str] = None
    createdAt: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None


# ── User Management (admin) ────────────────────────────────────────────────

class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[Literal["admin", "user"]] = None
    is_active: Optional[bool] = None

class UserWithStats(UserPublic):
    """User + order statistics for admin panel."""
    is_active: bool = True
    totalOrders: int = 0
    totalSpent: float = 0.0
    lastActive: Optional[str] = None


# ── Activity Log ────────────────────────────────────────────────────────────

class ActivityLog(BaseModel):
    id: str
    userId: str
    userName: str
    action: str       # e.g. "created_order", "imported_csv", "login", "register"
    details: str      # human-readable description
    timestamp: str


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
