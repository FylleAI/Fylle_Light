from openai import AsyncOpenAI
from app.config.settings import get_settings
from .base import LLMAdapter, LLMResponse

PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
}


class OpenAIAdapter(LLMAdapter):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=get_settings().openai_api_key)

    async def generate(self, messages, model=None, temperature=0.7, max_tokens=4096):
        model = model or "gpt-4o"
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        choice = response.choices[0]
        usage = response.usage
        prices = PRICING.get(model, {"input": 5.0, "output": 15.0})
        cost = (usage.prompt_tokens * prices["input"] + usage.completion_tokens * prices["output"]) / 1_000_000

        return LLMResponse(
            content=choice.message.content,
            model=model,
            tokens_in=usage.prompt_tokens,
            tokens_out=usage.completion_tokens,
            cost_usd=cost,
        )
