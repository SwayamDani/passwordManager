import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def get_database_url():
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Heroku provides PostgreSQL URLs starting with 'postgres://'
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        return database_url
    
    # Default to SQLite for local development
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(base_dir, 'data', 'password_manager.db')
    return f'sqlite:///{db_path}'