from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

try:
    from app.routers import transactions, analytics, chat
except ImportError:
    from .routers import transactions, analytics, chat

app = FastAPI(
    title="FINMATE API",
    description="AI-Powered Budget & Expenditure Analysis System Backend",
    version="1.0.0"
)

# CORS mapping
# In a unified deployment, the frontend is served from the same origin as the API.
# We include localhost for development and a wildcard for onrender subdomains.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex="https://.*\.onrender\.com", # Robustly allow all Render subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

# Serve Static Files (for combined deployment)
# To use this: Build frontend, copy 'dist' content to 'backend/static'
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")

@app.get("/api/health")
def read_root():
    return {"status": "ok", "message": "FINMATE API operational."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
