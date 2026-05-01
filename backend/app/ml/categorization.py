import pandas as pd
import re
import joblib
import os


RULES = {
    # 1. Income (High Priority)
    r'.*(SALARY|PAYROLL|INTEREST|DIVIDEND|REFUND|CASHBACK|DEPOSIT|CREDIT|UPI CR).*': 'Income',

    # 2. Transportation & Travel
    r'.*(IRCTC|RAIL|INDIAN RAI|METRO|OLA|UBER|RAPIDO|PETROL|SHELL|FUEL|AIR INDIA|INDIGO|VISTARA|AKASA|TRANSIT|MTC|TSRTC|KSRTC|BMRCL|GOIBIBO|MAKEMYTRIP|PARKING).*': 'Transportation',

    # 3. Food & Dining
    r'.*(ZOMATO|SWIGGY|EATFIT|KFC|MCDON|PIZZA|DOMINO|BURGER|RESTAUR|CAFE|DINING|HALDIRAM|STARBUC|CHIPOTLE|DASH|CHICKEN|CHAT|FOOD|SUDIP|WOW|BAKERY|SWEETS|HOTEL).*': 'Food & Dining',

    # 4. Utilities & Telecom
    r'.*(JIO|AIRTEL|VI |BSNL|VODAFONE|RECHARGE|ELECTRI|BESCOM|BILL|WATER|BROADBAND|INTERNET|GAS|ACTFIBER|POWER|MOBILE|PHONE|TATAPLAY|DISH).*': 'Utilities',

    # 5. Shopping & Groceries
    r'.*(AMAZON|FLIPK|MYNTRA|AJIO|NYKAA|RELIANCE|DMART|SPENCER|BAZAAR|BLINKIT|ZEPTO|BASKET|JIOMART|SHOP|WALMART|TARGET|RETAIL|GROCER|APPAREL|FASHION|LIFESTYLE|MAX|WESTSIDE|DECATHLON).*': 'Shopping & Groceries',

    # 6. Health & Fitness (Using word boundary for DR. to avoid matching DR/)
    r'.*(HOSPITAL|CLINIC|PHARMA|APOLLO|MEDPLUS|PHARMEASY|GYM|CULT|HEALTH|MEDICINE|YOGA|FITNESS|DOCTOR|DR\.\b|DIAGNOSTIC).*': 'Health & Fitness',

    # 7. Entertainment
    r'.*(NETFLIX|SPOTIFY|PRIME|HOTSTAR|SONYLIV|BOOKMYSHOW|CINEMA|THEATRE|STEAM|YOUTUBE|PVR|INOX|PLAYSTORE).*': 'Entertainment',

    # 8. Housing
    r'.*(RENT|MAINTEN|NOBROKER|MAGICBRICK|MORTGAGE|HOA|APARTMENT).*': 'Housing',

    # 9. Transfers & P2P (Fallback)
    r'.*(OKSB|OKAX|OKBI|OKICICI|YBL|AXL|PAYTM|UPI|TRANSFER|IMPS|NEFT|SENT TO|RECEIVED|CASH|ATM|PHONEPE|GPAY|G-PAY).*': 'Transfers/P2P',
}

COMPILED_RULES = [(re.compile(p, re.IGNORECASE), c) for p, c in RULES.items()]


def clean_text(text):
    if pd.isna(text):
        return ""

    text = str(text).upper()

    # 1. Replace delimiters with spaces
    text = text.replace('/', ' ').replace('-', ' ').replace('_', ' ').replace('@', ' ')

    # 2. Strip out long alphanumeric IDs
    words = text.split()
    cleaned_words = []
    for word in words:
        if len(word) >= 10 and any(char.isdigit() for char in word):
            continue
        cleaned_words.append(word)

    text = ' '.join(cleaned_words)

    # 3. Bank noise removal
    text = re.sub(r'HDFCBANK|HDFC|ICICI|SBI|AXIS|YESBANK|KOTAK|PAYZOMATO', ' ', text)

    # Standard cleanup
    text = re.sub(r"[^A-Z ]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def rule_category(clean_desc, original_desc):
    # Try cleaned first
    for pattern, cat in COMPILED_RULES:
        if pattern.search(clean_desc):
            return cat
    
    # Try original if cleaned failed (to catch markers that might be stripped)
    for pattern, cat in COMPILED_RULES:
        if pattern.search(str(original_desc).upper()):
            return cat

    return "Other/Uncategorized"


def generate_smart_description(raw_desc, category, tx_type):
    """
    Creates a user-friendly description from raw bank text.
    """
    raw_desc = str(raw_desc).upper()

    # 1. Extract name from common UPI format: UPI/DR/ID/NAME/HANDLE/...
    parts = raw_desc.split('/')
    if len(parts) >= 4:
        name_part = parts[3].strip()
        if len(name_part) > 2 and not any(char.isdigit() for char in name_part):
            prefix = "Paid to" if tx_type == "expense" else "Received from"
            return f"{prefix} {name_part.title()}"

    # 2. Use Category as a fallback for common activities
    if category != "Other/Uncategorized" and category != "Transfers/P2P":
        cleaned = clean_text(raw_desc)
        if cleaned:
            return cleaned.title()
        return category

    # 3. Handle generic transfers
    cleaned = clean_text(raw_desc)
    if category == "Transfers/P2P":
        if cleaned:
            prefix = "Transfer:" if tx_type == "expense" else "Received:"
            return f"{prefix} {cleaned.title()}"
        return "Peer-to-Peer Transfer"

    # Final Fallback
    return cleaned.title() if cleaned else "General Transaction"


def categorize_transactions(df: pd.DataFrame) -> pd.DataFrame:
    # 1. Clean for matching
    df["clean_description"] = df["description"].apply(clean_text)

    # 2. Get Category (Passing both for better matching)
    df["category"] = df.apply(lambda r: rule_category(r["clean_description"], r["description"]), axis=1)

    # 3. Determine Type (Respecting Manual Input)
    def determine_type(row):
        # If 'type' is already provided (from manual entry), respect it
        if "type" in row and row["type"] in ["income", "expense"]:
            return row["type"]
            
        desc = str(row["description"]).upper()
        
        # Priority 1: Explicit DR/CR markers
        if "/DR/" in desc or " DR " in desc or desc.startswith("DR "):
            return "expense"
        if "/CR/" in desc or " CR " in desc or desc.startswith("CR "):
            return "income"
            
        # Priority 2: Category defaults
        if row["category"] == "Income":
            return "income"
        if row["category"] in ["Food & Dining", "Transportation", "Utilities", "Shopping & Groceries", "Health & Fitness", "Entertainment", "Housing"]:
            return "expense"
            
        # Priority 3: Amount sign
        if row["amount"] < 0:
            return "expense"
        
        return "income" if row["amount"] > 0 else "expense"

    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
    df["type"] = df.apply(determine_type, axis=1)

    # 4. Generate User-Friendly Description
    df["original_description"] = df["description"]
    df["description"] = df.apply(
        lambda r: generate_smart_description(r["original_description"], r["category"], r["type"]), 
        axis=1
    )

    return df
