from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.api.deps import get_current_user, get_db
from app.domain.models import ContextCreate, ContextUpdate
from app.db.repositories.context_repo import ContextRepository

router = APIRouter()


@router.get("")
async def list_contexts(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    return repo.list_by_user(user_id)


@router.get("/{context_id}")
async def get_context(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    context = repo.get_with_cards(context_id)
    if not context or context["user_id"] != str(user_id):
        raise HTTPException(404)
    return context


@router.post("")
async def create_context(data: ContextCreate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    return repo.create({**data.model_dump(), "user_id": str(user_id)})


@router.patch("/{context_id}")
async def update_context(context_id: UUID, data: ContextUpdate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    return repo.update(context_id, data.model_dump(exclude_none=True))


@router.delete("/{context_id}")
async def delete_context(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    repo.delete(context_id)
    return {"deleted": True}


@router.get("/{context_id}/cards")
async def get_cards(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return (db.table("cards")
            .select("*")
            .eq("context_id", str(context_id))
            .order("sort_order")
            .execute().data)


@router.patch("/{context_id}/cards/{card_type}")
async def update_card(context_id: UUID, card_type: str, data: dict, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return (db.table("cards")
            .update(data)
            .eq("context_id", str(context_id))
            .eq("card_type", card_type)
            .execute().data)


@router.get("/{context_id}/summary")
async def get_context_summary(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Restituisce le 5 aree del contesto per il Design Lab."""
    context = db.table("contexts").select("*").eq("id", str(context_id)).single().execute().data
    if not context or context["user_id"] != str(user_id):
        raise HTTPException(404)
    cards = db.table("cards").select("card_type, title").eq("context_id", str(context_id)).execute().data
    briefs = db.table("briefs").select("id, name, pack_id").eq("context_id", str(context_id)).execute().data

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
