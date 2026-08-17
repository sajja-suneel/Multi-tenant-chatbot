import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # MongoDB settings
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "multi_Tenant_chat"
    CHAT_HISTORY_COLLECTION: str = "Tenant_chatbot_history"

    # Qdrant settings
    QDRANT_URL: str = ":memory:"
    QDRANT_HOST: str = ""
    QDRANT_API_KEY: str = ""

    # JWT settings
    JWT_SECRET: str = "4f8f4a13a29b46d0a7a0b3c2a9c1e7a55e2d6b384a26e8db01f3e79a8342c8d2"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # LLM configurations
    GROQ_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()