from typing import Any, List

from openai import OpenAI
from sentence_transformers import SentenceTransformer
from vertexai.language_models import TextEmbeddingModel

from .provider import EmbeddingProvider
from .settings import (
    LocalEmbeddingSettings,
    GeminiEmbeddingSettings,
    OpenAIEmbeddingSettings,
)


class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, settings: LocalEmbeddingSettings) -> None:
        self.settings = settings
        self.model = SentenceTransformer(model_name_or_path=settings.default_model)

    def get_embedding(self, content: List[str]) -> Any:
        return self.model.encode(content)


class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, settings: GeminiEmbeddingSettings) -> None:
        self.settings = settings
        self.model = TextEmbeddingModel.from_pretrained(settings.default_model)

    def get_embedding(self, content: List[str]) -> Any:
        return self.model.get_embeddings(content)  # type: ignore


class OpenAIEmbeddingProvider(EmbeddingProvider):
    def __init__(self, settigs: OpenAIEmbeddingSettings) -> None:
        self.settings = settigs
        self.model = OpenAI(api_key=self.settings.api_key)

    def get_embedding(self, content: List[str]) -> Any:
        response = self.model.embeddings.create(
            input=content, model=self.settings.default_model
        )

        return response
