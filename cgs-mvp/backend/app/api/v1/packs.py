from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user, get_db

router = APIRouter()


@router.get("")
async def list_packs(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """List packs with user_status calculated from user's briefs."""
    packs = (db.table("agent_packs")
             .select("*")
             .eq("is_active", True)
             .order("sort_order")
             .execute().data)
    # For each pack, count user's briefs
    briefs = db.table("briefs").select("pack_id").eq("user_id", str(user_id)).execute().data
    user_pack_ids = {b["pack_id"] for b in briefs}

    for pack in packs:
        if pack["id"] in user_pack_ids:
            pack["user_status"] = "active"
        else:
            pack["user_status"] = pack.get("status", "available")
    return packs


@router.get("/{pack_id}")
async def get_pack(pack_id: UUID, db=Depends(get_db)):
    return db.table("agent_packs").select("*").eq("id", str(pack_id)).single().execute().data
