from uuid import UUID

from .base import BaseRepository


class ArchiveRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "archive")

    def get_references(self, context_id: UUID, limit: int = 5):
        res = (
            self.db.table("archive")
            .select("*, outputs(text_content)")
            .eq("context_id", str(context_id))
            .eq("is_reference", True)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data

    def get_guardrails(self, context_id: UUID, limit: int = 5):
        res = (
            self.db.table("archive")
            .select("*, outputs(text_content)")
            .eq("context_id", str(context_id))
            .eq("review_status", "rejected")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data

    def semantic_search(self, embedding: list, context_id: UUID, limit: int = 5):
        res = self.db.rpc(
            "search_archive_by_embedding",
            {
                "query_embedding": embedding,
                "match_context_id": str(context_id),
                "match_count": limit,
            },
        ).execute()
        return res.data
