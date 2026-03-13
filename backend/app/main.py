from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from app.routers import transactions, analytics
except ImportError:
    from .routers import transactions, analytics

app = FastAPI(
    title="FINMATE API",
    description="AI-Powered Budget & Expenditure Analysis System Backend",
    version="1.0.0"
)

# CORS mapping to allow Vite React Frontend (Port 5173 by default)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*" # Replace in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(transactions.router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "FINMATE API operational. Use /docs to view Swagger UI."}

if __name__ == "__main__":
    import uvicorn
    # When running from within app/, we need to tell uvicorn to look at app.main if we are in the root
    # or just main if we are inside app. 
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
