from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
import json
from app.services.data_processing import process_csv_transactions

router = APIRouter()

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Pass to the processing service
        result = process_csv_transactions(df)
        
        return {
            "status": "success",
            "message": f"Processed {len(result['transactions'])} transactions.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
