import asyncio

import google.generativeai as genai

from app.config.settings import get_settings

from .base import LLMAdapter, LLMResponse

PRICING = {
    "gemini-1.5-pro": {"input": 1.25, "output": 5.0},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
}


class GeminiAdapter(LLMAdapter):
    def __init__(self):
        genai.configure(api_key=get_settings().google_api_key)

    async def generate(self, messages, model=None, temperature=0.7, max_tokens=4096):
        model_name = model or "gemini-1.5-pro"
        gm = genai.GenerativeModel(model_name)

        # Converti formato OpenAI → Gemini
        parts = []
        for m in messages:
            parts.append(f"[{m['role'].upper()}]: {m['content']}")
        prompt = "\n\n".join(parts)

        # FIX: gm.generate_content() è sincrono — wrap in asyncio.to_thread()
        response = await asyncio.to_thread(
            gm.generate_content,
            prompt,
            generation_config={"temperature": temperature, "max_output_tokens": max_tokens},
        )
        tokens_in = response.usage_metadata.prompt_token_count or 0
        tokens_out = response.usage_metadata.candidates_token_count or 0
        prices = PRICING.get(model_name, {"input": 1.25, "output": 5.0})
        cost = (tokens_in * prices["input"] + tokens_out * prices["output"]) / 1_000_000

        return LLMResponse(
            content=response.text,
            model=model_name,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=cost,
        )
