import pandas as pd
import io
import csv
import numpy as np

def is_header(cols):
    cols_str = " ".join([str(c).lower() for c in cols])
    keywords = ['date', 'amount', 'description', 'transaction', 'narrative', 'memo', 'value', 'details', 'debit', 'credit']
    matches = [k for k in keywords if k in cols_str]
    return len(matches) >= 2 

def robust_read_statement(contents: bytes, filename: str = "") -> pd.DataFrame:
    """
    Attempts to read CSV or XLSX by skipping metadata rows and handling encodings.
    """
    # 1. Handle XLSX
    if filename.endswith('.xlsx') or filename.endswith('.xls'):
        try:
            for skip in range(50):
                df = pd.read_excel(io.BytesIO(contents), skiprows=skip)
                if is_header(df.columns):
                    return df
            return pd.read_excel(io.BytesIO(contents))
        except Exception as e:
            raise ValueError(f"Could not read Excel file: {str(e)}")

    # 2. Handle CSV
    encodings = ['utf-8-sig', 'utf-8', 'latin1', 'cp1252']
    for enc in encodings:
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding=enc)
            if is_header(df.columns):
                return df
                
            raw_text = contents.decode(enc).splitlines()
            for i, line in enumerate(raw_text[:100]):
                parts = next(csv.reader([line]))
                if is_header(parts):
                    return pd.read_csv(io.BytesIO(contents), encoding=enc, skiprows=i)
            return df
        except Exception:
            continue
    raise ValueError("Could not decode CSV file with supported encodings.")

def clean_statement_df(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes columns, dates, and amounts from various bank formats."""
    df.columns = df.columns.astype(str).str.lower().str.replace(' ', '_').str.replace('-', '_').str.replace('.', '_')
    
    column_mappings = {
        'date': ['transaction_date', 'date', 'txn_date', 'value_date', 'booking_date', 'posted_date'],
        'description': ['memo', 'description', 'narrative', 'txn_details', 'transaction_details', 'remarks', 'payee', 'details'],
        'amount': ['amount', 'txn_amount', 'transaction_amount', 'value', 'withdrawal', 'deposit'],
        'debit': ['debit', 'dr'],
        'credit': ['credit', 'cr']
    }
    
    found_mapping = {}
    for target, aliases in column_mappings.items():
        for alias in aliases:
            if alias in df.columns:
                found_mapping[alias] = target
                break
    
    if 'debit/credit' in df.columns and 'amount' not in found_mapping.values():
         found_mapping['debit/credit'] = 'amount'

    df.rename(columns=found_mapping, inplace=True)
    
    if 'debit' in df.columns and 'credit' in df.columns and 'amount' not in df.columns:
        df['debit'] = pd.to_numeric(df['debit'].astype(str).str.replace(r'[$,]', '', regex=True), errors='coerce').fillna(0)
        df['credit'] = pd.to_numeric(df['credit'].astype(str).str.replace(r'[$,]', '', regex=True), errors='coerce').fillna(0)
        df['amount'] = df['credit'] - df['debit']
        df['amount'] = df['amount'].apply(lambda x: x if x != 0 else np.nan)

    if 'amount' not in df.columns:
        for col in df.columns:
            if 'amount' in col or 'amt' in col: 
                df.rename(columns={col: 'amount'}, inplace=True)
                break

    required = ['date', 'description', 'amount']
    if not all(col in df.columns for col in required):
        raise ValueError(f"Could not identify required columns {required} in CSV. Found: {df.columns.tolist()}")

    df['amount'] = df['amount'].astype(str).str.replace(r'[$,]', '', regex=True)
    df['amount'] = df['amount'].str.replace(r'\(', '-', regex=True).str.replace(r'\)', '', regex=True)
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    
    df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
    df = df.dropna(subset=['date', 'amount'])
    df['description'] = df['description'].astype(str).str.strip().str.upper()
    
    return df[required]
