import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Set up logging to stdout
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Only load .env if it exists (for local dev)
if os.path.exists(".env"):
    load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    logging.error("CRITICAL: SUPABASE_URL or SUPABASE_KEY is missing from environment variables!")

try:
    supabase: Client = create_client(url, key)
    # Use service role for admin operations if needed
    supabase_admin: Client = create_client(url, service_role_key) if service_role_key else None
    logging.info("Supabase client initialized successfully.")
except Exception as e:
    logging.error(f"Failed to initialize Supabase client: {str(e)}")
    supabase = None
    supabase_admin = None
