from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.domain.models import BriefCreate, BriefUpdate
from app.services.brief_service import BriefService

router = APIRouter()


@router.get("")
async def list_briefs(
    context_id: UUID | None = None,
    pack_id: UUID | None = None,
    user_id: UUID = Depends(get_current_user),
):
    return BriefService().list(user_id, context_id, pack_id)


@router.get("/by-slug/{slug}")
async def get_brief_by_slug(slug: str, user_id: UUID = Depends(get_current_user)):
    return BriefService().get_by_slug(slug, user_id)


@router.get("/{brief_id}")
async def get_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user)):
    return BriefService().get(brief_id, user_id)


@router.post("")
async def create_brief(data: BriefCreate, user_id: UUID = Depends(get_current_user)):
    return BriefService().create(user_id, data)


@router.patch("/{brief_id}")
async def update_brief(brief_id: UUID, data: BriefUpdate, user_id: UUID = Depends(get_current_user)):
    return BriefService().update(brief_id, user_id, data)


@router.delete("/{brief_id}")
async def delete_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user)):
    BriefService().delete(brief_id, user_id)
    return {"deleted": True}


@router.post("/{brief_id}/duplicate")
async def duplicate_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user)):
    return BriefService().duplicate(brief_id, user_id)
