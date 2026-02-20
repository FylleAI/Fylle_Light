from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.domain.models import ArchiveSearch
from app.services.archive_service import ArchiveService

router = APIRouter()


@router.get("")
async def list_archive(context_id: UUID | None = None, user_id: UUID = Depends(get_current_user)):
    return ArchiveService().list(user_id, context_id)


@router.get("/stats")
async def archive_stats(context_id: UUID | None = None, user_id: UUID = Depends(get_current_user)):
    return ArchiveService().get_stats(user_id, context_id)


@router.post("/search")
async def search_archive(data: ArchiveSearch, user_id: UUID = Depends(get_current_user)):
    """Semantic search nell'archivio usando embeddings."""
    return await ArchiveService().semantic_search(data.query, data.context_id)
