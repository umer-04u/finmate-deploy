from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import pandas as pd
import io
import json
from app.services.data_processing import process_csv_transactions, add_manual_transaction, clear_all_data

router = APIRouter()
...
@router.delete("/")
async def reset_transactions():
    try:
        result = clear_all_data()
        return {
            "status": "success",
            "message": "All transactions cleared.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ManualTransaction(BaseModel):
    date: str
    description: str
    amount: float

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV.")
    
    try:
        contents = await file.read()
        
        # Pass raw bytes to the processing service for robust parsing
        result = process_csv_transactions(contents)
        
        return {
            "status": "success",
            "message": f"Processed {len(result['transactions'])} transactions.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual")
async def create_manual_transaction(tx: ManualTransaction):
    try:
        result = add_manual_transaction(tx.dict())
        return {
            "status": "success",
            "message": "Transaction added successfully.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
