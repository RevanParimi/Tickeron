from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # LLM
    groq_api_key: str = ""
    anthropic_api_key: str = ""

    # Search
    tavily_api_key: str = ""

    # Auth
    secret_key: str = "dev-secret-change-in-prod"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # DB
    database_url: str = "sqlite+aiosqlite:///./marketpulse.db"

    # App
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
