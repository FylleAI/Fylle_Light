from fastapi import APIRouter, Depends, Body
from uuid import UUID
from typing import Optional, Dict, Any
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services.pack_service import PackService

router = APIRouter()


# ==================== REQUEST MODELS ====================


class ClonePackRequest(BaseModel):
    context_id: str
    name: Optional[str] = None


class CreatePackRequest(BaseModel):
    context_id: str
    slug: str
    name: str
    description: str
    icon: str
    outcome: str
    status: Optional[str] = "available"
    content_type_id: Optional[str] = None
    sort_order: Optional[int] = 0


class UpdatePackRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    outcome: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


# ==================== ENDPOINTS ====================


@router.get("")
async def list_packs(
    context_id: Optional[UUID] = None,
    user_id: UUID = Depends(get_current_user),
):
    """
    List packs for the current user.

    - If context_id provided: returns template packs + context-specific packs
    - If no context_id: returns all templates + all user's packs across contexts
    """
    return PackService().list_packs(user_id, context_id)


@router.get("/{pack_id}")
async def get_pack(pack_id: UUID):
    """Get a single pack by ID."""
    return PackService().get_pack(pack_id)


@router.post("")
async def create_pack(
    data: CreatePackRequest,
    user_id: UUID = Depends(get_current_user),
):
    """
    Create a new pack for a context.

    - **context_id**: UUID of the context
    - **slug**: URL-safe identifier
    - **name**: Display name
    - **description**: Pack description
    - **icon**: Icon emoji or identifier
    - **outcome**: What the pack produces
    """
    pack_data = data.dict(exclude={"context_id"})
    return PackService().create_pack(
        context_id=UUID(data.context_id),
        user_id=user_id,
        pack_data=pack_data,
    )


@router.post("/{pack_id}/clone")
async def clone_pack(
    pack_id: UUID,
    data: ClonePackRequest,
    user_id: UUID = Depends(get_current_user),
):
    """
    Clone a pack to a specific context.

    - **pack_id**: UUID of the pack to clone (template or existing)
    - **context_id**: Target context UUID
    - **name**: Optional new name (defaults to "{original} (Copy)")
    """
    return PackService().clone_pack_to_context(
        pack_id=pack_id,
        context_id=UUID(data.context_id),
        user_id=user_id,
        name=data.name,
    )


@router.patch("/{pack_id}")
async def update_pack(
    pack_id: UUID,
    data: UpdatePackRequest,
    user_id: UUID = Depends(get_current_user),
):
    """
    Update a pack (user must own it).

    - **pack_id**: UUID of the pack
    """
    updates = data.dict(exclude_unset=True)
    return PackService().update_pack(pack_id, user_id, updates)


@router.delete("/{pack_id}")
async def delete_pack(
    pack_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    Delete a pack (user must own it, no briefs using it).

    - **pack_id**: UUID of the pack
    """
    PackService().delete_pack(pack_id, user_id)
    return {"deleted": True}
