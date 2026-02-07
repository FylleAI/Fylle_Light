from .base import BaseRepository
from uuid import UUID


class OutputRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "outputs")

    def list_by_brief(self, brief_id: UUID, user_id: UUID):
        """Solo output radice (no versioni intermedie)."""
        return (self.db.table(self.table)
                .select("*")
                .eq("brief_id", str(brief_id))
                .eq("user_id", str(user_id))
                .is_("parent_output_id", "null")
                .order("number", desc=True)
                .execute().data)

    def get_latest_version(self, output_id: UUID):
        """Risale la chain fino all'ultima versione."""
        current = self.get_by_id(output_id)
        if not current:
            return None
        while True:
            child = (self.db.table(self.table)
                     .select("*")
                     .eq("parent_output_id", str(current["id"]))
                     .order("version", desc=True)
                     .limit(1)
                     .execute().data)
            if not child:
                return current
            current = child[0]

    def get_next_number(self, brief_id: UUID) -> int:
        """Prossimo numero progressivo per un brief."""
        res = (self.db.table(self.table)
               .select("number")
               .eq("brief_id", str(brief_id))
               .is_("parent_output_id", "null")
               .order("number", desc=True)
               .limit(1)
               .execute().data)
        return (res[0]["number"] + 1) if res and res[0].get("number") else 1
