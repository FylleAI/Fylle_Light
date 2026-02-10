from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from uuid import UUID
from pydantic import ValidationError
import json
import yaml
from app.api.deps import get_current_user
from app.domain.models import ContextCreate, ContextUpdate, ContextImport
from app.services.context_service import ContextService
from app.exceptions import ConflictException
import logging

router = APIRouter()
logger = logging.getLogger("cgs-mvp.contexts")


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
async def import_context(
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user)
):
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
        if file.filename.endswith('.json'):
            template_data = json.loads(content)
        elif file.filename.endswith(('.yaml', '.yml')):
            template_data = yaml.safe_load(content)
        else:
            raise HTTPException(
                status_code=400,
                detail="File must be .json, .yaml, or .yml"
            )
    except (json.JSONDecodeError, yaml.YAMLError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format: {str(e)}"
        )

    # Validate with Pydantic
    try:
        validated = ContextImport(**template_data)
    except ValidationError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Template validation failed: {e.errors()}"
        )

    # Import context
    try:
        result = ContextService().import_from_template(
            user_id,
            validated.model_dump()
        )
        return {
            'context_id': result['context']['id'],
            'brand_name': result['context']['brand_name'],
            'cards_count': result['cards_count']
        }
    except ConflictException as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        logger.error("Context import failed | user=%s error=%s", user_id, str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Import failed: {str(e)}"
        )


@router.get("/{context_id}/export")
async def export_context(
    context_id: UUID,
    user_id: UUID = Depends(get_current_user)
):
    """Export context as JSON template"""
    service = ContextService()
    context = service.get(context_id, user_id)
    cards = service.get_cards(context_id, user_id)

    return {
        'version': '1.0',
        'template_type': 'context',
        'context': {
            'brand_name': context['brand_name'],
            'name': context['name'],
            'website': context.get('website'),
            'industry': context.get('industry'),
            'company_info': context.get('company_info', {}),
            'audience_info': context.get('audience_info', {}),
            'voice_info': context.get('voice_info', {}),
            'goals_info': context.get('goals_info', {})
        },
        'cards': [
            {
                'card_type': card['card_type'],
                'title': card['title'],
                'subtitle': card.get('subtitle'),
                'content': card['content']
            }
            for card in cards
        ]
    }
