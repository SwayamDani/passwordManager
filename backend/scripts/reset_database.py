"""
Script to reset the database by dropping and recreating all tables.
Use with caution - this will delete all data!
"""

import os
import sys
import logging
from sqlalchemy import text

# Add the parent directory to the path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, Base
from app.core.models import User, Account

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    """Drop all tables and recreate them."""
    logger.info("Starting database reset...")
    
    try:
        # Drop all tables
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("All tables dropped successfully")
        
        # Create tables again
        logger.info("Creating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("All tables created successfully")
        
        logger.info("Database reset completed successfully!")
        return True
    except Exception as e:
        logger.error(f"Error resetting database: {str(e)}")
        return False

if __name__ == "__main__":
    # Confirm with the user since this is destructive
    confirm = input("This will DELETE ALL DATA in the database. Type 'YES' to confirm: ")
    if confirm == "YES":
        if reset_database():
            print("Database reset completed. You can now create new users.")
        else:
            print("Failed to reset database.")
    else:
        print("Database reset cancelled.")