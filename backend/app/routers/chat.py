from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from dotenv import load_dotenv
from app.services.data_processing import get_dashboard_summary, load_existing_data
from app.utils.auth import get_current_user

load_dotenv()

router = APIRouter()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = "llama-3.1-8b-instant"
    include_context: Optional[bool] = True

@router.post("/")
async def chat_with_ai(request: ChatRequest, user=Depends(get_current_user)):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
    
    try:
        # Construct a system message
        system_content = (
            "You are FinMate AI, a helpful and concise financial assistant. "
            "ALWAYS format your output using Markdown. Use **bolding** for amounts and category names. "
            "Use bullet points for lists. Be direct and actionable. "
            "Minimize token usage. You have access to the user's financial overview."
        )

        # Context-Aware Intelligence: Inject user data
        if request.include_context:
            try:
                summary_data = get_dashboard_summary(user.id)
                full_data = load_existing_data(user.id)
                
                if summary_data:
                    summary = summary_data.get("summary", {})
                    cat_breakdown = summary_data.get("category_breakdown", {})
                    top_cats = sorted(cat_breakdown.items(), key=lambda x: x[1], reverse=True)[:3]
                    cats_str = ", ".join([f"{c}: ₹{v}" for c, v in top_cats])
                    
                    transactions = full_data.get("transactions", [])
                    anomalies = [t for t in transactions if t.get("is_anomaly")]
                    
                    context_str = (
                        f"\n\nUSER FINANCIAL SNAPSHOT:\n"
                        f"- Total Expenses: ₹{summary.get('total_expenses', 0):,.2f}\n"
                        f"- Total Income: ₹{summary.get('total_income', 0):,.2f}\n"
                        f"- Top Spending: {cats_str}\n"
                        f"- Recent Anomalies: {len(anomalies)} detected\n"
                        f"Personalize your advice using this data."
                    )
                    system_content += context_str
            except Exception as context_err:
                print(f"Chat Context Error: {context_err}")

        # Prepare messages for API
        api_messages = [{"role": "system", "content": system_content}]
        api_messages.extend([m.model_dump() for m in request.messages])

        # Call Groq API directly via HTTPX to bypass SDK version conflicts
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": request.model,
                    "messages": api_messages,
                    "temperature": 0.4,
                    "max_tokens": 400
                }
            )
            
            if response.status_code != 200:
                error_detail = response.json().get("error", {}).get("message", "Unknown API Error")
                raise HTTPException(status_code=response.status_code, detail=f"Groq API Error: {error_detail}")
            
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            
            return {
                "response": ai_response,
                "model": request.model,
                "context_applied": request.include_context
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {str(e)}")
