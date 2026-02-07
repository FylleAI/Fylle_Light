from .base import BaseRepository
from uuid import UUID


class ContextRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "contexts")

    def get_with_cards(self, id: UUID):
        context = self.get_by_id(id)
        if not context:
            return None
        cards = (self.db.table("cards")
                 .select("*")
                 .eq("context_id", str(id))
                 .order("sort_order")
                 .execute())
        context["cards"] = cards.data
        return context
