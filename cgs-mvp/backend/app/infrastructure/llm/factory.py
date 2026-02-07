from .base import LLMAdapter
from .openai_adapter import OpenAIAdapter
from .anthropic_adapter import AnthropicAdapter
from .gemini_adapter import GeminiAdapter

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
