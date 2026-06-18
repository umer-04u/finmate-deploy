import re

def extract_entities(raw_desc):
    """
    Heuristic-based Named Entity Recognition for bank statements.
    Extracts merchant_name, payment_method, and potential location.
    """
    desc = str(raw_desc).upper()
    entities = {
        "merchant_name": None,
        "payment_method": "Unknown",
        "location": None
    }
    
    # 1. Payment Method Extraction
    if "UPI" in desc:
        entities["payment_method"] = "UPI"
    elif "ATM" in desc or "CASH" in desc:
        entities["payment_method"] = "Cash"
    elif "NEFT" in desc:
        entities["payment_method"] = "NEFT"
    elif "IMPS" in desc:
        entities["payment_method"] = "IMPS"
    elif "POS" in desc or "CARD" in desc:
        entities["payment_method"] = "Card"
    
    # 2. Extract Name from UPI format (UPI/DR/ID/NAME/HANDLE/...)
    parts = desc.split('/')
    if entities["payment_method"] == "UPI" and len(parts) >= 4:
        name_part = parts[3].strip()
        if len(name_part) > 2 and not any(char.isdigit() for char in name_part):
            entities["merchant_name"] = name_part.title()
            return entities
            
    # 3. Basic Merchant Extraction (Look for common patterns)
    # Often, merchants are prefixed by POS or followed by location
    clean_desc = re.sub(r'[^A-Z ]', ' ', desc)
    clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
    
    # Simple heuristic: remove bank noise, take the first 2-3 significant words
    words = [w for w in clean_desc.split() if w not in ['DR', 'CR', 'POS', 'UPI', 'NEFT', 'IMPS', 'HDFC', 'SBI', 'ICICI', 'AXIS']]
    
    if words:
        # Just use first 3 words as merchant name if nothing else
        entities["merchant_name"] = " ".join(words[:3]).title()
        
        # If there are more words, the last one might be a location
        if len(words) > 3:
            entities["location"] = words[-1].title()
            
    return entities
