import httpx
from app.config.settings import get_settings


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
                    "model": "llama-3.1-sonar-large-128k-online",
                    "messages": [{"role": "user", "content": query}],
                    "max_tokens": 2000,
                },
                timeout=30.0,
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
