from typing import List, Protocol
from pathlib import Path


class DocumentProcessorProtocol(Protocol):

    def process(self, file_path: Path) -> List[str]: ...
