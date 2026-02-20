import httpx
import structlog

from app.config.settings import get_settings

logger = structlog.get_logger("cgs-mvp.perplexity")


class PerplexityTool:
    async def search(self, query: str, max_results: int = 5) -> str:
        settings = get_settings()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.perplexity_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "sonar",
                    "messages": [{"role": "user", "content": query}],
                    "max_tokens": 2000,
                },
                timeout=60.0,
            )
            data = response.json()
            if response.status_code != 200:
                logger.error("Perplexity API error", status_code=response.status_code, response=data)
                raise RuntimeError(f"Perplexity API error: {data.get('error', {}).get('message', str(data))}")
            if "choices" not in data:
                logger.error("Perplexity unexpected response", keys=list(data.keys()))
                raise RuntimeError(f"Perplexity unexpected response format: {list(data.keys())}")
            return data["choices"][0]["message"]["content"]
