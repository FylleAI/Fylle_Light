import csv
import io
from typing import Any
from uuid import UUID

import structlog

from app.config.supabase import get_supabase_admin
from app.db.repositories.context_item_repo import ContextItemRepository
from app.db.repositories.context_repo import ContextRepository
from app.exceptions import ConflictException, NotFoundException

logger = structlog.get_logger("cgs-mvp.context")


class ContextService:
    def __init__(self):
        self.db = get_supabase_admin()

    def list(self, user_id: UUID) -> list:
        repo = ContextRepository(self.db)
        return repo.list_by_user(user_id)

    def get(self, context_id: UUID, user_id: UUID) -> dict:
        repo = ContextRepository(self.db)
        context = repo.get_with_cards(context_id)
        if not context or context["user_id"] != str(user_id):
            raise NotFoundException("Context not found")
        return context

    def create(self, user_id: UUID, data: dict) -> dict:
        repo = ContextRepository(self.db)
        logger.info("Creating context | user=%s name=%s", user_id, data.get("name"))
        return repo.create({**data, "user_id": str(user_id)})

    def update(self, context_id: UUID, user_id: UUID, data: dict) -> dict:
        self.get(context_id, user_id)  # ownership check
        repo = ContextRepository(self.db)
        return repo.update(context_id, data)

    def delete(self, context_id: UUID, user_id: UUID) -> None:
        self.get(context_id, user_id)  # ownership check
        repo = ContextRepository(self.db)
        repo.delete(context_id)
        logger.info("Deleted context %s", context_id)

    def get_cards(self, context_id: UUID, user_id: UUID) -> list:
        self.get(context_id, user_id)  # ownership check
        return self.db.table("cards").select("*").eq("context_id", str(context_id)).order("sort_order").execute().data

    def update_card(self, context_id: UUID, card_type: str, user_id: UUID, data: dict) -> list:
        self.get(context_id, user_id)  # ownership check
        return (
            self.db.table("cards")
            .update(data)
            .eq("context_id", str(context_id))
            .eq("card_type", card_type)
            .execute()
            .data
        )

    def get_summary(self, context_id: UUID, user_id: UUID) -> dict:
        """Return the 5 context areas for the Design Lab."""
        context = self.db.table("contexts").select("*").eq("id", str(context_id)).single().execute().data
        if not context or context["user_id"] != str(user_id):
            raise NotFoundException("Context not found")

        cards = self.db.table("cards").select("card_type, title").eq("context_id", str(context_id)).execute().data
        briefs = (
            self.db.table("briefs").select("id, name, pack_id, slug").eq("context_id", str(context_id)).execute().data
        )

        # Conta context items (dati gerarchici da CSV)
        item_repo = ContextItemRepository(self.db)
        context_items_count = item_repo.count_by_context(context_id)

        return {
            "fonti_informative": {
                "label": "Information Sources",
                "data": context.get("company_info", {}),
                "count": len(context.get("company_info", {}).get("key_offerings", [])),
            },
            "fonti_mercato": {
                "label": "Market Sources",
                "data": context.get("research_data", {}),
                "has_data": bool(context.get("research_data")),
            },
            "brand": {
                "label": "Brand",
                "data": context.get("voice_info", {}),
                "cards": [c for c in cards if c["card_type"] == "brand_voice"],
            },
            "operativo": {
                "label": "Operational Context",
                "cards": [
                    c
                    for c in cards
                    if c["card_type"] in ("product", "target", "campaigns", "topic", "performance", "feedback")
                ],
            },
            "agent_pack": {
                "label": "Agent Pack",
                "briefs": briefs,
                "count": len(briefs),
            },
            "context_items": {
                "label": "Imported Context Data",
                "count": context_items_count,
                "has_data": context_items_count > 0,
            },
        }

    def import_from_template(self, user_id: UUID, template_data: dict[str, Any]) -> dict[str, Any]:
        """
        Import a complete context from a JSON/YAML template.

        Args:
            user_id: User creating the context
            template_data: Parsed template data (already validated by Pydantic)

        Returns:
            Created context with all cards

        Raises:
            ValidationError: If template structure is invalid
            ConflictException: If context with same brand_name already exists
        """
        repo = ContextRepository(self.db)

        # Extract context metadata
        context_data = template_data["context"]
        context_data["user_id"] = str(user_id)
        context_data["status"] = "active"

        # Check for duplicate brand_name
        existing = repo.list_by_user(user_id)
        if any(c["brand_name"] == context_data["brand_name"] for c in existing):
            raise ConflictException(f"Context with brand_name '{context_data['brand_name']}' already exists")

        # Create context
        context = repo.create(context_data)
        context_id = context["id"]

        # Create cards
        cards_created = []
        for card_data in template_data["cards"]:
            card = {
                "context_id": context_id,
                "card_type": card_data["card_type"],
                "title": card_data["title"],
                "subtitle": card_data.get("subtitle"),
                "content": card_data["content"],
                "sort_order": card_data.get("sort_order", 0),
                "is_visible": card_data.get("is_visible", True),
            }
            created_card = self.db.table("cards").insert(card).execute()
            cards_created.append(created_card.data[0])

        logger.info(
            "Context imported from template | user=%s context=%s cards=%d", user_id, context_id, len(cards_created)
        )

        return {"context": context, "cards": cards_created, "cards_count": len(cards_created)}

    # ─── Context Items (hierarchical data) ───────────────

    def get_context_items(self, context_id: UUID, user_id: UUID) -> list:
        """Lista piatta di tutti gli items di un contesto."""
        self.get(context_id, user_id)  # ownership check
        repo = ContextItemRepository(self.db)
        return repo.list_by_context(context_id)

    def get_context_items_tree(self, context_id: UUID, user_id: UUID) -> list:
        """Albero annidato di tutti gli items di un contesto."""
        self.get(context_id, user_id)  # ownership check
        repo = ContextItemRepository(self.db)
        return repo.get_tree(context_id)

    def create_context_item(self, context_id: UUID, user_id: UUID, data: dict) -> dict:
        """Crea un singolo nodo nell'albero del contesto."""
        self.get(context_id, user_id)  # ownership check
        repo = ContextItemRepository(self.db)
        return repo.create(
            {
                "context_id": str(context_id),
                "parent_id": str(data["parent_id"]) if data.get("parent_id") else None,
                "level": data.get("level", 0),
                "name": data["name"],
                "content": data.get("content"),
                "sort_order": data.get("sort_order", 0),
            }
        )

    def update_context_item(self, context_id: UUID, item_id: UUID, user_id: UUID, data: dict) -> dict:
        """Aggiorna un nodo esistente (nome e/o contenuto)."""
        self.get(context_id, user_id)  # ownership check
        repo = ContextItemRepository(self.db)
        # Filtra solo i campi non-None
        updates = {k: v for k, v in data.items() if v is not None}
        if not updates:
            raise ValueError("No fields to update")
        return repo.update(item_id, updates)

    def delete_context_item(self, context_id: UUID, item_id: UUID, user_id: UUID) -> None:
        """Cancella un nodo (e i suoi figli grazie al CASCADE)."""
        self.get(context_id, user_id)  # ownership check
        repo = ContextItemRepository(self.db)
        repo.delete(item_id)

    def import_context_items_from_csv(self, context_id: UUID, user_id: UUID, csv_content: str) -> list:
        """
        Importa dati gerarchici da un CSV con colonne:
        Level 0, Level 1, Level 2, Level 3, Contenuto

        Ogni riga viene parsificata creando nodi nell'albero.
        I nodi duplicati (stesso nome sotto lo stesso genitore) non vengono ricreati.
        """
        self.get(context_id, user_id)  # ownership check
        repo = ContextItemRepository(self.db)

        # Prova diverse codifiche
        try:
            reader = csv.DictReader(io.StringIO(csv_content))
        except Exception as e:
            raise ValueError(f"Cannot parse CSV: {e}")

        # Valida colonne
        fieldnames = reader.fieldnames or []
        # Supporta sia colonne italiane che inglesi
        level_columns = []
        content_column = None

        for col in fieldnames:
            col_stripped = col.strip()
            if col_stripped.startswith("Level "):
                level_columns.append(col)
            elif col_stripped.lower() in ("contenuto", "content"):
                content_column = col

        if not level_columns:
            raise ValueError(f"CSV must have 'Level 0', 'Level 1', etc. columns. Found: {fieldnames}")
        if not content_column:
            raise ValueError(f"CSV must have a 'Contenuto' or 'Content' column. Found: {fieldnames}")

        # Ordina level columns per numero
        level_columns.sort(key=lambda c: int(c.strip().replace("Level ", "")))
        max_levels = len(level_columns)

        # Cancella items precedenti per questo contesto (re-import)
        repo.delete_by_context(context_id)

        # Traccia nodi esistenti: chiave = (parent_id, name) → item_id
        existing_nodes: dict[tuple, str] = {}
        sort_counter = 0

        rows = list(reader)
        logger.info("CSV import | context=%s rows=%d levels=%d", context_id, len(rows), max_levels)

        for row in rows:
            current_parent_id = None

            for _i, col in enumerate(level_columns):
                value = (row.get(col) or "").strip()
                if not value:
                    break  # nessun livello più profondo in questa riga

                level_num = int(col.strip().replace("Level ", ""))
                node_key = (current_parent_id, value)

                if node_key not in existing_nodes:
                    # Crea nuovo nodo
                    item = repo.create(
                        {
                            "context_id": str(context_id),
                            "parent_id": current_parent_id,
                            "level": level_num,
                            "name": value,
                            "content": None,  # contenuto viene aggiunto dopo
                            "sort_order": sort_counter,
                        }
                    )
                    existing_nodes[node_key] = item["id"]
                    sort_counter += 1

                current_parent_id = existing_nodes[node_key]

            # Dopo aver trovato/creato il nodo più profondo, aggiungi il contenuto
            content_value = (row.get(content_column) or "").strip()
            if current_parent_id and content_value:
                repo.update(UUID(current_parent_id), {"content": content_value})

        items = repo.list_by_context(context_id)
        logger.info("CSV import completed | context=%s items_created=%d", context_id, len(items))
        return items
