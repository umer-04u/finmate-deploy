import pandas as pd
import numpy as np
import os
import io
import json
from datetime import datetime

# We will import ML modules (create these next)
from app.ml.categorization import categorize_transactions
from app.ml.anomaly_detection import detect_anomalies
from app.ml.forecasting import generate_forecast

# Global cache for Phase 1 offline DB
_latest_processed_data = None

def robust_read_csv(contents: bytes) -> pd.DataFrame:
    """
    Attempts to read CSV by skipping metadata rows and handling encodings.
    """
    encodings = ['utf-8-sig', 'utf-8', 'latin1', 'cp1252']
    
    for enc in encodings:
        try:
            # First, try to read without skipping to see if the first row is the header
            df = pd.read_csv(io.BytesIO(contents), encoding=enc)
            
            # Helper to check if a row looks like a header
            def is_header(cols):
                cols_str = " ".join([str(c).lower() for c in cols])
                keywords = ['date', 'amount', 'description', 'transaction', 'narrative', 'memo', 'value']
                matches = [k for k in keywords if k in cols_str]
                return len(matches) >= 2 # If at least 2 keywords match, it's likely the header

            if is_header(df.columns):
                return df
                
            # If not, scan the first 50 rows to find the actual header
            raw_text = contents.decode(enc).splitlines()
            for i, line in enumerate(raw_text[:50]):

                parts = line.split(',')
                if is_header(parts):
                    # Found the header! Re-read from this row
                    return pd.read_csv(io.BytesIO(contents), encoding=enc, skiprows=i)
            
            # If still not found, return the original df and hope clean_dataframe finds something
            return df
        except Exception:
            continue
            
    raise ValueError("Could not decode CSV file with supported encodings.")

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes columns, dates, and amounts from various bank formats."""
    # Normalize column names
    df.columns = df.columns.astype(str).str.lower().str.replace(' ', '_').str.replace('-', '_').str.replace('.', '_')
    
    # Mapping of common bank CSV column names
    column_mappings = {
        'date': ['transaction_date', 'date', 'txn_date', 'value_date', 'booking_date', 'posted_date'],
        'description': ['memo', 'description', 'narrative', 'txn_details', 'transaction_details', 'remarks', 'payee'],
        'amount': ['amount', 'txn_amount', 'transaction_amount', 'debit/credit', 'value', 'withdrawal', 'deposit']
    }
    
    found_mapping = {}
    for target, aliases in column_mappings.items():
        for alias in aliases:
            if alias in df.columns:
                found_mapping[alias] = target
                break
    
    if len(found_mapping) < 3:
        # If we didn't find all 3, try fuzzy matching or look for any column that looks like a date/amount
        if 'date' not in found_mapping.values():
            for col in df.columns:
                if 'date' in col: found_mapping[col] = 'date'; break
        if 'amount' not in found_mapping.values():
            for col in df.columns:
                if 'amount' in col or 'amt' in col: found_mapping[col] = 'amount'; break
        if 'description' not in found_mapping.values():
            for col in df.columns:
                if 'desc' in col or 'memo' in col or 'detail' in col: found_mapping[col] = 'description'; break

    df.rename(columns=found_mapping, inplace=True)
    
    required = ['date', 'description', 'amount']
    if not all(col in df.columns for col in required):
        raise ValueError(f"Could not identify required columns {required} in CSV. Found: {df.columns.tolist()}")

    # Clean amount (remove $, commas, handle (100.00) for negative)
    df['amount'] = df['amount'].astype(str).str.replace(r'[$,]', '', regex=True)
    df['amount'] = df['amount'].str.replace(r'\(', '-', regex=True).str.replace(r'\)', '', regex=True)
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    
    # Parse dates with multiple formats
    df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
    df = df.dropna(subset=['date', 'amount'])
    
    # Normalize string
    df['description'] = df['description'].astype(str).str.strip().str.upper()
    
    return df[required]

def load_existing_data():
    if os.path.exists('app/data/latest_db.json'):
        try:
            with open('app/data/latest_db.json', 'r') as f:
                return json.load(f)
        except:
            return {"transactions": [], "summary": {}}
    return {"transactions": [], "summary": {}}

def save_data(data):
    with open('app/data/latest_db.json', 'w') as f:
        json.dump(data, f)

def merge_and_process_transactions(new_df: pd.DataFrame) -> dict:
    """Core logic to categorize, merge, run anomalies, and save."""
    global _latest_processed_data

    # 1. Categorize new data
    new_df = categorize_transactions(new_df)

    # 2. Load existing
    existing_data = load_existing_data()
    existing_df = pd.DataFrame(existing_data.get("transactions", []))

    # 3. Merge
    if not existing_df.empty:
        existing_df['date'] = pd.to_datetime(existing_df['date'])
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        combined_df = combined_df.drop_duplicates(subset=['date', 'description', 'amount'])
    else:
        combined_df = new_df

    # 4. Re-run Anomaly Detection on whole history
    combined_df = detect_anomalies(combined_df)

    # 5. Sort by date newest first
    combined_df = combined_df.sort_values(by='date', ascending=False)

    # 6. Finalize
    combined_df['date'] = combined_df['date'].dt.strftime('%Y-%m-%d')
    combined_df = combined_df.replace({np.nan: None})
    transactions_list = combined_df.to_dict(orient='records')

    # Summary
    total_income = combined_df.loc[combined_df['type'] == 'income', 'amount'].sum()
    total_expenses = combined_df.loc[combined_df['type'] == 'expense', 'amount'].sum()
    anomalies_count = len(combined_df[combined_df['is_anomaly'] == True])

    savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0

    result = {
        "status": "success",
        "transactions": transactions_list,
        "summary": {
            "total_income": float(round(total_income, 2)),
            "total_expenses": float(round(total_expenses, 2)),
            "savings_rate": round(savings_rate, 2),
            "anomalies_detected": anomalies_count
        }
    }

    _latest_processed_data = result
    save_data(result)

    # Re-calculate charts/trends for instant UI update
    try:
        dashboard_stats = get_dashboard_summary()
        if "error" not in dashboard_stats:
            result.update(dashboard_stats)
    except:
        pass

    return result

def process_csv_transactions(contents: bytes) -> dict:
    # 1. Robustly read CSV
    raw_df = robust_read_csv(contents)

    # 2. Clean and standardize
    new_df = clean_dataframe(raw_df)
    new_df['is_manual'] = False
    
    return merge_and_process_transactions(new_df)

def clear_all_data() -> dict:
    """Resets the transaction database."""
    global _latest_processed_data
    empty_data = {"transactions": [], "summary": {}}
    _latest_processed_data = empty_data
    save_data(empty_data)
    return empty_data

def add_manual_transaction(tx_data: dict) -> dict:
    """Adds a single manual transaction and re-processes everything."""
    new_row = pd.DataFrame([tx_data])
    new_row['date'] = pd.to_datetime(new_row['date'])
    new_row['amount'] = pd.to_numeric(new_row['amount'])
    new_row['is_manual'] = True
    
    return merge_and_process_transactions(new_row)

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
