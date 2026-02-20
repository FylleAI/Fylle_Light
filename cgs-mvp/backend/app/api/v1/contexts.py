import json
from uuid import UUID

import structlog
import yaml
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import ValidationError

from app.api.deps import get_current_user
from app.domain.models import ContextCreate, ContextImport, ContextUpdate
from app.exceptions import ConflictException, NotFoundException
from app.services.context_service import ContextService

router = APIRouter()
logger = structlog.get_logger("cgs-mvp.contexts")


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


@router.post("/import")
async def import_context(file: UploadFile = File(...), user_id: UUID = Depends(get_current_user)):
    """
    Import a context from a JSON or YAML template file.

    The file must contain:
    - version, template_type
    - context: {brand_name, name, company_info, audience_info, voice_info, goals_info}
    - cards: [{card_type, title, content}, ...]

    Returns:
        Created context with cards_count
    """
    # Read file content
    content = await file.read()

    # Parse based on file extension
    try:
        if file.filename.endswith(".json"):
            template_data = json.loads(content)
        elif file.filename.endswith((".yaml", ".yml")):
            template_data = yaml.safe_load(content)
        else:
            raise HTTPException(status_code=400, detail="File must be .json, .yaml, or .yml")
    except (json.JSONDecodeError, yaml.YAMLError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")

    # Validate with Pydantic
    try:
        validated = ContextImport(**template_data)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=f"Template validation failed: {e.errors()}")

    # Import context
    try:
        result = ContextService().import_from_template(user_id, validated.model_dump())
        return {
            "context_id": result["context"]["id"],
            "brand_name": result["context"]["brand_name"],
            "cards_count": result["cards_count"],
        }
    except ConflictException as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error("Context import failed | user=%s error=%s", user_id, str(e))
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/{context_id}/export")
async def export_context(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    """Export context as JSON template"""
    service = ContextService()
    context = service.get(context_id, user_id)
    cards = service.get_cards(context_id, user_id)

    return {
        "version": "1.0",
        "template_type": "context",
        "context": {
            "brand_name": context["brand_name"],
            "name": context["name"],
            "website": context.get("website"),
            "industry": context.get("industry"),
            "company_info": context.get("company_info", {}),
            "audience_info": context.get("audience_info", {}),
            "voice_info": context.get("voice_info", {}),
            "goals_info": context.get("goals_info", {}),
        },
        "cards": [
            {
                "card_type": card["card_type"],
                "title": card["title"],
                "subtitle": card.get("subtitle"),
                "content": card["content"],
            }
            for card in cards
        ],
    }


# ─── Context Items (hierarchical data) ───────────────


@router.get("/{context_id}/items")
async def get_context_items(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    """Get all context items as a flat list."""
    return ContextService().get_context_items(context_id, user_id)


@router.get("/{context_id}/items/tree")
async def get_context_items_tree(context_id: UUID, user_id: UUID = Depends(get_current_user)):
    """Get context items as a nested tree structure."""
    return ContextService().get_context_items_tree(context_id, user_id)


@router.post("/{context_id}/items")
async def create_context_item(context_id: UUID, data: dict, user_id: UUID = Depends(get_current_user)):
    """Create a single context item node."""
    try:
        return ContextService().create_context_item(context_id, user_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{context_id}/items/{item_id}")
async def update_context_item(context_id: UUID, item_id: UUID, data: dict, user_id: UUID = Depends(get_current_user)):
    """Update a context item (name, content, or sort_order)."""
    try:
        return ContextService().update_context_item(context_id, item_id, user_id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{context_id}/items/{item_id}")
async def delete_context_item(context_id: UUID, item_id: UUID, user_id: UUID = Depends(get_current_user)):
    """Delete a context item and all its children (cascade)."""
    try:
        ContextService().delete_context_item(context_id, item_id, user_id)
        return {"deleted": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{context_id}/items/import-csv")
async def import_context_items_csv(
    context_id: UUID, file: UploadFile = File(...), user_id: UUID = Depends(get_current_user)
):
    """
    Import hierarchical context data from a CSV file.

    CSV must have columns: Level 0, Level 1, Level 2, Level 3, Contenuto
    Re-importing replaces all existing items for this context.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()

    # Prova diverse codifiche
    csv_text = None
    for encoding in ["utf-8-sig", "utf-8", "latin-1", "cp1252"]:
        try:
            csv_text = content.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if csv_text is None:
        raise HTTPException(status_code=400, detail="Cannot decode CSV file. Try saving it as UTF-8.")

    try:
        items = ContextService().import_context_items_from_csv(context_id, user_id, csv_text)
        return {"items_count": len(items), "message": f"Successfully imported {len(items)} context items"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except NotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("CSV import failed | context=%s error=%s", context_id, str(e))
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
