from typing import List, Tuple, Optional
from pathlib import Path

import pymupdf4llm
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_core.documents.base import Document

from .interface import DocumentProcessorProtocol


class PDFProcessor(DocumentProcessorProtocol):

    def __init__(
        self,
        headers_to_split_on: Optional[List[Tuple[str, str]]] = None,
    ):

        self.headers_to_split_on = headers_to_split_on or [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
            ("####", "Header 4"),
        ]
        self.markdown_splitter = MarkdownHeaderTextSplitter(self.headers_to_split_on)

    def process(self, file_path: Path) -> List[Document]:
        if not isinstance(file_path, Path):
            raise TypeError(
                f"Expected 'pdf_path' to be of type Path, but got {type(file_path).__name__}"
            )

        try:
            md_text = pymupdf4llm.to_markdown(file_path)

            documents = self.markdown_splitter.split_text(md_text)

            return documents

        except (FileExistsError, FileNotFoundError, IOError) as err:
            print(f"Error processing PDF: {str(err)}")
            raise err
