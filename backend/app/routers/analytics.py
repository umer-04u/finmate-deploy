from fastapi import APIRouter, HTTPException
from app.services.data_processing import get_dashboard_summary, get_anomalies, load_existing_data

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard():
    try:
        data = get_dashboard_summary()
        # Merge with full transaction list from persistence
        db_data = load_existing_data()
        data["transactions"] = db_data.get("transactions", [])
        data["summary"] = db_data.get("summary", {})
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
async def get_insights():
    # Returns anomalies with human-readable explanations
    anomalies = get_anomalies()
    return anomalies
