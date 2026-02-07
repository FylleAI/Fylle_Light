from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user, get_db
from app.domain.models import ArchiveSearch
from app.db.repositories.archive_repo import ArchiveRepository
from app.infrastructure.llm.openai_adapter import OpenAIAdapter
from openai import AsyncOpenAI
from app.config.settings import get_settings

router = APIRouter()


@router.get("")
async def list_archive(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return (db.table("archive")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .execute().data)


@router.get("/stats")
async def archive_stats(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    result = db.rpc("get_archive_stats", {"p_user_id": str(user_id)}).execute()
    return result.data[0] if result.data else {"total": 0, "approved": 0, "rejected": 0, "pending_count": 0, "references_count": 0}


@router.post("/search")
async def search_archive(data: ArchiveSearch, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Semantic search nell'archivio usando embeddings."""
    # Genera embedding della query
    client = AsyncOpenAI(api_key=get_settings().openai_api_key)
    embedding_response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=data.query,
    )
    embedding = embedding_response.data[0].embedding

    # Cerca nell'archivio
    repo = ArchiveRepository(db)
    results = repo.semantic_search(embedding, data.context_id)
    return results


# NOTA: la review è stata spostata su outputs.py (path unificato: POST /api/v1/outputs/{id}/review)
