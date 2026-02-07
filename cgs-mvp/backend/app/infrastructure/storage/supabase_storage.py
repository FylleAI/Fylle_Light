from typing import Optional
from app.config.supabase import get_supabase_admin
from app.config.settings import get_settings
from uuid import UUID


class StorageService:
    def __init__(self):
        self.client = get_supabase_admin()
        self.settings = get_settings()

    async def upload_file(
        self,
        user_id: UUID,
        file_data: bytes,
        file_name: str,
        content_type: str,
        bucket: Optional[str] = None,
    ) -> str:
        bucket = bucket or self.settings.output_bucket
        path = f"{user_id}/{file_name}"
        self.client.storage.from_(bucket).upload(
            path, file_data, {"content-type": content_type}
        )
        return path

    def get_signed_url(self, path: str, expires_in: int = 3600, bucket: Optional[str] = None) -> str:
        bucket = bucket or self.settings.output_bucket
        res = self.client.storage.from_(bucket).create_signed_url(path, expires_in)
        return res["signedURL"]

    def get_public_url(self, path: str, bucket: Optional[str] = None) -> str:
        bucket = bucket or self.settings.preview_bucket
        res = self.client.storage.from_(bucket).get_public_url(path)
        return res

    def delete_file(self, path: str, bucket: Optional[str] = None):
        bucket = bucket or self.settings.output_bucket
        self.client.storage.from_(bucket).remove([path])
