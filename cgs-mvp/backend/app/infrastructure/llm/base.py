from abc import ABC, abstractmethod

from pydantic import BaseModel


class LLMResponse(BaseModel):
    content: str
    model: str
    tokens_in: int
    tokens_out: int
    cost_usd: float


class LLMAdapter(ABC):
    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        pass
