import pandas as pd
import numpy as np
import os
import json
from datetime import datetime

# We will import ML modules (create these next)
from app.ml.categorization import categorize_transactions
from app.ml.anomaly_detection import detect_anomalies
from app.ml.forecasting import generate_forecast

# Global cache for Phase 1 offline DB
_latest_processed_data = None

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes columns, dates, and amounts."""
    # Rename commonly used CSV columns to lower snake_case
    df.columns = df.columns.astype(str).str.lower().str.replace(' ', '_').str.replace('-', '_')
    
    # Identify key columns mapping
    # Assume we strictly need: date, description, amount
    if 'date' not in df.columns or 'description' not in df.columns or 'amount' not in df.columns:
        # Try to find fallbacks
        if 'transaction_date' in df.columns: df.rename(columns={'transaction_date': 'date'}, inplace=True)
        if 'memo' in df.columns: df.rename(columns={'memo': 'description'}, inplace=True)
        # Add more mappings as needed
        
    required = ['date', 'description', 'amount']
    if not all(col in df.columns for col in required):
        raise ValueError(f"CSV must contain at least: {required}. Found: {df.columns.tolist()}")

    # Clean amount (remove $, commas, make numeric)
    df['amount'] = df['amount'].astype(str).str.replace(r'[$,]', '', regex=True).astype(float)
    
    # Parse dates
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df = df.dropna(subset=['date', 'amount']) # Drop severe invalid rows
    
    # Normalize string
    df['description'] = df['description'].astype(str).str.strip().str.upper()
    
    return df

def process_csv_transactions(raw_df: pd.DataFrame) -> dict:

    global _latest_processed_data

    df = clean_dataframe(raw_df)

    # 1. Categorize
    df = categorize_transactions(df)

    # 2. Anomaly Detection
    df = detect_anomalies(df)

    # 3. Convert date to JSON-safe format
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')

    # Replace NaN values
    df = df.replace({np.nan: None})

    transactions_list = df.to_dict(orient='records')

    # -----------------------------
    # FIXED SUMMARY CALCULATION
    # -----------------------------

    total_income = df.loc[df['type'] == 'income', 'amount'].sum()

    total_expenses = df.loc[df['type'] == 'expense', 'amount'].sum()

    anomalies = df[df['is_anomaly'] == True].to_dict(orient='records')

    if total_income > 0:
        savings_rate = (total_income - total_expenses) / total_income * 100
    else:
        savings_rate = 0

    result = {
        "transactions": transactions_list,
        "summary": {
            "total_income": float(round(total_income, 2)),
            "total_expenses": float(round(total_expenses, 2)),
            "savings_rate": round(savings_rate, 2),
            "anomalies_detected": len(anomalies)
        }
    }

    _latest_processed_data = result

    # Save JSON mock DB
    with open('app/data/latest_db.json', 'w') as f:
        json.dump(result, f)

    return result

def get_dashboard_summary():
    try:
        global _latest_processed_data

        if not _latest_processed_data:
            if os.path.exists('app/data/latest_db.json'):
                with open('app/data/latest_db.json', 'r') as f:
                    _latest_processed_data = json.load(f)
            else:
                return {"error": "No data uploaded yet. Please upload a CSV."}

        txs = pd.DataFrame(_latest_processed_data["transactions"])

        print("TXS DATAFRAME:")
        print(txs.head())

        if txs.empty:
            return {"error": "No transactions found"}

        txs['date'] = pd.to_datetime(txs['date'])
        txs['month'] = txs['date'].dt.strftime('%b %Y')

        expenses = txs[txs['type'] == 'expense'].copy()

        category_totals = expenses.groupby('category')['amount'].sum().to_dict()

        monthly_trend = (
            expenses.groupby('month')['amount']
            .sum()
            .reset_index()
            .rename(columns={'amount': 'spent'})
            .to_dict(orient='records')
        )

        forecast = generate_forecast(monthly_trend)

        return {
            "status": "success",
            "category_breakdown": category_totals,
            "monthly_trend": monthly_trend,
            "forecast": forecast
        }

    except Exception as e:
        print("ERROR IN DASHBOARD:", str(e))
        raise e

def get_anomalies():
    """Returns just the flagged anomalies for the insights endpoint."""
    global _latest_processed_data
    if not _latest_processed_data:
        return []
        
    txs = _latest_processed_data["transactions"]
    anomalies = [t for t in txs if t.get('is_anomaly') == True]
    return anomalies
