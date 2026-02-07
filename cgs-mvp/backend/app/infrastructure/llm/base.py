from abc import ABC, abstractmethod
from typing import List, Optional
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
        messages: List[dict],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        pass
