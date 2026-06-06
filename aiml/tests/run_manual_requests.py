import os
from pathlib import Path
import json
import time
import httpx
from dotenv import load_dotenv

# Load environment variables from .env relative to the root directory
dotenv_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

PORT = os.getenv("PORT", "8000")
HOST = os.getenv("HOST", "127.0.0.1")
BASE_URL = f"http://{HOST}:{PORT}"

def test_local_endpoints():
    # Load demo payloads
    with open("data/demo_payloads.json", "r") as f:
        payloads = json.load(f)

    print("--- 1. Testing GET /health ---")
    r = httpx.get(f"{BASE_URL}/health")
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    print()

    print("--- 2. Testing POST /recommend-vendors ---")
    payload = payloads["recommend_vendors_payload"]
    r = httpx.post(f"{BASE_URL}/recommend-vendors", json=payload)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    print()

    print("--- 3. Testing POST /rank-quotations ---")
    payload = payloads["rank_quotations_payload"]
    r = httpx.post(f"{BASE_URL}/rank-quotations", json=payload)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    print()

    print("--- 4. Testing POST /spend-forecast ---")
    payload = payloads["spend_forecast_payload"]
    r = httpx.post(f"{BASE_URL}/spend-forecast", json=payload)
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json(), indent=2))
    print()

if __name__ == "__main__":
    # Wait for uvicorn to startup (1 second) before running requests
    time.sleep(1.5)
    try:
        test_local_endpoints()
    except Exception as e:
        print(f"Error connecting to FastAPI server: {e}")
