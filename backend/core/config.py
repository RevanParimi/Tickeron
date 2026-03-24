from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
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
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()