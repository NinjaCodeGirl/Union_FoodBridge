from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import donations, ngo, qr, analytics, calls, ratings

app = FastAPI(
    title=settings.APP_NAME,
    description="End-to-End AI-Powered Surplus Food Redistribution Ecosystem & Verification Ledger",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api prefix
app.include_router(donations.router, prefix="/api")
app.include_router(ngo.router, prefix="/api")
app.include_router(qr.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(calls.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")

@app.get("/api/health", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "version": "1.0.0",
    }
