from fastapi import FastAPI
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app.api.routes import app
from app.core.models import create_tables
from app.core.database import get_database_url

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Print the database URL (without sensitive credentials)
db_url = get_database_url()
if 'postgresql' in db_url:
    logger.info("Using PostgreSQL database")
    # Hide actual credentials from logs
    display_url = db_url.split('@')
    if len(display_url) > 1:
        logger.info(f"Database: postgresql://*****@{display_url[1]}")
    else:
        logger.info(f"Database: {db_url}")
else:
    logger.info(f"Using SQLite database: {db_url}")

# Initialize the database on startup
# create_tables()

# This app variable is being correctly exported for Gunicorn to use
# as referenced in the Procfile "web: gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)