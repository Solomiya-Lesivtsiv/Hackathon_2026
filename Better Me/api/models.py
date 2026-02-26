from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


class TaxBreakdown(BaseModel):
    state_tax: float
    state_rate: float
    county_tax: float
    county_rate: float
    city_tax: float
    city_rate: float
    special_tax: float
    special_rate: float
    total_tax: float
    total_rate: float
    jurisdiction: str
    county: str
    city: str


class OrderCreate(BaseModel):
    order_id: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str = ""
    delivery_address: str
    delivery_lat: float = Field(..., ge=-90, le=90)
    delivery_lng: float = Field(..., ge=-180, le=180)
    subtotal: float = Field(..., gt=0)
    priority: str = Field(..., pattern="^(standard|express|urgent)$")
    status: str = Field(default="pending", pattern="^(pending|processing|in_transit|delivered|cancelled)$")
    items: List[str] = []


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_lat: Optional[float] = Field(None, ge=-90, le=90)
    delivery_lng: Optional[float] = Field(None, ge=-180, le=180)
    subtotal: Optional[float] = Field(None, gt=0)
    priority: Optional[str] = Field(None, pattern="^(standard|express|urgent)$")
    status: Optional[str] = Field(None, pattern="^(pending|processing|in_transit|delivered|cancelled)$")
    items: Optional[List[str]] = None
    tax_breakdown: Optional[TaxBreakdown] = None


class Order(BaseModel):
    id: str
    order_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    delivery_address: str
    delivery_lat: float
    delivery_lng: float
    subtotal: float
    tax_breakdown: TaxBreakdown
    total: float
    priority: str
    status: str
    items: List[str]
    created_at: datetime
    updated_at: datetime


class TaxCalculationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    subtotal: float = Field(..., gt=0)


class OrderFilters(BaseModel):
    search: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
