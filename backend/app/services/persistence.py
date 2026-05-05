from app.utils.supabase_client import supabase, supabase_admin

# Use admin client for DB operations to bypass RLS on the server side
db_client = supabase_admin if supabase_admin else supabase

def load_transactions(user_id: str):
    response = db_client.table("transactions").select("*").eq("user_id", user_id).execute()
    return response.data

def save_transactions(transactions: list, user_id: str):
    if not transactions:
        return []
    
    cleaned_txs = []
    for tx in transactions:
        tx['user_id'] = user_id
        # Remove 'id' if it's None, empty string, or nan so Supabase generates it
        if 'id' in tx and (tx['id'] is None or tx['id'] == '' or (isinstance(tx['id'], float) and np.isnan(tx['id']))):
            del tx['id']
        cleaned_txs.append(tx)

    response = db_client.table("transactions").upsert(cleaned_txs).execute()
    return response.data

def delete_all_transactions(user_id: str):
    db_client.table("transactions").delete().eq("user_id", user_id).execute()

def get_category_learned_mappings(user_id: str):
    response = db_client.table("category_learning").select("clean_description, category").eq("user_id", user_id).execute()
    return {item['clean_description']: item['category'] for item in response.data}

def save_category_learning(user_id: str, clean_desc: str, category: str):
    db_client.table("category_learning").upsert({
        "user_id": user_id,
        "clean_description": clean_desc,
        "category": category
    }, on_conflict="user_id, clean_description").execute()

def update_db_transaction_category(transaction_id: str, new_category: str):
    db_client.table("transactions").update({"category": new_category}).eq("id", transaction_id).execute()

def get_db_transaction(transaction_id: str, user_id: str):
    tx_resp = db_client.table("transactions").select("*").eq("id", transaction_id).eq("user_id", user_id).single().execute()
    return tx_resp.data
