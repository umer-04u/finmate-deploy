import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

# Categories that are usually essential and shouldn't be flagged for high amounts easily
ESSENTIAL_CATEGORIES = [
    "Health & Fitness",  # Includes Hospitals, Clinics, Pharmacy
    "Housing",           # Rent/Mortgage
    "Utilities",         # Electricity, Water, Internet
    "Income"
]

def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:
    """
    Detects anomalies with context awareness and high sensitivity.
    """
    if df.empty:
        return df

    if "is_anomaly" not in df.columns:
        df["is_anomaly"] = False
    if "anomaly_reason" not in df.columns:
        df["anomaly_reason"] = None

    # Safety check for required 'type' column
    if "type" not in df.columns:
        return df

    # Only check expense transactions
    expenses = df[df["type"] == "expense"].copy()

    if len(expenses) < 5: 
        return df

    expenses["abs_amount"] = expenses["amount"].abs()
    
    # 1. Statistical Outlier Detection (Isolation Forest) as a baseline
    X = expenses[["abs_amount"]].values
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.08, # Slightly higher to catch more small anomalies
        random_state=42
    )
    expenses["iso_score"] = iso_forest.fit_predict(X)

    # 2. Category-Aware Refinement
    for idx, row in expenses.iterrows():
        cat = row["category"]
        amount = row["abs_amount"]
        is_manual = row.get("is_manual", False)
        
        # Get historical data for this category
        cat_history = expenses[expenses["category"] == cat]
        
        # If we have enough history for this category
        if len(cat_history) >= 2:
            cat_mean = cat_history["abs_amount"].mean()
            cat_std = cat_history["abs_amount"].std()
            
            variation = amount - cat_mean
            
            is_anomaly = False
            reason = None
            
            # High amount check (with protection for essential categories and manual entries)
            # For manual entries, we use a much higher threshold (4 std devs instead of 2)
            threshold = 4 if is_manual else 2
            
            if amount > cat_mean + (threshold * cat_std) and cat_std > 0:
                if cat in ESSENTIAL_CATEGORIES:
                    is_anomaly = False 
                else:
                    is_anomaly = True
                    reason = f"Unusually high spending in {cat}. {variation:.2f} above average."
            
            # Small "extra" expense check - skip for manual entries
            elif not is_manual and cat_std < (0.05 * cat_mean) and variation >= 1:
                is_anomaly = True
                reason = f"Minor unexpected expense (+{variation:.2f}) in a typically stable category ({cat})."

            # Global statistical check fallback - skip for manual entries unless extreme
            elif not is_manual and row["iso_score"] == -1 and cat not in ESSENTIAL_CATEGORIES:
                is_anomaly = True
                reason = f"Spending pattern outlier detected in {cat}."

            expenses.at[idx, "is_anomaly"] = is_anomaly
            expenses.at[idx, "anomaly_reason"] = reason
        else:
            # Not enough history
            # For manual entries, we NEVER flag them as an anomaly if it's the first time
            if is_manual:
                expenses.at[idx, "is_anomaly"] = False
            elif row["iso_score"] == -1 and cat not in ESSENTIAL_CATEGORIES:
                expenses.at[idx, "is_anomaly"] = True
                expenses.at[idx, "anomaly_reason"] = f"First-time unusual expense in {cat}."

    # Update original dataframe
    df.update(expenses[["is_anomaly", "anomaly_reason"]])
    df["is_anomaly"] = df["is_anomaly"].astype(bool)

    return df