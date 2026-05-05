from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Body
from pydantic import BaseModel
from app.services.data_processing import process_csv_transactions, add_manual_transaction, clear_all_data, update_transaction_category
from app.utils.auth import get_current_user

router = APIRouter()

class ManualTransaction(BaseModel):
    date: str
    description: str
    amount: float

@router.delete("/")
async def reset_transactions(user=Depends(get_current_user)):
    try:
        result = clear_all_data(user.id)
        return {
            "status": "success",
            "message": "All transactions cleared.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_transactions(file: UploadFile = File(...), user=Depends(get_current_user)):
    allowed_extensions = ('.csv', '.xlsx', '.xls')
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail=f"Invalid file type. Please upload {', '.join(allowed_extensions)}.")
    
    try:
        contents = await file.read()
        # Pass raw bytes and filename to the processing service
        result = process_csv_transactions(contents, user.id, file.filename)
        
        return {
            "status": "success",
            "message": f"Processed {len(result['transactions'])} transactions.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual")
async def create_manual_transaction(tx: ManualTransaction, user=Depends(get_current_user)):
    try:
        result = add_manual_transaction(tx.dict(), user.id)
        return {
            "status": "success",
            "message": "Transaction added successfully.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{transaction_id}/category")
async def patch_transaction_category(
    transaction_id: str, 
    category: str = Body(..., embed=True), 
    user=Depends(get_current_user)
):
    try:
        result = update_transaction_category(transaction_id, category, user.id)
        if not result:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return {
            "status": "success",
            "message": "Category updated and learned.",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
