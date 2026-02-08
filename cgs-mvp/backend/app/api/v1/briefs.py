from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from typing import Optional
from app.api.deps import get_current_user, get_db
from app.domain.models import BriefCreate, BriefUpdate
from app.services.brief_service import BriefService

router = APIRouter()


@router.get("")
async def list_briefs(
    context_id: Optional[UUID] = None,
    pack_id: Optional[UUID] = None,
    user_id: UUID = Depends(get_current_user),
    db=Depends(get_db),
):
    query = db.table("briefs").select("*").eq("user_id", str(user_id))
    if context_id:
        query = query.eq("context_id", str(context_id))
    if pack_id:
        query = query.eq("pack_id", str(pack_id))
    return query.order("created_at", desc=True).execute().data


@router.get("/by-slug/{slug}")
async def get_brief_by_slug(slug: str, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Lookup brief per slug (usato dal frontend Design Lab con route :briefSlug)."""
    result = (db.table("briefs")
              .select("*")
              .eq("slug", slug)
              .eq("user_id", str(user_id))
              .single()
              .execute())
    if not result.data:
        raise HTTPException(404, "Brief not found")
    return result.data


@router.get("/{brief_id}")
async def get_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    result = (db.table("briefs")
              .select("*")
              .eq("id", str(brief_id))
              .eq("user_id", str(user_id))
              .single()
              .execute())
    if not result.data:
        raise HTTPException(404, "Brief not found")
    return result.data


@router.post("")
async def create_brief(data: BriefCreate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    # Carica questions dal pack
    pack = db.table("agent_packs").select("brief_questions").eq("id", str(data.pack_id)).single().execute()
    if not pack.data:
        raise HTTPException(404, "Pack not found")

    # Genera slug e compila brief
    brief_svc = BriefService()
    slug = brief_svc.generate_slug(data.name)
    questions = pack.data["brief_questions"]
    compiled_brief = brief_svc.compile_brief(questions, data.answers) if data.answers else None

    return db.table("briefs").insert({
        **data.model_dump(mode="json"),
        "user_id": str(user_id),
        "slug": slug,
        "questions": questions,
        "compiled_brief": compiled_brief,
        "status": "active",
    }).execute().data[0]


@router.patch("/{brief_id}")
async def update_brief(brief_id: UUID, data: BriefUpdate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(400, "No fields to update")

    # Se le risposte cambiano, ricompila il brief
    if "answers" in update_data:
        brief = db.table("briefs").select("questions").eq("id", str(brief_id)).single().execute().data
        if brief:
            brief_svc = BriefService()
            update_data["compiled_brief"] = brief_svc.compile_brief(brief["questions"], update_data["answers"])

    return (db.table("briefs")
            .update(update_data)
            .eq("id", str(brief_id))
            .eq("user_id", str(user_id))
            .execute().data)


@router.delete("/{brief_id}")
async def delete_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    db.table("briefs").delete().eq("id", str(brief_id)).eq("user_id", str(user_id)).execute()
    return {"deleted": True}


@router.post("/{brief_id}/duplicate")
async def duplicate_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Duplica un brief con un nuovo nome e slug."""
    original = (db.table("briefs")
                .select("*")
                .eq("id", str(brief_id))
                .eq("user_id", str(user_id))
                .single()
                .execute())
    if not original.data:
        raise HTTPException(404, "Brief not found")

    orig = original.data
    brief_svc = BriefService()
    new_name = f"{orig['name']} (copia)"
    new_slug = brief_svc.generate_slug(new_name)

    new_brief = db.table("briefs").insert({
        "context_id": orig["context_id"],
        "pack_id": orig["pack_id"],
        "user_id": str(user_id),
        "name": new_name,
        "slug": new_slug,
        "description": orig.get("description"),
        "questions": orig["questions"],
        "answers": orig.get("answers", {}),
        "compiled_brief": orig.get("compiled_brief"),
        "settings": orig.get("settings", {}),
        "status": "draft",
    }).execute().data[0]

    return new_brief
