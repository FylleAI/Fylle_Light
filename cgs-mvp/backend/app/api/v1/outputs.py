from fastapi import APIRouter, Depends
from uuid import UUID
from typing import Optional
from app.api.deps import get_current_user
from app.domain.models import ReviewRequest
from app.services.output_service import OutputService

router = APIRouter()


@router.get("")
async def list_outputs(brief_id: Optional[UUID] = None, context_id: Optional[UUID] = None, user_id: UUID = Depends(get_current_user)):
    """Lista outputs. ?brief_id=X filtra per brief, ?context_id=X filtra per contesto."""
    return OutputService().list(user_id, brief_id, context_id)


@router.get("/summary")
async def outputs_summary(context_id: Optional[UUID] = None, user_id: UUID = Depends(get_current_user)):
    """Vista aggregata per pack. ?context_id=X filtra per contesto."""
    return OutputService().get_summary(user_id, context_id)


@router.get("/{output_id}")
async def get_output(output_id: UUID, user_id: UUID = Depends(get_current_user)):
    return OutputService().get(output_id, user_id)


@router.get("/{output_id}/latest")
async def get_latest_version(output_id: UUID, user_id: UUID = Depends(get_current_user)):
    """Risale la chain di versioni e restituisce l'ultima versione dell'output."""
    return OutputService().get_latest(output_id, user_id)


@router.get("/{output_id}/download")
async def download_output(output_id: UUID, user_id: UUID = Depends(get_current_user)):
    return OutputService().get_download_url(output_id, user_id)


@router.patch("/{output_id}")
async def update_output(output_id: UUID, data: dict, user_id: UUID = Depends(get_current_user)):
    """Per marcare contenuto come visto: {"is_new": false}."""
    return OutputService().update(output_id, user_id, data)


@router.delete("/{output_id}")
async def delete_output(output_id: UUID, user_id: UUID = Depends(get_current_user)):
    OutputService().delete(output_id, user_id)
    return {"deleted": True}


@router.post("/{output_id}/review")
async def review_output(output_id: UUID, req: ReviewRequest, user_id: UUID = Depends(get_current_user)):
    """Path unificato per review. Aggiorna sia archive.review_status sia outputs.status."""
    return OutputService().review(output_id, user_id, req)
