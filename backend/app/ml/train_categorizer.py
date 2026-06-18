import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import joblib
import os
import re

# Use the existing rules to generate training data
from app.ml.categorization import RULES, clean_text

def generate_synthetic_data():
    """Generates a synthetic dataset based on our regex rules to pre-train the model."""
    data = []
    
    # Adding synthetic examples based on our regex rules
    examples = {
        'Income': ['SALARY CREATED', 'MONTHLY PAYROLL', 'INTEREST RECEIVED', 'TAX REFUND', 'CASHBACK REWARD', 'UPI CR FROM JOHN'],
        'Transportation': ['IRCTC TICKET', 'UBER RIDE', 'OLA CABS', 'PETROL PUMP', 'SHELL FUEL', 'INDIGO AIRLINES', 'METRO RECHARGE'],
        'Food & Dining': ['ZOMATO ORDER', 'SWIGGY DELIVERY', 'KFC MEAL', 'DOMINOS PIZZA', 'STARBUCKS COFFEE', 'HALDIRAMS', 'HOTEL TAJ DINING'],
        'Utilities': ['JIO RECHARGE', 'AIRTEL BROADBAND', 'ELECTRICITY BILL BESCOM', 'WATER TAX', 'GAS CYLINDER', 'TATAPLAY DTH'],
        'Shopping & Groceries': ['AMAZON PURCHASE', 'FLIPKART ORDER', 'DMART GROCERY', 'ZEPTO DELIVERY', 'BLINKIT STORE', 'RELIANCE FRESH', 'NYKAA COSMETICS'],
        'Health & Fitness': ['APOLLO PHARMACY', 'MEDPLUS MEDICINE', 'CULT FIT GYM', 'HOSPITAL BILL', 'DIAGNOSTIC TEST', 'DR. SMITH CONSULTATION'],
        'Entertainment': ['NETFLIX SUBSCRIPTION', 'SPOTIFY PREMIUM', 'BOOKMYSHOW TICKETS', 'PVR CINEMAS', 'STEAM GAMES'],
        'Housing': ['MONTHLY RENT', 'APARTMENT MAINTENANCE', 'NOBROKER FEE', 'MORTGAGE EMI', 'HOA DUES'],
        'Transfers/P2P': ['UPI TRANSFER TO FRIEND', 'IMPS FUND TRANSFER', 'NEFT SENT TO', 'CASH WITHDRAWAL ATM', 'PHONEPE SENT']
    }
    
    for category, items in examples.items():
        for item in items:
            data.append({'clean_description': clean_text(item), 'category': category})
            
    # Add some noise/variations
    for category, items in examples.items():
        for item in items:
            data.append({'clean_description': clean_text(item + " REF 123456"), 'category': category})
            data.append({'clean_description': clean_text("POS " + item), 'category': category})

    return pd.DataFrame(data)

def train_and_save_model():
    print("Generating synthetic training data...")
    df = generate_synthetic_data()
    
    # Pipeline: TF-IDF for text vectorization -> Random Forest for classification
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=1000)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    print("Training TF-IDF + RandomForest categorizer...")
    pipeline.fit(df['clean_description'], df['category'])
    
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'saved_models')
    os.makedirs(model_dir, exist_ok=True)
    
    model_path = os.path.join(model_dir, 'categorizer_model.joblib')
    joblib.dump(pipeline, model_path)
    print(f"Model saved to {model_path}")
    return pipeline

if __name__ == "__main__":
    train_and_save_model()
