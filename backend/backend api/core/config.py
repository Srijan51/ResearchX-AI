from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Auto Research Bot"
    VERSION: str = "1.0.0"

    # AI Providers
    OPENAI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_API_KEY: str = ""

    # Provider Selection — switch to your partner's provider name when ready
    # Supported: "ollama" (default). Your partner adds theirs here.
    AI_PROVIDER: str = "ollama"

    # Rate Limiting
    RATE_LIMIT: str = "10/minute"  # For research start endpoint

    # Environment
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
