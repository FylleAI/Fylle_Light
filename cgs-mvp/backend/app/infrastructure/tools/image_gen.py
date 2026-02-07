import base64
from openai import AsyncOpenAI
from app.config.settings import get_settings


class ImageGenerationTool:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=get_settings().openai_api_key)

    async def generate(self, prompt: str, size: str = "1024x1024", style: str = "vivid"):
        response = await self.client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            style=style,
            response_format="b64_json",
            n=1,
        )
        image_data = response.data[0]
        return {
            "b64_data": image_data.b64_json,
            "revised_prompt": image_data.revised_prompt,
        }

    def decode_image(self, b64_data: str) -> bytes:
        return base64.b64decode(b64_data)
