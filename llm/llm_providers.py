from groq import Groq
from openai import OpenAI
from vertexai.generative_models import GenerativeModel, GenerationConfig

from .provider import LLMProvider
from .settings import GroqSettings, GeminiSettings, OpenAISettings


class GeminiProvider(LLMProvider):
    # TODO add the remaining configuration parameters
    def __init__(self, settings: GeminiSettings) -> None:
        self.settings = settings
        self.model = GenerativeModel(
            model_name=settings.default_model,
            generation_config=GenerationConfig(
                max_output_tokens=settings.max_tokens, temperature=settings.temperature
            ),
        )

    def generate_text(self, prompt: str) -> str:
        response = self.model.generate_content(prompt)

        return response.text


class OpenAIProvider(LLMProvider):
    def __init__(self, settings: OpenAISettings) -> None:
        self.settings = settings
        self.model = OpenAI(api_key=settings.api_key)

    def generate_text(self, prompt: str) -> str:
        response = self.model.chat.completions.create(
            model=self.settings.default_model,
            max_tokens=self.settings.max_tokens,
            temperature=self.settings.temperature,
            messages=[{'role': 'user', 'content': prompt}],
        )

        return response.choices[0].message.content  # type: ignore


class GroqAIProvider(LLMProvider):
    def __init__(self, settings: GroqSettings) -> None:
        self.settings = settings
        self.model = Groq(api_key=settings.api_key)

    def generate_text(self, prompt: str) -> str:
        response = self.model.chat.completions.create(
            model=self.settings.default_model,
            max_tokens=self.settings.max_tokens,
            temperature=self.settings.temperature,
            messages=[{'role': 'user', 'content': prompt}],
        )

        return response.choices[0].message.content  # type: ignore
