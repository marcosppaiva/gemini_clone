from typing import Optional

from pydantic_settings import BaseSettings

from .provider import LLMProvider
from .settings import get_settings
from .llm_providers import GeminiProvider, GroqAIProvider, OpenAIProvider


class LLMFactory:
    @staticmethod
    def get_provider(
        provider_name: str, settings: Optional[BaseSettings] = None
    ) -> LLMProvider:

        settings = settings or getattr(get_settings(), provider_name, None)

        if not settings:
            raise ValueError(f'Unsupported provider: {provider_name}')

        providers = {
            'gemini': GeminiProvider(settings),
            'groqai': GroqAIProvider(settings),
            'openai': OpenAIProvider(settings),
        }

        provider_class = providers.get(provider_name)

        if not provider_class:
            raise ValueError(f'Provider "{provider_name}" is not registered')

        return provider_class
