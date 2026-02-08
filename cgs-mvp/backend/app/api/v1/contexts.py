from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user
from app.domain.models import ContextCreate, ContextUpdate
from app.services.context_service import ContextService

router = APIRouter()


@router.get("")
async def list_contexts(user_id: UUID = Depends(get_current_user)):
    return ContextService().list(user_id)


@router.get("/{context_id}")
async def get_context(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    return ContextService().get(context_id, user_id)


@router.post("")
async def create_context(data: ContextCreate, user_id: UUID = Depends(get_current_user)):
    return ContextService().create(user_id, data.model_dump())


@router.patch("/{context_id}")
async def update_context(context_id: UUID, data: ContextUpdate, user_id: UUID = Depends(get_current_user)):
    return ContextService().update(context_id, user_id, data.model_dump(exclude_none=True))


@router.delete("/{context_id}")
async def delete_context(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    ContextService().delete(context_id, user_id)
    return {"deleted": True}


@router.get("/{context_id}/cards")
async def get_cards(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    return ContextService().get_cards(context_id, user_id)


@router.patch("/{context_id}/cards/{card_type}")
async def update_card(context_id: UUID, card_type: str, data: dict, user_id: UUID = Depends(get_current_user)):
    return ContextService().update_card(context_id, card_type, user_id, data)


@router.get("/{context_id}/summary")
async def get_context_summary(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    return ContextService().get_summary(context_id, user_id)
