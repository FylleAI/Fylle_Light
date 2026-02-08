import logging
from uuid import UUID
from app.config.supabase import get_supabase_admin
from app.config.settings import get_settings
from app.db.repositories.archive_repo import ArchiveRepository
from openai import AsyncOpenAI

logger = logging.getLogger("cgs-mvp.archive")


class ArchiveService:
    def __init__(self):
        self.db = get_supabase_admin()

    def list(self, user_id: UUID) -> list:
        return (self.db.table("archive")
                .select("*")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
                .execute().data)

    def get_stats(self, user_id: UUID) -> dict:
        result = self.db.rpc("get_archive_stats", {"p_user_id": str(user_id)}).execute()
        return result.data[0] if result.data else {
            "total": 0, "approved": 0, "rejected": 0,
            "pending_count": 0, "references_count": 0,
        }

    async def semantic_search(self, query: str, context_id: UUID) -> list:
        """Semantic search usando embeddings OpenAI + vector search."""
        settings = get_settings()
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        logger.info("Generating embedding | query=%s context=%s", query[:50], context_id)
        embedding_response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )
        embedding = embedding_response.data[0].embedding

        repo = ArchiveRepository(self.db)
        results = repo.semantic_search(embedding, context_id)
        logger.info("Semantic search completed | results=%d", len(results))
        return results
