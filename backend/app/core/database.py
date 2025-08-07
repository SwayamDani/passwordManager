import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

logger = logging.getLogger(__name__)

# Create base class for SQLAlchemy models
Base = declarative_base()

def get_database_url():
    # Try loading from .env file directly
    database_url = os.environ.get('DATABASE_URL')
    
    # If DATABASE_URL is not set, default to PostgreSQL with standard credentials
    if not database_url:
        logger.info("DATABASE_URL not found in environment, using default PostgreSQL connection")
    
    # Handle Heroku-style PostgreSQL URLs
    if database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    logger.info(f"Using database connection: {database_url}")
    return database_url

# Create database engine
database_url = get_database_url()
if 'postgresql' in database_url:
    engine = create_engine(
        database_url,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=3600,
        connect_args={"sslmode": "prefer"}
    )
else:
    engine = create_engine(database_url)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Function to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()