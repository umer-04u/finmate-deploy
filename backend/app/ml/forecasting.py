import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression


def generate_forecast(monthly_trend: list) -> dict:

    if len(monthly_trend) < 3:
        return {
            "next_month": "Insufficient Data",
            "predicted_spend": 0.0,
            "insight": "Upload at least 3 months of data for forecasting."
        }

    df = pd.DataFrame(monthly_trend)

    df["spent"] = pd.to_numeric(df["spent"], errors="coerce").fillna(0)

    df["time_idx"] = np.arange(len(df))

    X = df[["time_idx"]].values
    y = df["spent"].values

    model = LinearRegression()
    model.fit(X, y)

    next_idx = np.array([[len(df)]])

    prediction = float(model.predict(next_idx)[0])

    slope = model.coef_[0]

    if slope > 50:
        insight = f"Your spending is rising by about ${slope:.0f}/month."
    elif slope < -50:
        insight = f"Great! Your spending is dropping by about ${abs(slope):.0f}/month."
    else:
        insight = "Your monthly spending is relatively stable."

    try:
        last_date = pd.to_datetime(df.iloc[-1]["month"], format="%b %Y")
        next_date = last_date + pd.DateOffset(months=1)
        next_month = next_date.strftime("%b %Y")
    except:
        next_month = "Next Month"

    return {
        "next_month": next_month,
        "predicted_spend": max(0, round(prediction, 2)),
        "insight": insight
    }