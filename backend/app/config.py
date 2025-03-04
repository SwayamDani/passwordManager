from pydantic_settings import BaseSettings
from pydantic import BaseModel
import secrets

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Password Manager"
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