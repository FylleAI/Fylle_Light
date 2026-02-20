from uuid import UUID

from .base import BaseRepository


class BriefRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "briefs")

    def get_by_slug(self, slug: str, user_id: UUID):
        res = self.db.table(self.table).select("*").eq("slug", slug).eq("user_id", str(user_id)).single().execute()
        return res.data

    def list_by_context(self, context_id: UUID, user_id: UUID):
        return (
            self.db.table(self.table)
            .select("*")
            .eq("context_id", str(context_id))
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .execute()
            .data
        )

    def list_by_pack(self, pack_id: UUID, user_id: UUID):
        return (
            self.db.table(self.table)
            .select("*")
            .eq("pack_id", str(pack_id))
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .execute()
            .data
        )
