from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.api.deps import get_current_user, get_db
from app.domain.models import ReviewRequest
from app.infrastructure.storage.supabase_storage import StorageService
from app.db.repositories.output_repo import OutputRepository

router = APIRouter()


@router.get("")
async def list_outputs(
    brief_id: Optional[UUID] = None,
    user_id: UUID = Depends(get_current_user),
    db=Depends(get_db),
):
    """Lista outputs. Con ?brief_id=X filtra per brief (Design Lab)."""
    query = db.table("outputs").select("*").eq("user_id", str(user_id))
    if brief_id:
        query = query.eq("brief_id", str(brief_id))
    # Solo output "radice" (non versioni intermedie da chat edit)
    query = query.is_("parent_output_id", "null")
    return query.order("number", desc=True).execute().data


@router.get("/summary")
async def outputs_summary(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Vista aggregata per pack: contatori brief + flag nuovi.
    Output: [{pack_id, pack_name, pack_slug, briefs: [{id, name, slug, count, hasNew}]}]
    """
    # Carica briefs dell'utente con info pack
    briefs = (db.table("briefs")
              .select("id, name, slug, pack_id")
              .eq("user_id", str(user_id))
              .eq("status", "active")
              .execute().data)

    if not briefs:
        return []

    # Carica outputs radice dell'utente
    outputs = (db.table("outputs")
               .select("brief_id, is_new")
               .eq("user_id", str(user_id))
               .is_("parent_output_id", "null")
               .execute().data)

    # Conta per brief
    brief_counts = {}
    brief_has_new = {}
    for o in outputs:
        bid = o["brief_id"]
        brief_counts[bid] = brief_counts.get(bid, 0) + 1
        if o.get("is_new"):
            brief_has_new[bid] = True

    # Carica packs
    pack_ids = list({b["pack_id"] for b in briefs})
    packs = (db.table("agent_packs")
             .select("id, name, slug")
             .in_("id", pack_ids)
             .execute().data)
    packs_map = {p["id"]: p for p in packs}

    # Aggrega per pack
    result = {}
    for b in briefs:
        pid = b["pack_id"]
        if pid not in result:
            pack_info = packs_map.get(pid, {})
            result[pid] = {
                "pack_id": pid,
                "pack_name": pack_info.get("name", ""),
                "pack_slug": pack_info.get("slug", ""),
                "briefs": [],
            }
        result[pid]["briefs"].append({
            "id": b["id"],
            "name": b["name"],
            "slug": b.get("slug"),
            "count": brief_counts.get(b["id"], 0),
            "hasNew": brief_has_new.get(b["id"], False),
        })

    return list(result.values())


@router.get("/{output_id}")
async def get_output(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    result = (db.table("outputs")
              .select("*")
              .eq("id", str(output_id))
              .eq("user_id", str(user_id))
              .single()
              .execute())
    if not result.data:
        raise HTTPException(404, "Output not found")
    return result.data


@router.get("/{output_id}/latest")
async def get_latest_version(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Risale la chain di versioni e restituisce l'ultima versione dell'output."""
    repo = OutputRepository(db)
    latest = repo.get_latest_version(output_id)
    if not latest or latest.get("user_id") != str(user_id):
        raise HTTPException(404, "Output not found")
    return latest


@router.get("/{output_id}/download")
async def download_output(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    output = (db.table("outputs")
              .select("file_path")
              .eq("id", str(output_id))
              .eq("user_id", str(user_id))
              .single()
              .execute())
    if output.data and output.data.get("file_path"):
        storage = StorageService()
        url = storage.get_signed_url(output.data["file_path"])
        return {"download_url": url}
    raise HTTPException(404, "No file available")


@router.patch("/{output_id}")
async def update_output(output_id: UUID, data: dict, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Per marcare contenuto come visto: {"is_new": false}."""
    allowed_fields = {"is_new"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        raise HTTPException(400, "No valid fields to update")
    return (db.table("outputs")
            .update(update_data)
            .eq("id", str(output_id))
            .eq("user_id", str(user_id))
            .execute().data)


@router.delete("/{output_id}")
async def delete_output(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    db.table("outputs").delete().eq("id", str(output_id)).eq("user_id", str(user_id)).execute()
    return {"deleted": True}


@router.post("/{output_id}/review")
async def review_output(output_id: UUID, req: ReviewRequest, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Path unificato per review (spostato da archive.py).
    Aggiorna sia archive.review_status sia outputs.status."""
    # Aggiorna archive
    archive_update = {
        "review_status": req.status.value,
        "feedback": req.feedback,
        "feedback_categories": req.feedback_categories,
        "is_reference": req.is_reference,
        "reviewed_at": datetime.utcnow().isoformat(),
    }
    if req.reference_notes:
        archive_update["reference_notes"] = req.reference_notes

    db.table("archive").update(archive_update).eq(
        "output_id", str(output_id)
    ).eq("user_id", str(user_id)).execute()

    # Aggiorna outputs.status → "completato" se approved, invariato se rejected
    if req.status.value == "approved":
        db.table("outputs").update({"status": "completato"}).eq("id", str(output_id)).execute()

    return {"reviewed": True}
