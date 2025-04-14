"""
Reset the password manager database.
This script drops all tables and recreates them, effectively resetting all data.

Can be run on Heroku using: heroku run python backend/scripts/reset_database.py --app your-app-name
"""

import sys
import os
import logging
import argparse

# Add the parent directory to sys.path to allow importing from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import Base, engine
from app.core.models import User, Account, create_tables

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def reset_database(force=False):
    """Drop all tables and recreate them"""
    try:
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(engine)
        logger.info("All tables dropped successfully")
        
        logger.info("Recreating tables...")
        create_tables()
        logger.info("Database reset complete!")
        
        return True
    except Exception as e:
        logger.error(f"Error resetting database: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset the password manager database")
    parser.add_argument("--force", action="store_true", help="Force reset without confirmation (use on Heroku)")
    parser.add_argument("--heroku", action="store_true", help="Running on Heroku environment")
    args = parser.parse_args()
    
    # Check if running on Heroku or if force flag is provided
    is_heroku = args.heroku or 'DYNO' in os.environ
    
    if args.force or is_heroku:
        logger.info("Force reset requested or running on Heroku. Proceeding without confirmation.")
        success = reset_database(force=True)
        if success:
            print("Database has been successfully reset.")
        else:
            print("Failed to reset database. Check logs for details.")
            sys.exit(1)
    else:
        confirm = input("This will DELETE ALL DATA in your database. Are you sure? (y/N): ")
        if confirm.lower() == 'y':
            success = reset_database()
            if success:
                print("Database has been successfully reset.")
            else:
                print("Failed to reset database. Check logs for details.")
                sys.exit(1)
        else:
            print("Database reset cancelled.")