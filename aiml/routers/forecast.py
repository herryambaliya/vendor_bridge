import time
from datetime import datetime
from dateutil.relativedelta import relativedelta
import numpy as np
from fastapi import APIRouter
from schemas import SpendForecastInput, SpendForecastOutput, ForecastPoint

router = APIRouter()


def get_next_month(month_str: str, offset: int) -> str:
    """Return 'YYYY-MM' string offset months ahead of the given month string."""
    dt = datetime.strptime(month_str, "%Y-%m")
    future = dt + relativedelta(months=offset)
    return future.strftime("%Y-%m")


def compute_confidence(r_squared: float) -> str:
    if r_squared > 0.8:
        return "high"
    elif r_squared >= 0.5:
        return "medium"
    return "low"


def compute_trend(slope: float, mean_amount: float) -> str:
    """Determine trend based on slope relative to mean spend."""
    if mean_amount == 0:
        return "stable"
    relative_slope = slope / mean_amount
    if relative_slope > 0.05:
        return "increasing"
    elif relative_slope < -0.05:
        return "decreasing"
    return "stable"


@router.post("/spend-forecast", response_model=SpendForecastOutput)
def spend_forecast(payload: SpendForecastInput):
    start = time.time()
    n = len(payload.monthly_spend)

    try:
        monthly = payload.monthly_spend

        # Guard: need at least 3 months for meaningful regression
        if len(monthly) < 3:
            ms = round((time.time() - start) * 1000)
            print(f"[AI] /spend-forecast | insufficient_data | response_time={ms}ms")
            return SpendForecastOutput(
                forecast=[],
                trend="stable",
            )

        x = np.array(range(len(monthly)), dtype=float)
        y = np.array([p.amount for p in monthly], dtype=float)

        # Linear regression: y = slope * x + intercept
        coeffs = np.polyfit(x, y, 1)
        slope, intercept = coeffs[0], coeffs[1]

        # Compute R² for confidence
        y_pred = np.polyval(coeffs, x)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 1.0

        confidence = compute_confidence(r_squared)
        trend = compute_trend(slope, float(np.mean(y)))

        # Predict next 3 months
        last_month = monthly[-1].month
        forecast = []
        for i in range(1, 4):
            future_x = len(monthly) - 1 + i
            predicted = float(np.polyval(coeffs, future_x))
            predicted = max(0.0, predicted)  # no negative spend
            month_label = get_next_month(last_month, i)
            forecast.append(ForecastPoint(
                month=month_label,
                predicted_amount=round(predicted, 2),
                confidence=confidence,
            ))

        ms = round((time.time() - start) * 1000)
        print(f"[AI] /spend-forecast | input_size={n} | r2={round(r_squared,3)} | trend={trend} | response_time={ms}ms")

        return SpendForecastOutput(forecast=forecast, trend=trend)

    except Exception as e:
        ms = round((time.time() - start) * 1000)
        print(f"[AI] /spend-forecast | ERROR: {e} | response_time={ms}ms")

        # Graceful fallback: repeat last known amount as flat forecast
        last_amount = payload.monthly_spend[-1].amount if payload.monthly_spend else 0.0
        last_month = payload.monthly_spend[-1].month if payload.monthly_spend else "2026-01"
        fallback_forecast = [
            ForecastPoint(
                month=get_next_month(last_month, i),
                predicted_amount=round(last_amount, 2),
                confidence="low",
            )
            for i in range(1, 4)
        ]
        return SpendForecastOutput(forecast=fallback_forecast, trend="stable")
