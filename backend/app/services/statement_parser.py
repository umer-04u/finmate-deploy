import pandas as pd
import io
import csv
import numpy as np
import re

def is_header(cols):
    """
    Checks if a list of column names looks like a bank statement transaction header.
    Strictly requires a 'date' field and at least one other financial field.
    """
    cols_str = " ".join([str(c).lower() for c in cols])
    
    # Essential check 1: Must contain a 'date' keyword
    has_date = any(k in cols_str for k in ['date', 'txn date', 'value date'])
    if not has_date:
        return False
        
    # Essential check 2: Must contain at least one amount/description/narrative keyword
    financial_keywords = ['amount', 'debit', 'credit', 'withdrawal', 'deposit', 'description', 'narrative', 'particulars', 'remarks']
    has_financial = any(k in cols_str for k in financial_keywords)
    if not has_financial:
        return False

    # Check for keywords matches
    keywords = ['date', 'amount', 'description', 'transaction', 'narrative', 'memo', 'value', 'details', 'debit', 'credit', 'particulars', 'remarks', 'balance']
    matches = sum(1 for k in keywords if k in cols_str)
    
    # Real headers usually have at least 3-4 columns minimum
    if len(cols) < 3:
        return False

    return matches >= 2

def infer_columns_from_data(df: pd.DataFrame, found_mapping: dict) -> pd.DataFrame:
    """
    If no header was found, we try to identify columns by looking at the actual data.
    """
    if df.empty:
        return df

    # If we already found debit/credit, we don't strictly need 'amount' yet, we will calculate it later.
    has_debit_credit = ('debit' in found_mapping.values() and 'credit' in found_mapping.values()) or \
                       ('debit' in df.columns and 'credit' in df.columns)
    
    # Check if we already have the essentials
    has_date = 'date' in found_mapping.values() or 'date' in df.columns
    has_desc = 'description' in found_mapping.values() or 'description' in df.columns
    has_amt = 'amount' in found_mapping.values() or 'amount' in df.columns
    
    if has_date and has_desc and (has_amt or has_debit_credit):
        return df

    mapping = {}
    sample_rows = [df.columns.tolist()] + df.head(5).values.tolist()
    
    # 1. Find Date column
    if not has_date:
        date_regex = r'(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})'
        for col_idx in range(len(df.columns)):
            date_matches = 0
            for row in sample_rows:
                if len(row) > col_idx and re.search(date_regex, str(row[col_idx])):
                    date_matches += 1
            if date_matches >= 2:
                mapping[df.columns[col_idx]] = 'date'
                break
            
    # 2. Find Amount column
    if not has_amt and not has_debit_credit:
        for col_idx in range(len(df.columns)):
            if df.columns[col_idx] in mapping: continue
            
            amount_matches = 0
            for row in sample_rows:
                if len(row) <= col_idx: continue
                val = str(row[col_idx]).replace(',', '').replace('_', '.') 
                try:
                    clean_val = re.sub(r'[^0-9.-]', '', val)
                    if clean_val:
                        float(clean_val)
                        amount_matches += 1
                except:
                    pass
            if amount_matches >= 2:
                mapping[df.columns[col_idx]] = 'amount'
                break
            
    # 3. Find Description
    if not has_desc:
        potential_desc_cols = []
        for col_idx in range(len(df.columns)):
            col_name = df.columns[col_idx]
            if col_name in mapping: continue
            
            avg_len = sum(len(str(row[col_idx])) for row in sample_rows if len(row) > col_idx) / len(sample_rows)
            potential_desc_cols.append((col_name, avg_len))

        if potential_desc_cols:
            best_desc_col = max(potential_desc_cols, key=lambda x: x[1])[0]
            mapping[best_desc_col] = 'description'

    if mapping:
        first_row_data = df.columns.tolist()
        df.columns = [f"col_{i}" for i in range(len(df.columns))]
        first_row_df = pd.DataFrame([first_row_data], columns=df.columns)
        df = pd.concat([first_row_df, df], ignore_index=True)
        
        new_cols = list(df.columns)
        for old_col, new_name in mapping.items():
            idx = first_row_data.index(old_col) if old_col in first_row_data else -1
            if idx != -1:
                new_cols[idx] = new_name
        
        df.columns = new_cols
        
    return df

def robust_read_statement(contents: bytes, filename: str = "") -> pd.DataFrame:
    """
    Attempts to read CSV or XLSX by skipping metadata rows and handling encodings.
    Evaluates multiple potential headers to find the actual transaction table.
    """
    if filename.endswith('.xlsx') or filename.endswith('.xls'):
        try:
            for skip in range(50):
                df = pd.read_excel(io.BytesIO(contents), skiprows=skip)
                if is_header(df.columns):
                    return df
            return pd.read_excel(io.BytesIO(contents))
        except Exception as e:
            raise ValueError(f"Could not read Excel file: {str(e)}")

    encodings = ['utf-8-sig', 'utf-8', 'latin1', 'cp1252']
    for enc in encodings:
        try:
            contents_decoded = contents.decode(enc)
            raw_text = contents_decoded.splitlines()

            potential_headers = []
            reader = csv.reader(raw_text[:100])
            for i, parts in enumerate(reader):
                if is_header(parts):
                    cols_str = " ".join([str(p).lower() for p in parts])
                    keywords = ['date', 'amount', 'description', 'particulars', 'debit', 'credit', 'balance', 'narrative']
                    score = sum(1 for k in keywords if k in cols_str)
                    potential_headers.append((i, score, parts))

            if potential_headers:
                best_match = max(potential_headers, key=lambda x: (x[1], x[0]))
                return pd.read_csv(io.StringIO(contents_decoded), skiprows=best_match[0])

            return pd.read_csv(io.StringIO(contents_decoded))
        except Exception:
            continue
    raise ValueError("Could not decode CSV file with supported encodings.")

def clean_statement_df(df: pd.DataFrame) -> pd.DataFrame:
    """Standardizes columns, dates, and amounts from various bank formats."""
    df.columns = df.columns.astype(str).str.lower().str.replace(' ', '_').str.replace('-', '_').str.replace('.', '_').str.replace('\n', '_')
    
    column_mappings = {
        'date': ['transaction_date', 'date', 'txn_date', 'value_date', 'booking_date', 'posted_date'],
        'description': ['memo', 'description', 'narrative', 'txn_details', 'transaction_details', 'remarks', 'payee', 'details', 'particulars'],
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
    
    required = ['date', 'description', 'amount']
    if not all(col in df.columns for col in required):
        df = infer_columns_from_data(df, found_mapping)

    if 'debit' in df.columns and 'credit' in df.columns and 'amount' not in df.columns:
        def clean_fin_val(val):
            val = str(val).replace('$', '').replace(',', '')
            if '_' in val and re.search(r'\d_\d', val):
                val = val.replace('_', '.')
            return val

        df['debit'] = df['debit'].apply(clean_fin_val)
        df['credit'] = df['credit'].apply(clean_fin_val)
        
        df['debit_num'] = pd.to_numeric(df['debit'], errors='coerce').fillna(0)
        df['credit_num'] = pd.to_numeric(df['credit'], errors='coerce').fillna(0)
        df['amount'] = df['credit_num'] - df['debit_num']
        df['amount'] = df.apply(lambda r: r['amount'] if (pd.notna(pd.to_numeric(r['debit'], errors='coerce')) or pd.notna(pd.to_numeric(r['credit'], errors='coerce'))) else np.nan, axis=1)

    if 'amount' not in df.columns:
        for col in df.columns:
            if 'amount' in col or 'amt' in col: 
                df.rename(columns={col: 'amount'}, inplace=True)
                break

    if not all(col in df.columns for col in required):
        raise ValueError(f"Could not identify required columns {required} in CSV. Found: {df.columns.tolist()}")

    def clean_amount(val):
        val = str(val).replace('$', '').replace(',', '')
        if '_' in val and re.search(r'\d_\d', val):
            val = val.replace('_', '.')
        return val

    df['amount'] = df['amount'].apply(clean_amount)
    df['amount'] = df['amount'].str.replace(r'\(', '-', regex=True).str.replace(r'\)', '', regex=True)
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
    
    df['date'] = pd.to_datetime(df['date'], errors='coerce', dayfirst=True)
    df = df.dropna(subset=['date', 'amount'])
    df['description'] = df['description'].astype(str).str.strip().str.upper()
    
    return df[required]
