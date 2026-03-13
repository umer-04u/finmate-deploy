import pandas as pd
import re
import joblib
import os


RULES = {
    r'.*(UBER|LYFT|TRANSIT|MTA|METRO|SHELL|EXXON|CHEVRON|BP).*': 'Transportation',
    r'.*(STARBUCKS|MCDONALDS|CHIPOTLE|DOORDASH|UBEREATS|RESTAURANT|CAFE|PIZZA).*': 'Food & Dining',
    r'.*(NETFLIX|HULU|SPOTIFY|HBO|DISNEY|CINEMA|THEATRE|STEAM).*': 'Entertainment',
    r'.*(AMAZON|TARGET|WALMART|WHOLEFOODS|KROGER|SAFEWAY|COSTCO|SHOPPING|CLOTHES|APPAREL).*': 'Shopping & Groceries',
    r'.*(POWER|WATER|ELECTRIC|GAS|INTERNET|COMCAST|VERIZON).*': 'Utilities',
    r'.*(GYM|YOGA|FITNESS|HOSPITAL|CLINIC|PHARMACY).*': 'Health & Fitness',
    r'.*(RENT|MORTGAGE|HOA|APARTMENT).*': 'Housing',
    r'.*(PAYROLL|SALARY|DEPOSIT|DIRECT DEP).*': 'Income',
}

COMPILED_RULES = [(re.compile(p, re.IGNORECASE), c) for p, c in RULES.items()]


def clean_text(text):

    if pd.isna(text):
        return ""

    text = text.upper()
    text = re.sub(r"[^A-Z0-9 ]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def rule_category(desc):

    for pattern, cat in COMPILED_RULES:
        if pattern.search(desc):
            return cat

    return "Other/Uncategorized"


def categorize_transactions(df: pd.DataFrame) -> pd.DataFrame:

    df["description"] = df["description"].apply(clean_text)

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    df["category"] = df["description"].apply(rule_category)

    df["type"] = df["category"].apply(
        lambda c: "income" if c == "Income" else "expense"
    )

    return df