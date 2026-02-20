from .anthropic_adapter import AnthropicAdapter
from .base import LLMAdapter
from .gemini_adapter import GeminiAdapter
from .openai_adapter import OpenAIAdapter

_ADAPTERS = {
    "openai": OpenAIAdapter,
    "anthropic": AnthropicAdapter,
    "gemini": GeminiAdapter,
}


def get_llm_adapter(provider: str = "openai") -> LLMAdapter:
    cls = _ADAPTERS.get(provider)
    if not cls:
        raise ValueError(f"Unknown LLM provider: {provider}. Available: {list(_ADAPTERS.keys())}")
    return cls()
