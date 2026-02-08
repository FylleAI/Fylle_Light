from fastapi import APIRouter, Depends, Request
from uuid import UUID
from app.api.deps import get_current_user
from app.domain.models import ChatRequest
from app.services.chat_service import ChatService
from app.middleware.rate_limit import limiter

router = APIRouter()


@router.post("/outputs/{output_id}")
@limiter.limit("20/minute")
async def chat_with_output(request: Request, output_id: UUID, req: ChatRequest, user_id: UUID = Depends(get_current_user)):
    service = ChatService()
    result = await service.chat(output_id, user_id, req.message)
    return result


@router.get("/outputs/{output_id}/history")
async def get_chat_history(output_id: UUID, user_id: UUID = Depends(get_current_user)):
    service = ChatService()
    return service.get_history(output_id)
