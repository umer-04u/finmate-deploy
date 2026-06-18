import pandas as pd
import os
import sys
import glob
from app.services.statement_parser import robust_read_statement, clean_statement_df
from app.ml.categorization import categorize_transactions, clean_text
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib

def bulk_preprocess(file_paths, output_path="review_training_data.xlsx"):
    """Reads multiple files, categorizes them, and exports to Excel for review."""
    all_txs = []
    
    for path in file_paths:
        print(f"Processing {path}...")
        try:
            with open(path, 'rb') as f:
                contents = f.read()
            
            # Special case for SBI which often has problematic headers
            df = None
            try:
                raw_df = robust_read_statement(contents, path)
                df = clean_statement_df(raw_df)
            except Exception as e:
                print(f"  Standard parser failed, trying deep scan for {path}...")
                # Deep scan fallback for CSV
                if path.endswith('.csv'):
                    for skip in range(100):
                        try:
                            test_df = pd.read_csv(path, skiprows=skip, encoding='latin1')
                            df = clean_statement_df(test_df)
                            if df is not None and len(df) > 0:
                                print(f"  Success! Found header at row {skip}")
                                break
                        except:
                            continue
                
            if df is not None and not df.empty:
                # Run categorization
                processed_df = categorize_transactions(df)
                all_txs.append(processed_df)
            else:
                print(f"  Could not extract data from {path}")
        except Exception as e:
            print(f"Error processing {path}: {e}")
            
    if not all_txs:
        print("No transactions found to process.")
        return
        
    final_df = pd.concat(all_txs, ignore_index=True)
    
    # Select and order columns for easy human review
    columns_for_review = ['date', 'original_description', 'amount', 'category', 'merchant_name', 'payment_method', 'location']
    # Ensure all columns exist
    existing_cols = [c for c in columns_for_review if c in final_df.columns]
    review_df = final_df[existing_cols].copy()
    
    # Save to Excel
    review_df.to_excel(output_path, index=False)
    print(f"\nSUCCESS: Exported {len(review_df)} transactions for review to: {output_path}")
    print("ACTION: Open the file, review the 'category' column, save changes, and then run 'train' mode.")

def train_from_review(review_file_path):
    """Trains the ML model using the corrected data from the review Excel file."""
    print(f"Training from {review_file_path}...")
    try:
        df = pd.read_excel(review_file_path)
    except Exception as e:
        print(f"Error reading {review_file_path}: {e}")
        return

    if 'category' not in df.columns or 'original_description' not in df.columns:
        print("Error: Missing 'category' or 'original_description' columns in the Excel file.")
        return

    # Clean descriptions for training
    df['clean_description'] = df['original_description'].apply(clean_text)
    
    # Remove any rows where category might be empty
    df = df.dropna(subset=['category', 'clean_description'])
    
    print(f"Training on {len(df)} reviewed transactions...")
    
    # Pipeline: TF-IDF -> Random Forest
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=1000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    pipeline.fit(df['clean_description'], df['category'])
    
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'categorizer_model.joblib')
    
    joblib.dump(pipeline, model_path)
    print(f"SUCCESS: Model trained and saved to {model_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  Preprocess: python bank_trainer.py preprocess <folder_or_files>")
        print("  Train:      python bank_trainer.py train <review_excel_file>")
        sys.exit(1)
        
    mode = sys.argv[1]
    
    if mode == "preprocess":
        input_pattern = sys.argv[2]
        files = glob.glob(input_pattern)
        if not files and os.path.isdir(input_pattern):
            files = glob.glob(os.path.join(input_pattern, "*"))
        
        # Filter for Excel/CSV
        files = [f for f in files if f.endswith(('.csv', '.xlsx', '.xls'))]
        bulk_preprocess(files)
        
    elif mode == "train":
        input_file = sys.argv[2]
        train_from_review(input_file)
    else:
        print(f"Unknown mode: {mode}")
