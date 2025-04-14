#!/usr/bin/env python3
"""
Database Schema Update Script

This script adds missing columns to existing tables in the database.
Specifically, it adds totp_secret and totp_enabled columns to the users table.

Usage:
    python3 update_schema.py
"""

import os
import sys
import logging
import dotenv

# Get the backend directory path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables from .env file with explicit path
dotenv.load_dotenv(os.path.join(backend_dir, '.env'))

# Add the project root to the path to import our modules
sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, text, inspect
from app.core.database import get_database_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_schema():
    # Get database URL from environment
    database_url = get_database_url()
    
    # Debug output
    logger.info(f"Database URL: {database_url}")
    
    # Check if we're using PostgreSQL
    if 'postgresql' not in database_url:
        logger.error("This script is intended for PostgreSQL databases only")
        logger.info("Make sure DATABASE_URL environment variable is set to your PostgreSQL connection string")
        return False
        
    # Connect to the database
    engine = create_engine(database_url)
    
    try:
        with engine.connect() as conn:
            # For PostgreSQL, check if the table and columns exist
            conn.execute(text("""
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name='users' AND column_name='totp_secret'
                    ) THEN
                        ALTER TABLE users ADD COLUMN totp_secret VARCHAR DEFAULT NULL;
                        ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;
                        RAISE NOTICE 'TOTP columns added successfully';
                    ELSE
                        RAISE NOTICE 'TOTP columns already exist';
                    END IF;
                END $$;
            """))
            conn.commit()
            logger.info("Schema updated successfully")
            return True
                
    except Exception as e:
        logger.error(f"Error updating schema: {str(e)}")
        return False

if __name__ == "__main__":
    update_schema()