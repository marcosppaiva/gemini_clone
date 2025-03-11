import os
from typing import Optional
from functools import lru_cache

from pydantic_settings import BaseSettings


# TODO how we can change the name of the model?
class LLMProviderSettings(BaseSettings):
    temperature: int = 0
    max_tokens: Optional[int] = None


class OpenAISettings(LLMProviderSettings):
    api_key: str = os.getenv('OPENAI_API_KEY')  # type: ignore
    default_model: str = os.getenv('OPENAI_MODEL_NAME', 'gpt-4o')


class GeminiSettings(LLMProviderSettings):
    api_key: str = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')  # type: ignore
    default_model: str = os.getenv('GEMINI_MODEL_NAME', 'gemini-1.5-pro-001')


class GroqSettings(LLMProviderSettings):
    api_key: str = os.getenv('GROQ_API_KEY')  # type: ignore
    default_model: str = os.getenv('GROQ_MODEL_NAME', 'llama3-8b-8192')


class Settings(BaseSettings):
    openai: OpenAISettings = OpenAISettings()
    gemini: GeminiSettings = GeminiSettings()
    groqai: GroqSettings = GroqSettings()


@lru_cache
def get_settings():
    return Settings()
