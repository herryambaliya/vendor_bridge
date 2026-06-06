import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ─── Health Check Tests ───────────────────────────────────────────────────────

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "vendorbridge-ai"}


# ─── Vendor Recommender Tests ─────────────────────────────────────────────────

def test_recommend_vendors_success():
    payload = {
        "rfq_id": "rfq-101",
        "category": "Furniture",
        "budget_estimate": 100000.0,
        "deadline_days": 10,
        "vendors": [
            {
                "vendor_id": "v1",
                "vendor_name": "FurniOne",
                "category": "Furniture",
                "avg_rating": 4.5,
                "avg_price": 5000.0,
                "avg_delivery_days": 5,
                "total_pos": 10
            },
            {
                "vendor_id": "v2",
                "vendor_name": "FurniTwo",
                "category": "Furniture",
                "avg_rating": 5.0,
                "avg_price": 6000.0,
                "avg_delivery_days": 3,
                "total_pos": 20
            },
            {
                "vendor_id": "v3",
                "vendor_name": "TechOne",
                "category": "IT",
                "avg_rating": 4.8,
                "avg_price": 50000.0,
                "avg_delivery_days": 7,
                "total_pos": 30
            }
        ]
    }
    response = client.post("/recommend-vendors", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Only furniture vendors should be recommended/scored
    
    # Check ranking and reasons
    assert data[0]["rank"] == 1
    assert data[1]["rank"] == 2
    
    assert data[0]["vendor_id"] == "v2"
    assert data[0]["score"] == 58.0
    assert data[0]["recommendation_reason"] == "Best Overall"  # Top Rated & Fastest Delivery
    
    assert data[1]["vendor_id"] == "v1"
    assert data[1]["score"] == 46.0
    assert data[1]["recommendation_reason"] == "Best Price"  # Best Price


def test_recommend_vendors_no_matching_category_fallback():
    payload = {
        "rfq_id": "rfq-102",
        "category": "Stationery",
        "budget_estimate": 10000.0,
        "deadline_days": 5,
        "vendors": [
            {
                "vendor_id": "v1",
                "vendor_name": "FurniOne",
                "category": "Furniture",
                "avg_rating": 4.5,
                "avg_price": 5000.0,
                "avg_delivery_days": 5,
                "total_pos": 10
            },
            {
                "vendor_id": "v2",
                "vendor_name": "TechOne",
                "category": "IT",
                "avg_rating": 4.8,
                "avg_price": 50000.0,
                "avg_delivery_days": 7,
                "total_pos": 30
            }
        ]
    }
    response = client.post("/recommend-vendors", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Fell back to all vendors


def test_recommend_vendors_exception_fallback():
    payload = {
        "rfq_id": "rfq-103",
        "category": "Furniture",
        "budget_estimate": 10000.0,
        "deadline_days": 5,
        "vendors": [
            {
                "vendor_id": "v1",
                "vendor_name": "FurniOne",
                "category": "Furniture",
                "avg_rating": 4.5,
                "avg_price": 5000.0,
                "avg_delivery_days": 5,
                "total_pos": 10
            }
        ]
    }
    with patch("routers.recommend.score_vendor", side_effect=Exception("Test Exception")):
        response = client.post("/recommend-vendors", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    # Fallback score: avg_rating * 20 = 4.5 * 20 = 90.0
    assert data[0]["score"] == 90.0
    assert "Fallback" in data[0]["recommendation_reason"]


# ─── Quotation Ranker Tests ───────────────────────────────────────────────────

def test_rank_quotations_success():
    payload = {
        "rfq_id": "rfq-201",
        "quotations": [
            {
                "id": "q1",
                "vendor_id": "v1",
                "vendor_name": "FurniOne",
                "unit_price": 100.0,
                "delivery_days": 10,
                "vendor_rating": 4.0
            },
            {
                "id": "q2",
                "vendor_id": "v2",
                "vendor_name": "FurniTwo",
                "unit_price": 150.0,
                "delivery_days": 5,
                "vendor_rating": 5.0
            },
            {
                "id": "q3",
                "vendor_id": "v3",
                "vendor_name": "FurniThree",
                "unit_price": 80.0,
                "delivery_days": 12,
                "vendor_rating": 3.0
            }
        ]
    }
    response = client.post("/rank-quotations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert [item["rank"] for item in data] == [1, 2, 3]

    assert data[0]["quotation_id"] == "q1"
    assert data[0]["total_score"] == 61.14
    assert "Best Overall ⭐" in data[0]["badge"]

    assert data[1]["quotation_id"] == "q2"
    assert "Fastest 🚀" in data[1]["badge"]

    assert data[2]["quotation_id"] == "q3"
    assert "Best Price 💰" in data[2]["badge"]


def test_rank_quotations_single():
    payload = {
        "rfq_id": "rfq-202",
        "quotations": [
            {
                "id": "q1",
                "vendor_id": "v1",
                "vendor_name": "FurniOne",
                "unit_price": 100.0,
                "delivery_days": 10,
                "vendor_rating": 4.0
            }
        ]
    }
    response = client.post("/rank-quotations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["rank"] == 1
    assert data[0]["total_score"] == 100.0
    assert data[0]["badge"] == "Best Overall ⭐"


def test_rank_quotations_exception_fallback():
    payload = {
        "rfq_id": "rfq-203",
        "quotations": [
            {
                "id": "q1",
                "vendor_id": "v1",
                "vendor_name": "FurniOne",
                "unit_price": 100.0,
                "delivery_days": 10,
                "vendor_rating": 4.0
            },
            {
                "id": "q2",
                "vendor_id": "v2",
                "vendor_name": "FurniTwo",
                "unit_price": 80.0,
                "delivery_days": 5,
                "vendor_rating": 5.0
            }
        ]
    }
    with patch("routers.rank.score_quotation", side_effect=Exception("Test Exception")):
        response = client.post("/rank-quotations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Fallback sorts by unit_price ascending: q2 (80.0) first, then q1 (100.0)
    assert data[0]["quotation_id"] == "q2"
    assert data[0]["badge"] == "Best Price 💰"
    assert data[1]["quotation_id"] == "q1"
    assert data[1]["badge"] == "Competitive"


# ─── Spend Forecaster Tests ───────────────────────────────────────────────────

def test_spend_forecast_success():
    payload = {
        "monthly_spend": [
            {"month": "2026-01", "amount": 10000.0},
            {"month": "2026-02", "amount": 12000.0},
            {"month": "2026-03", "amount": 14000.0},
            {"month": "2026-04", "amount": 16000.0},
            {"month": "2026-05", "amount": 18000.0}
        ]
    }
    response = client.post("/spend-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["trend"] == "increasing"
    assert len(data["forecast"]) == 3
    assert data["forecast"][0]["month"] == "2026-06"
    assert data["forecast"][0]["predicted_amount"] == 20000.0
    assert data["forecast"][1]["month"] == "2026-07"
    assert data["forecast"][1]["predicted_amount"] == 22000.0
    assert data["forecast"][2]["month"] == "2026-08"
    assert data["forecast"][2]["predicted_amount"] == 24000.0
    assert data["forecast"][0]["confidence"] == "high"


def test_spend_forecast_insufficient_data():
    payload = {
        "monthly_spend": [
            {"month": "2026-01", "amount": 10000.0},
            {"month": "2026-02", "amount": 12000.0}
        ]
    }
    response = client.post("/spend-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["forecast"] == []
    assert data["trend"] == "stable"


def test_spend_forecast_exception_fallback():
    payload = {
        "monthly_spend": [
            {"month": "2026-01", "amount": 10000.0},
            {"month": "2026-02", "amount": 12000.0},
            {"month": "2026-03", "amount": 14000.0}
        ]
    }
    with patch("routers.forecast.np.polyfit", side_effect=Exception("Test Exception")):
        response = client.post("/spend-forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["forecast"]) == 3
    assert data["trend"] == "stable"
    assert data["forecast"][0]["predicted_amount"] == 14000.0
    assert data["forecast"][0]["confidence"] == "low"
