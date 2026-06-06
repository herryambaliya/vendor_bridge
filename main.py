import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recommend, rank, forecast

# Load environment variables from .env relative to this file
dotenv_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

env = os.getenv("ENV", "development").lower()
allowed_origin = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")
origins = [origin.strip() for origin in allowed_origin.split(",")]

docs_url = "/docs" if env == "development" else None
redoc_url = "/redoc" if env == "development" else None

app = FastAPI(
    title="VendorBridge AI Service",
    description="AI microservice for vendor recommendation, quotation ranking, and spend forecasting",
    version="1.0.0",
    docs_url=docs_url,
    redoc_url=redoc_url,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend.router)
app.include_router(rank.router)
app.include_router(forecast.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "vendorbridge-ai"}


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    reload_mode = (env == "development")
    
    print(f"[AI] Starting server on {host}:{port} in {env} mode (reload={reload_mode})...")
    uvicorn.run("main:app", host=host, port=port, reload=reload_mode)
