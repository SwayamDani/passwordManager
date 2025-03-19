from typing import List
from pydantic_settings import BaseSettings
import secrets

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Password Manager"
    
    # Redis configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # Security settings
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW: int = 300  # 5 minutes
    LOCKOUT_DURATION: int = 900  # 15 minutes

    # Generate a static SECRET_KEY
    SECRET_KEY: str = secrets.token_urlsafe(32)

    # Allow all domains (disable CORS restrictions)
    CORS_ORIGINS: List[str] = ["*"]
settings = Settings()
