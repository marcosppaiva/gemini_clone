from typing import Optional

from pydantic_settings import BaseSettings

from .provider import EmbeddingProvider
from .settings import get_settings
from .embedding_provider import (
    LocalEmbeddingProvider,
    GeminiEmbeddingProvider,
    OpenAIEmbeddingProvider,
)


class EmbeddingFactory:
    @staticmethod
    def get_provider(
        provider_name: str, settings: Optional[BaseSettings] = None
    ) -> EmbeddingProvider:

        settings = settings or getattr(get_settings(), provider_name, None)

        if not settings:
            raise ValueError(f'Unsupported provider: {provider_name}')

        providers = {
            'openai': lambda settings: OpenAIEmbeddingProvider(settings),
            'gemini': lambda settings: GeminiEmbeddingProvider(settings),
            'local': lambda settings: LocalEmbeddingProvider(settings),
        }

        provider_factory = providers.get(provider_name)
        provider = provider_factory(settings)  # type: ignore
        print(f'A classe que eu recuperei foi {provider_factory}')

        if not provider_factory:
            raise ValueError(f'Provider "{provider_name}" is not registred')

        return provider
