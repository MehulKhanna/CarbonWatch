from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Carbon Watch API"
    DEBUG: bool = False
    
    # MongoDB
    MONGODB_URL: str = ""
    MONGODB_DB_NAME: str = "carbon_watch"
    
    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - accepts comma-separated origins in env var
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Allow adding production origins via EXTRA_CORS_ORIGINS env var
        extra_origins = os.getenv("EXTRA_CORS_ORIGINS", "")
        if extra_origins:
            for origin in extra_origins.split(","):
                origin = origin.strip()
                if origin and origin not in self.CORS_ORIGINS:
                    self.CORS_ORIGINS.append(origin)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
