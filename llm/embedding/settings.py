import os
from functools import lru_cache

from pydantic_settings import BaseSettings


class EmbeddingSettings(BaseSettings): ...


class OpenAIEmbeddingSettings(EmbeddingSettings):
    api_key: str = os.getenv('OPENAI_API_KEY', '')  # type: ignore
    default_model: str = os.getenv(
        'OPENAI_EMBEDDING_MODEL_NAME', 'text-embedding-ada-002'
    )


class GeminiEmbeddingSettings(EmbeddingSettings):
    api_key: str = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', '')  # type: ignore
    default_model: str = os.getenv('GEMINI_EMBEDDING_MODEL_NAME', 'text-embedding-005')


class LocalEmbeddingSettings(EmbeddingSettings):
    default_model: str = os.getenv('LOCAL_EMBEDDING_MODEL_NAME', 'all-MiniLM-L6-v2')


class Settings(BaseSettings):
    openai: OpenAIEmbeddingSettings = OpenAIEmbeddingSettings()
    gemini: GeminiEmbeddingSettings = GeminiEmbeddingSettings()
    local: LocalEmbeddingSettings = LocalEmbeddingSettings()


@lru_cache
def get_settings():
    return Settings()
