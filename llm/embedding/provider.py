from abc import ABC, abstractmethod
from typing import Any, List


class EmbeddingProvider(ABC):
    @abstractmethod
    def get_embedding(
        self, content: List[str]
    ) -> Any:  # TODO Alter the return type lint
        pass
