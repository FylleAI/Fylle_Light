import logging
from uuid import UUID
from typing import Dict, Any
from app.config.supabase import get_supabase_admin
from app.db.repositories.context_repo import ContextRepository
from app.exceptions import NotFoundException, ConflictException

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
        """Return the 5 context areas for the Design Lab."""
        context = (self.db.table("contexts")
                   .select("*")
                   .eq("id", str(context_id))
                   .single()
                   .execute().data)
        if not context or context["user_id"] != str(user_id):
            raise NotFoundException("Context not found")

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

    def import_from_template(
        self,
        user_id: UUID,
        template_data: Dict[str, Any]
    ) -> Dict[str, Any]:
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
        context_data = template_data['context']
        context_data['user_id'] = str(user_id)
        context_data['status'] = 'active'

        # Check for duplicate brand_name
        existing = repo.list_by_user(user_id)
        if any(c['brand_name'] == context_data['brand_name'] for c in existing):
            raise ConflictException(
                f"Context with brand_name '{context_data['brand_name']}' already exists"
            )

        # Create context
        context = repo.create(context_data)
        context_id = context['id']

        # Create cards
        cards_created = []
        for card_data in template_data['cards']:
            card = {
                'context_id': context_id,
                'card_type': card_data['card_type'],
                'title': card_data['title'],
                'subtitle': card_data.get('subtitle'),
                'content': card_data['content'],
                'sort_order': card_data.get('sort_order', 0),
                'is_visible': card_data.get('is_visible', True)
            }
            created_card = self.db.table('cards').insert(card).execute()
            cards_created.append(created_card.data[0])

        logger.info(
            "Context imported from template | user=%s context=%s cards=%d",
            user_id, context_id, len(cards_created)
        )

        return {
            'context': context,
            'cards': cards_created,
            'cards_count': len(cards_created)
        }
