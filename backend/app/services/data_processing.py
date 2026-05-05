import pandas as pd
import numpy as np
from app.ml.categorization import categorize_transactions, clean_text
from app.ml.anomaly_detection import detect_anomalies
from app.ml.forecasting import generate_forecast
from app.services.statement_parser import robust_read_statement, clean_statement_df
from app.services.persistence import (
    load_transactions, save_transactions, delete_all_transactions,
    get_category_learned_mappings, save_category_learning, 
    update_db_transaction_category, get_db_transaction
)

def merge_and_process_transactions(new_df: pd.DataFrame, user_id: str) -> dict:
    """Core logic to categorize, merge, run anomalies, and save."""
    learned_mappings = get_category_learned_mappings(user_id)

    if not new_df.empty:
        new_df = categorize_transactions(new_df, learned_mappings)

    existing_data = load_transactions(user_id)
    existing_df = pd.DataFrame(existing_data)

    if not existing_df.empty:
        existing_df['date'] = pd.to_datetime(existing_df['date'])
        if not new_df.empty:
            new_df['date'] = pd.to_datetime(new_df['date'])
            combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        else:
            combined_df = existing_df
            
        if "original_description" in combined_df.columns:
             combined_df["description_for_cat"] = combined_df["original_description"].fillna(combined_df["description"])
        else:
             combined_df["description_for_cat"] = combined_df["description"]
             
        combined_df["description"] = combined_df["description_for_cat"]
        combined_df = categorize_transactions(combined_df, learned_mappings)
        combined_df = combined_df.drop_duplicates(subset=['date', 'original_description', 'amount'])
        combined_df.drop(columns=["description_for_cat"], inplace=True, errors="ignore")
    else:
        combined_df = new_df
        if not combined_df.empty:
            combined_df['date'] = pd.to_datetime(combined_df['date'])

    combined_df = detect_anomalies(combined_df)
    combined_df = combined_df.sort_values(by='date', ascending=False)
    combined_df['date'] = combined_df['date'].dt.strftime('%Y-%m-%d')
    combined_df = combined_df.replace({np.nan: None})
    
    if "clean_description" in combined_df.columns:
        combined_df = combined_df.drop(columns=["clean_description"])
    
    # Ensure id column exists and replace NaN with None for new records
    if 'id' in combined_df.columns:
        combined_df['id'] = combined_df['id'].replace({np.nan: None})
    
    transactions_list = combined_df.to_dict(orient='records')
    # Save to Supabase and get the records back (with IDs)
    transactions_list = save_transactions(transactions_list, user_id)

    # Re-sort after save because upsert might return in different order
    transactions_list.sort(key=lambda x: x['date'], reverse=True)

    result = {
        "transactions": transactions_list,
        "summary": calculate_summary(pd.DataFrame(transactions_list))
    }

    stats = get_dashboard_summary(user_id)
    result.update(stats)
    return result

def calculate_summary(df: pd.DataFrame):
    total_income = df.loc[df['type'] == 'income', 'amount'].sum()
    total_expenses = df.loc[df['type'] == 'expense', 'amount'].sum()
    anomalies_count = len(df[df['is_anomaly'] == True])
    savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0
    return {
        "total_income": float(round(total_income, 2)),
        "total_expenses": float(round(total_expenses, 2)),
        "savings_rate": round(savings_rate, 2),
        "anomalies_detected": anomalies_count
    }

def process_csv_transactions(contents: bytes, user_id: str, filename: str = "") -> dict:
    raw_df = robust_read_statement(contents, filename)
    new_df = clean_statement_df(raw_df)
    new_df['is_manual'] = False
    return merge_and_process_transactions(new_df, user_id)

def clear_all_data(user_id: str) -> dict:
    delete_all_transactions(user_id)
    return {"transactions": [], "summary": {}}

def add_manual_transaction(tx_data: dict, user_id: str) -> dict:
    new_row = pd.DataFrame([tx_data])
    new_row['date'] = pd.to_datetime(new_row['date'])
    new_row['amount'] = pd.to_numeric(new_row['amount'])
    new_row['is_manual'] = True
    return merge_and_process_transactions(new_row, user_id)

def update_transaction_category(transaction_id: str, new_category: str, user_id: str):
    tx_data = get_db_transaction(transaction_id, user_id)
    if not tx_data:
        return None
    
    raw_desc = tx_data.get('original_description') or tx_data.get('description')
    clean_desc = clean_text(raw_desc)
    update_db_transaction_category(transaction_id, new_category)

    if clean_desc:
        save_category_learning(user_id, clean_desc, new_category)

    return merge_and_process_transactions(pd.DataFrame(), user_id)

def get_dashboard_summary(user_id: str):
    try:
        data = load_transactions(user_id)
        txs = pd.DataFrame(data)
        if txs.empty: return {"error": "No transactions found"}

        txs['date'] = pd.to_datetime(txs['date'])
        txs['month'] = txs['date'].dt.strftime('%b %Y')
        expenses = txs[txs['type'] == 'expense'].copy()
        category_totals = expenses.groupby('category')['amount'].sum().to_dict()
        monthly_trend = (expenses.groupby('month')['amount'].sum().reset_index()
                        .rename(columns={'amount': 'spent'}).to_dict(orient='records'))

        forecast = generate_forecast(monthly_trend)
        summary = calculate_summary(txs)

        return {
            "status": "success",
            "category_breakdown": category_totals,
            "monthly_trend": monthly_trend,
            "forecast": forecast,
            "summary": summary
        }
    except Exception as e:
        return {"error": str(e)}

def get_anomalies(user_id: str):
    data = load_transactions(user_id)
    return [t for t in data if t.get('is_anomaly') == True]

def load_existing_data(user_id: str):
    # Compatibility wrapper
    return {"transactions": load_transactions(user_id)}
