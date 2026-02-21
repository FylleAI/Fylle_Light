from uuid import UUID

import structlog
from openai import AsyncOpenAI

from app.config.settings import get_settings
from app.config.supabase import get_supabase_admin
from app.db.repositories.archive_repo import ArchiveRepository

logger = structlog.get_logger("cgs-mvp.archive")


class ArchiveService:
    def __init__(self):
        self.db = get_supabase_admin()

    def list(
        self,
        user_id: UUID,
        context_id: UUID | None = None,
        brief_id: UUID | None = None,
    ) -> list:
        query = self.db.table("archive").select("*").eq("user_id", str(user_id))
        if context_id:
            query = query.eq("context_id", str(context_id))
        if brief_id:
            query = query.eq("brief_id", str(brief_id))
        return query.order("created_at", desc=True).execute().data

    def get_stats(
        self,
        user_id: UUID,
        context_id: UUID | None = None,
        brief_id: UUID | None = None,
    ) -> dict:
        # When filtering by context or brief, compute stats in Python
        if context_id or brief_id:
            items = self.list(user_id, context_id, brief_id)
            total = len(items)
            approved = sum(1 for i in items if i.get("review_status") == "approved")
            rejected = sum(1 for i in items if i.get("review_status") == "rejected")
            pending = sum(1 for i in items if i.get("review_status") == "pending")
            references = sum(1 for i in items if i.get("is_reference"))
            return {
                "total": total,
                "approved": approved,
                "rejected": rejected,
                "pending_count": pending,
                "references_count": references,
            }

        # No filters → use RPC for global stats
        params = {"p_user_id": str(user_id)}
        result = self.db.rpc("get_archive_stats", params).execute()
        return (
            result.data[0]
            if result.data
            else {
                "total": 0,
                "approved": 0,
                "rejected": 0,
                "pending_count": 0,
                "references_count": 0,
            }
        )

    async def semantic_search(
        self,
        query: str,
        context_id: UUID,
        brief_id: UUID | None = None,
    ) -> list:
        """Semantic search usando embeddings OpenAI + vector search."""
        settings = get_settings()
        client = AsyncOpenAI(api_key=settings.openai_api_key)

        logger.info("Generating embedding | query=%s context=%s brief=%s", query[:50], context_id, brief_id)
        embedding_response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )
        embedding = embedding_response.data[0].embedding

        repo = ArchiveRepository(self.db)
        results = repo.semantic_search(embedding, context_id, brief_id=brief_id)
        logger.info("Semantic search completed | results=%d", len(results))
        return results
