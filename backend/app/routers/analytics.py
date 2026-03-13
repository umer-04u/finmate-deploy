from fastapi import APIRouter
from app.services.data_processing import get_dashboard_summary, get_anomalies

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard():
    # In Phase 1, reads the last processed in-memory or saved JSON cache
    # In Phase 2, queries PostgreSQL
    data = get_dashboard_summary()
    return data

@router.get("/insights")
async def get_insights():
    # Returns anomalies with human-readable explanations
    anomalies = get_anomalies()
    return anomalies
