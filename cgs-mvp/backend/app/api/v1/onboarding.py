from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, get_db
from app.domain.models import OnboardingStart
from app.services.onboarding_service import OnboardingService

router = APIRouter()


@router.post("/start")
async def start_onboarding(data: OnboardingStart, user_id: UUID = Depends(get_current_user)):
    service = OnboardingService()
    return await service.start(user_id, data.model_dump())


@router.get("/{session_id}/status")
async def get_status(session_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    session = (
        db.table("onboarding_sessions")
        .select("*")
        .eq("id", str(session_id))
        .eq("user_id", str(user_id))
        .single()
        .execute()
    )
    return session.data


@router.post("/{session_id}/answers")
async def submit_answers(session_id: UUID, answers: dict, user_id: UUID = Depends(get_current_user)):
    service = OnboardingService()
    return await service.process_answers(session_id, user_id, answers)
