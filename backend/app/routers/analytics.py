from fastapi import APIRouter, HTTPException, Depends
from app.services.data_processing import get_dashboard_summary, get_anomalies, load_existing_data
from app.utils.auth import get_current_user

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard(user=Depends(get_current_user)):
    try:
        data = get_dashboard_summary(user.id)
        # Merge with full transaction list from persistence
        db_data = load_existing_data(user.id)
        data["transactions"] = db_data.get("transactions", [])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights")
async def get_insights(user=Depends(get_current_user)):
    # Returns anomalies with human-readable explanations
    anomalies = get_anomalies(user.id)
    return anomalies
