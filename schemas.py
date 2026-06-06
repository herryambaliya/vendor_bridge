from pydantic import BaseModel
from typing import List, Optional


# ─── Vendor Recommender ────────────────────────────────────────────────────────

class VendorItem(BaseModel):
    vendor_id: str
    vendor_name: str
    category: str
    avg_rating: float        # 0.0 – 5.0
    avg_price: float         # average unit price from past orders
    avg_delivery_days: int   # average delivery time in days
    total_pos: int           # total purchase orders fulfilled


class RFQInput(BaseModel):
    rfq_id: str
    category: str
    budget_estimate: Optional[float] = None
    deadline_days: Optional[int] = None
    vendors: List[VendorItem]


class VendorRecommendation(BaseModel):
    vendor_id: str
    vendor_name: str
    score: float
    rank: int
    recommendation_reason: str


# ─── Quotation Ranker ──────────────────────────────────────────────────────────

class QuotationItem(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    unit_price: float
    delivery_days: int
    vendor_rating: float     # 0.0 – 5.0


class QuotationsInput(BaseModel):
    rfq_id: str
    quotations: List[QuotationItem]


class RankedQuotation(BaseModel):
    quotation_id: str
    vendor_id: str
    vendor_name: str
    total_score: float
    rank: int
    badge: str


# ─── Spend Forecaster ──────────────────────────────────────────────────────────

class SpendPoint(BaseModel):
    month: str               # format: "2026-01"
    amount: float


class SpendForecastInput(BaseModel):
    monthly_spend: List[SpendPoint]


class ForecastPoint(BaseModel):
    month: str
    predicted_amount: float
    confidence: str          # "high" | "medium" | "low"


class SpendForecastOutput(BaseModel):
    forecast: List[ForecastPoint]
    trend: str               # "increasing" | "stable" | "decreasing"
