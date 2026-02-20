"""
Repository per context_items — dati gerarchici del contesto.
Ogni item rappresenta un nodo nell'albero (Level 0 → Level 3).
"""

from uuid import UUID

from app.db.repositories.base import BaseRepository


class ContextItemRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "context_items")

    def list_by_context(self, context_id: UUID) -> list:
        """Tutti gli items di un contesto, ordinati per livello e sort_order."""
        return (
            self.db.table("context_items")
            .select("*")
            .eq("context_id", str(context_id))
            .order("level")
            .order("sort_order")
            .execute()
        ).data

    def get_tree(self, context_id: UUID) -> list:
        """Restituisce gli items come albero annidato (lista di root con children)."""
        items = self.list_by_context(context_id)

        # Costruisci lookup per id
        by_id = {}
        for item in items:
            by_id[item["id"]] = {**item, "children": []}

        # Collega figli ai genitori
        roots = []
        for item in items:
            node = by_id[item["id"]]
            parent_id = item.get("parent_id")
            if parent_id and parent_id in by_id:
                by_id[parent_id]["children"].append(node)
            else:
                roots.append(node)

        return roots

    def delete_by_context(self, context_id: UUID) -> None:
        """Cancella TUTTI gli items di un contesto (per re-import)."""
        self.db.table("context_items").delete().eq("context_id", str(context_id)).execute()

    def count_by_context(self, context_id: UUID) -> int:
        """Conta gli items di un contesto."""
        result = self.db.table("context_items").select("id", count="exact").eq("context_id", str(context_id)).execute()
        return result.count if result.count else 0
