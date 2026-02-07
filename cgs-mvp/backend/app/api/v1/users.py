from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.api.deps import get_current_user, get_db
from app.domain.models import ProfileUpdate

router = APIRouter()


@router.get("/profile")
async def get_profile(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    result = db.table("profiles").select("*").eq("id", str(user_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Profile not found")
    return result.data


@router.patch("/profile")
async def update_profile(data: ProfileUpdate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(400, "No fields to update")
    result = db.table("profiles").update(update_data).eq("id", str(user_id)).execute()
    return result.data[0] if result.data else None
