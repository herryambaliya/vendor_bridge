import time
from fastapi import APIRouter
from schemas import QuotationsInput, RankedQuotation

router = APIRouter()


def normalize(value, min_val, max_val):
    """Normalize a value to 0–1. Returns 1.0 if all values are equal."""
    if max_val == min_val:
        return 1.0
    return (value - min_val) / (max_val - min_val)


def score_quotation(q, min_price, max_price, min_days, max_days):
    """
    Normalized multi-criteria scoring across all quotations:
      Price    → 40 pts  (lower price = higher score)
      Delivery → 30 pts  (fewer days = higher score)
      Rating   → 30 pts  (higher rating = higher score)
    """
    price_score = normalize(max_price - q.unit_price, 0, max_price - min_price) * 40
    delivery_score = normalize(max_days - q.delivery_days, 0, max_days - min_days) * 30
    rating_score = (q.vendor_rating / 5.0) * 30

    return round(price_score + delivery_score + rating_score, 2)


def assign_badges(scored_quotations, original_quotations):
    """
    Badge logic:
      Rank 1 overall     → Best Overall ⭐
      Lowest unit_price  → Best Price 💰
      Fastest delivery   → Fastest 🚀
      Rank 2             → Recommended
      Others             → Competitive
    A quotation can hold multiple badges (e.g. Best Overall + Best Price).
    """
    min_price = min(q.unit_price for q in original_quotations)
    min_days = min(q.delivery_days for q in original_quotations)

    badges = {}
    for item in scored_quotations:
        qid = item["quotation_id"]
        badge_parts = []

        if item["rank"] == 1:
            badge_parts.append("Best Overall ⭐")
        if item["unit_price"] == min_price:
            badge_parts.append("Best Price 💰")
        if item["delivery_days"] == min_days:
            badge_parts.append("Fastest 🚀")
        if item["rank"] == 2 and not badge_parts:
            badge_parts.append("Recommended")
        if not badge_parts:
            badge_parts.append("Competitive")

        badges[qid] = " · ".join(badge_parts)

    return badges


@router.post("/rank-quotations", response_model=list[RankedQuotation])
def rank_quotations(payload: QuotationsInput):
    start = time.time()
    n = len(payload.quotations)

    try:
        quotations = payload.quotations

        if not quotations:
            return []

        # Edge case: single quotation — no normalization needed
        if len(quotations) == 1:
            q = quotations[0]
            ms = round((time.time() - start) * 1000)
            print(f"[AI] /rank-quotations | input_size=1 | response_time={ms}ms")
            return [RankedQuotation(
                quotation_id=q.id,
                vendor_id=q.vendor_id,
                vendor_name=q.vendor_name,
                total_score=100.0,
                rank=1,
                badge="Best Overall ⭐",
            )]

        min_price = min(q.unit_price for q in quotations)
        max_price = max(q.unit_price for q in quotations)
        min_days = min(q.delivery_days for q in quotations)
        max_days = max(q.delivery_days for q in quotations)

        scored = []
        for q in quotations:
            score = score_quotation(q, min_price, max_price, min_days, max_days)
            scored.append({
                "quotation_id": q.id,
                "vendor_id": q.vendor_id,
                "vendor_name": q.vendor_name,
                "total_score": score,
                "unit_price": q.unit_price,
                "delivery_days": q.delivery_days,
            })

        scored.sort(key=lambda x: x["total_score"], reverse=True)
        for i, item in enumerate(scored):
            item["rank"] = i + 1

        badges = assign_badges(scored, quotations)

        result = [
            RankedQuotation(
                quotation_id=item["quotation_id"],
                vendor_id=item["vendor_id"],
                vendor_name=item["vendor_name"],
                total_score=item["total_score"],
                rank=item["rank"],
                badge=badges[item["quotation_id"]],
            )
            for item in scored
        ]

        ms = round((time.time() - start) * 1000)
        print(f"[AI] /rank-quotations | input_size={n} | response_time={ms}ms")
        return result

    except Exception as e:
        ms = round((time.time() - start) * 1000)
        print(f"[AI] /rank-quotations | ERROR: {e} | response_time={ms}ms")

        # Graceful fallback: sort by unit_price ascending
        fallback = sorted(payload.quotations, key=lambda q: q.unit_price)
        return [
            RankedQuotation(
                quotation_id=q.id,
                vendor_id=q.vendor_id,
                vendor_name=q.vendor_name,
                total_score=0.0,
                rank=i + 1,
                badge="Best Price 💰" if i == 0 else "Competitive",
            )
            for i, q in enumerate(fallback)
        ]
