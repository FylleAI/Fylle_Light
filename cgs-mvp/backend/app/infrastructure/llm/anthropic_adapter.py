from anthropic import AsyncAnthropic

from app.config.settings import get_settings

from .base import LLMAdapter, LLMResponse

PRICING = {
    "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
    "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.0},
}


class AnthropicAdapter(LLMAdapter):
    def __init__(self):
        self.client = AsyncAnthropic(api_key=get_settings().anthropic_api_key)

    async def generate(self, messages, model=None, temperature=0.7, max_tokens=4096):
        model = model or "claude-sonnet-4-20250514"
        system_msg = None
        chat_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                chat_msgs.append(m)

        response = await self.client.messages.create(
            model=model,
            system=system_msg or "",
            messages=chat_msgs,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        prices = PRICING.get(model, {"input": 3.0, "output": 15.0})
        cost = (
            response.usage.input_tokens * prices["input"] + response.usage.output_tokens * prices["output"]
        ) / 1_000_000

        return LLMResponse(
            content=response.content[0].text,
            model=model,
            tokens_in=response.usage.input_tokens,
            tokens_out=response.usage.output_tokens,
            cost_usd=cost,
        )
