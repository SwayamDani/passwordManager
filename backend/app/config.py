<<<<<<< HEAD
from pydantic_settings import BaseSettings
from pydantic import BaseModel
=======
from typing import List
import os
from pydantic_settings import BaseSettings
>>>>>>> 949fb09fb18e247f403e5f2fea1a9f7d0d907e6c
import secrets

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Password Manager"
<<<<<<< HEAD
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW: int = 300  # 5 minutes
    LOCKOUT_DURATION: int = 900  # 15 minutes
    CORS_ORIGINS: list = ["http://localhost:3000"]
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"

settings = Settings()
=======
    
    # Redis configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # Security settings
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW: int = 300  # 5 minutes
    LOCKOUT_DURATION: int = 900  # 15 minutes

    # Generate a static SECRET_KEY
    SECRET_KEY: str = secrets.token_urlsafe(32)
    
    # JWT Secret key for authentication - use environment variable for consistency across restarts
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))

    # Updated CORS settings to allow specific frontend URL
    CORS_ORIGINS: List[str] = ["https://password-manager-eight-lovat.vercel.app"]
    
    # SMTP Configuration for Gmail
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = os.getenv("SMTP_FROM_EMAIL", "your_email@gmail.com")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "your_email@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    
    # Frontend URL for constructing links
    # Use vercel deployment URL or localhost for development
    FRONTEND_BASE_URL: str = "https://password-manager-eight-lovat.vercel.app"
    # Use this for local development
    # FRONTEND_BASE_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env.local"
        
settings = Settings()
>>>>>>> 949fb09fb18e247f403e5f2fea1a9f7d0d907e6c
