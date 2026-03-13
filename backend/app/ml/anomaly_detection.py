import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest


def detect_anomalies(df: pd.DataFrame) -> pd.DataFrame:

    df["is_anomaly"] = False
    df["anomaly_reason"] = None

    # Only check expense transactions
    expenses = df[df["type"] == "expense"].copy()

    if len(expenses) < 10:
        return df

    expenses["abs_amount"] = expenses["amount"].abs()

    X = expenses[["abs_amount"]].values

    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )

    expenses["anomaly_score"] = iso_forest.fit_predict(X)

    expenses["is_anomaly"] = expenses["anomaly_score"] == -1

    def generate_explanation(row):

        category_data = expenses[expenses["category"] == row["category"]]

        category_mean = category_data["abs_amount"].mean()
        category_std = category_data["abs_amount"].std()

        if pd.isna(category_std) or category_std == 0:
            return f"Unusually high {row['category']} transaction (${row['abs_amount']:.2f})."

        z_score = (row["abs_amount"] - category_mean) / category_std

        if z_score > 2:
            return f"This transaction is {z_score:.1f} standard deviations above your usual {row['category']} spending."

        return f"Statistical anomaly detected in {row['category']} spending pattern."

    anomaly_mask = expenses["is_anomaly"]

    if anomaly_mask.any():
        expenses.loc[anomaly_mask, "anomaly_reason"] = expenses[anomaly_mask].apply(
            generate_explanation, axis=1
        )

    df.update(expenses[["is_anomaly", "anomaly_reason"]])

    df["is_anomaly"] = df["is_anomaly"].astype(bool)

    return df