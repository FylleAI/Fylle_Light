import logging
from uuid import UUID
from app.config.supabase import get_supabase_admin
from app.db.repositories.context_repo import ContextRepository
from app.exceptions import NotFoundException

logger = logging.getLogger("cgs-mvp.context")


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
            raise NotFoundException("Context non trovato")
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
        return (self.db.table("cards")
                .select("*")
                .eq("context_id", str(context_id))
                .order("sort_order")
                .execute().data)

    def update_card(self, context_id: UUID, card_type: str, user_id: UUID, data: dict) -> list:
        self.get(context_id, user_id)  # ownership check
        return (self.db.table("cards")
                .update(data)
                .eq("context_id", str(context_id))
                .eq("card_type", card_type)
                .execute().data)

    def get_summary(self, context_id: UUID, user_id: UUID) -> dict:
        """Restituisce le 5 aree del contesto per il Design Lab."""
        context = (self.db.table("contexts")
                   .select("*")
                   .eq("id", str(context_id))
                   .single()
                   .execute().data)
        if not context or context["user_id"] != str(user_id):
            raise NotFoundException("Context non trovato")

        cards = (self.db.table("cards")
                 .select("card_type, title")
                 .eq("context_id", str(context_id))
                 .execute().data)
        briefs = (self.db.table("briefs")
                  .select("id, name, pack_id, slug")
                  .eq("context_id", str(context_id))
                  .execute().data)

        return {
            "fonti_informative": {
                "label": "Fonti Informative",
                "data": context.get("company_info", {}),
                "count": len(context.get("company_info", {}).get("key_offerings", [])),
            },
            "fonti_mercato": {
                "label": "Fonti di Mercato",
                "data": context.get("research_data", {}),
                "has_data": bool(context.get("research_data")),
            },
            "brand": {
                "label": "Brand",
                "data": context.get("voice_info", {}),
                "cards": [c for c in cards if c["card_type"] == "brand_voice"],
            },
            "operativo": {
                "label": "Contesto Operativo",
                "cards": [c for c in cards if c["card_type"] in (
                    "product", "target", "campaigns", "topic", "performance", "feedback"
                )],
            },
            "agent_pack": {
                "label": "Agent Pack",
                "briefs": briefs,
                "count": len(briefs),
            },
        }
