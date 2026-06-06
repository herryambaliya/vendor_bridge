import time
from fastapi import APIRouter
from schemas import RFQInput, VendorRecommendation

router = APIRouter()


def score_vendor(vendor, max_price, max_days, max_pos):
    """
    Multi-criteria weighted scoring:
      Rating      → 40 pts  (higher is better)
      Price       → 30 pts  (lower is better)
      Delivery    → 20 pts  (fewer days is better)
      Reliability → 10 pts  (more POs fulfilled is better)
    """
    rating_score = (vendor.avg_rating / 5.0) * 40

    price_score = ((1 - vendor.avg_price / max_price) * 30) if max_price > 0 else 0

    delivery_score = ((1 - vendor.avg_delivery_days / max_days) * 20) if max_days > 0 else 0

    reliability_score = ((vendor.total_pos / max_pos) * 10) if max_pos > 0 else 0

    total = rating_score + price_score + delivery_score + reliability_score
    return round(total, 2)


def build_reason(vendor, vendors):
    """Generate a human-readable recommendation reason."""
    reasons = []

    top_rating = max(v.avg_rating for v in vendors)
    min_price = min(v.avg_price for v in vendors)
    min_days = min(v.avg_delivery_days for v in vendors)

    if vendor.avg_rating == top_rating:
        reasons.append("Top Rated")
    if vendor.avg_price == min_price:
        reasons.append("Best Price")
    if vendor.avg_delivery_days == min_days:
        reasons.append("Fastest Delivery")

    if len(reasons) >= 2:
        return "Best Overall"
    if reasons:
        return reasons[0]
    return "Reliable Supplier"


@router.post("/recommend-vendors", response_model=list[VendorRecommendation])
def recommend_vendors(payload: RFQInput):
    start = time.time()
    n = len(payload.vendors)

    try:
        vendors = payload.vendors

        if not vendors:
            return []

        # Filter by category if specified
        category_vendors = [v for v in vendors if v.category.lower() == payload.category.lower()]
        if not category_vendors:
            category_vendors = vendors  # fallback: use all vendors

        max_price = max(v.avg_price for v in category_vendors)
        max_days = max(v.avg_delivery_days for v in category_vendors)
        max_pos = max(v.total_pos for v in category_vendors)

        scored = []
        for vendor in category_vendors:
            score = score_vendor(vendor, max_price, max_days, max_pos)
            reason = build_reason(vendor, category_vendors)
            scored.append({
                "vendor_id": vendor.vendor_id,
                "vendor_name": vendor.vendor_name,
                "score": score,
                "recommendation_reason": reason,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)

        result = [
            VendorRecommendation(rank=i + 1, **item)
            for i, item in enumerate(scored)
        ]

        ms = round((time.time() - start) * 1000)
        print(f"[AI] /recommend-vendors | input_size={n} | response_time={ms}ms")
        return result

    except Exception as e:
        ms = round((time.time() - start) * 1000)
        print(f"[AI] /recommend-vendors | ERROR: {e} | response_time={ms}ms")

        # Graceful fallback: sort by avg_rating descending
        fallback = sorted(payload.vendors, key=lambda v: v.avg_rating, reverse=True)
        return [
            VendorRecommendation(
                vendor_id=v.vendor_id,
                vendor_name=v.vendor_name,
                score=round(v.avg_rating * 20, 2),
                rank=i + 1,
                recommendation_reason="Fallback: sorted by rating",
            )
            for i, v in enumerate(fallback)
        ]
