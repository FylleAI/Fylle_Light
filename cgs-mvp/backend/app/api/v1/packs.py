import json
from typing import Any
from uuid import UUID

import yaml
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field, validator

from app.api.deps import get_current_user
from app.services.pack_service import PackService

router = APIRouter()


# ==================== REQUEST MODELS ====================


class ClonePackRequest(BaseModel):
    context_id: str
    name: str | None = None


class CreatePackRequest(BaseModel):
    context_id: str
    slug: str
    name: str
    description: str
    icon: str
    outcome: str
    status: str | None = "available"
    content_type_id: str | None = None
    sort_order: int | None = 0

    # ← NEW: JSONB fields for workflow configuration
    agents_config: list[dict[str, Any]] = []
    brief_questions: list[dict[str, Any]] = []
    tools_config: list[dict[str, Any]] = []
    prompt_templates: dict[str, str] = {}
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"


class UpdatePackRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    outcome: str | None = None
    status: str | None = None
    is_active: bool | None = None

    # ← NEW: JSONB fields (optional for updates)
    agents_config: list[dict[str, Any]] | None = None
    brief_questions: list[dict[str, Any]] | None = None
    tools_config: list[dict[str, Any]] | None = None
    prompt_templates: dict[str, str] | None = None
    default_llm_provider: str | None = None
    default_llm_model: str | None = None


class PackImport(BaseModel):
    """Schema for importing pack from JSON/YAML template"""

    version: str = "1.0"
    name: str
    description: str = ""
    icon: str = "package"
    agents: list[dict[str, Any]] = Field(min_length=1, max_length=10)
    brief_questions: list[dict[str, Any]] = []
    tools_config: list[dict[str, Any]] = []
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"

    @validator("agents")
    def validate_agents(cls, v):
        for agent in v:
            if "name" not in agent:
                raise ValueError("Each agent must have 'name'")
            if "prompt" not in agent:
                raise ValueError("Each agent must have 'prompt'")
        return v


# ==================== ENDPOINTS ====================


@router.get("")
async def list_packs(
    context_id: UUID | None = None,
    user_id: UUID = Depends(get_current_user),
):
    """
    List packs for the current user.

    - If context_id provided: returns template packs + context-specific packs
    - If no context_id: returns all templates + all user's packs across contexts
    """
    return PackService().list_packs(user_id, context_id)


@router.get("/{pack_id}")
async def get_pack(pack_id: UUID, user_id: UUID = Depends(get_current_user)):
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


@router.post("/import")
async def import_pack(
    file: UploadFile = File(...),
    context_id: str | None = None,
    user_id: UUID = Depends(get_current_user),
):
    """
    Import agent pack from JSON/YAML template.

    - **file**: JSON or YAML file containing pack template
    - **context_id**: Optional context UUID (omit for global template)

    Returns pack_id, name, and agents_count
    """
    # Read file content
    content = await file.read()

    # Parse based on extension
    try:
        if file.filename.endswith(".json"):
            template_data = json.loads(content)
        elif file.filename.endswith((".yaml", ".yml")):
            template_data = yaml.safe_load(content)
        else:
            raise HTTPException(400, "File must be .json, .yaml, or .yml")
    except (json.JSONDecodeError, yaml.YAMLError) as e:
        raise HTTPException(400, f"Invalid file format: {str(e)}")

    # Validate with Pydantic
    from pydantic import ValidationError

    try:
        validated = PackImport(**template_data)
    except ValidationError as e:
        raise HTTPException(422, f"Template validation failed: {e.errors()}")
    except Exception as e:
        raise HTTPException(422, f"Template validation failed: {str(e)}")

    # Import pack
    try:
        pack = PackService().import_from_template(user_id, UUID(context_id) if context_id else None, validated.dict())
        return {
            "pack_id": pack["id"],
            "name": pack["name"],
            "agents_count": len(pack.get("agents_config", [])),
        }
    except Exception as e:
        raise HTTPException(500, f"Import failed: {str(e)}")


@router.get("/{pack_id}/export")
async def export_pack(pack_id: UUID, user_id: UUID = Depends(get_current_user)):
    """
    Export pack as JSON template.

    - **pack_id**: UUID of the pack

    Returns JSON template ready for download
    """
    pack = PackService().get_pack(pack_id)

    # Build template
    template = {
        "version": "1.0",
        "name": pack["name"],
        "description": pack.get("description", ""),
        "icon": pack.get("icon", "package"),
        "agents": pack.get("agents_config", []),
        "brief_questions": pack.get("brief_questions", []),
        "tools_config": pack.get("tools_config", []),
        "default_llm_provider": pack.get("default_llm_provider", "openai"),
        "default_llm_model": pack.get("default_llm_model", "gpt-4o"),
    }

    return template
