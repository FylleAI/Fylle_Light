import structlog
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.config.supabase import get_supabase_admin
from app.db.repositories.output_repo import OutputRepository
from app.infrastructure.storage.supabase_storage import StorageService
from app.exceptions import NotFoundException, ValidationException

logger = structlog.get_logger("cgs-mvp.output")


class OutputService:
    def __init__(self):
        self.db = get_supabase_admin()

    def list(self, user_id: UUID, brief_id: Optional[UUID] = None, context_id: Optional[UUID] = None) -> list:
        query = (self.db.table("outputs")
                 .select("*")
                 .eq("user_id", str(user_id))
                 .is_("parent_output_id", "null"))
        if brief_id:
            query = query.eq("brief_id", str(brief_id))
        if context_id:
            # outputs table has no context_id column - filter via briefs
            briefs = (self.db.table("briefs")
                      .select("id")
                      .eq("context_id", str(context_id))
                      .eq("user_id", str(user_id))
                      .execute().data)
            brief_ids = [b["id"] for b in briefs]
            if not brief_ids:
                return []
            query = query.in_("brief_id", brief_ids)
        return query.order("number", desc=True).execute().data

    def get_summary(self, user_id: UUID, context_id: Optional[UUID] = None) -> list:
        """Aggregated view by pack: brief counters + new flags."""
        briefs_query = (self.db.table("briefs")
                  .select("id, name, slug, pack_id")
                  .eq("user_id", str(user_id))
                  .eq("status", "active"))
        if context_id:
            briefs_query = briefs_query.eq("context_id", str(context_id))
        briefs = briefs_query.execute().data
        if not briefs:
            return []

        outputs = (self.db.table("outputs")
                   .select("brief_id, is_new")
                   .eq("user_id", str(user_id))
                   .is_("parent_output_id", "null")
                   .execute().data)

        brief_counts: dict[str, int] = {}
        brief_has_new: dict[str, bool] = {}
        for o in outputs:
            bid = o["brief_id"]
            brief_counts[bid] = brief_counts.get(bid, 0) + 1
            if o.get("is_new"):
                brief_has_new[bid] = True

        pack_ids = list({b["pack_id"] for b in briefs})
        packs = (self.db.table("agent_packs")
                 .select("id, name, slug")
                 .in_("id", pack_ids)
                 .execute().data)
        packs_map = {p["id"]: p for p in packs}

        result: dict[str, dict] = {}
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

    def get(self, output_id: UUID, user_id: UUID) -> dict:
        result = (self.db.table("outputs")
                  .select("*")
                  .eq("id", str(output_id))
                  .eq("user_id", str(user_id))
                  .single()
                  .execute())
        if not result.data:
            raise NotFoundException("Output not found")
        return result.data

    def get_latest(self, output_id: UUID, user_id: UUID) -> dict:
        repo = OutputRepository(self.db)
        latest = repo.get_latest_version(output_id)
        if not latest or latest.get("user_id") != str(user_id):
            raise NotFoundException("Output not found")
        return latest

    def get_download_url(self, output_id: UUID, user_id: UUID) -> dict:
        output = (self.db.table("outputs")
                  .select("file_path")
                  .eq("id", str(output_id))
                  .eq("user_id", str(user_id))
                  .single()
                  .execute())
        if output.data and output.data.get("file_path"):
            storage = StorageService()
            url = storage.get_signed_url(output.data["file_path"])
            return {"download_url": url}
        raise NotFoundException("No file available for download")

    def update(self, output_id: UUID, user_id: UUID, data: dict) -> list:
        allowed_fields = {"is_new", "text_content", "title"}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        if not update_data:
            raise ValidationException("No valid fields to update")
        return (self.db.table("outputs")
                .update(update_data)
                .eq("id", str(output_id))
                .eq("user_id", str(user_id))
                .execute().data)

    def delete(self, output_id: UUID, user_id: UUID) -> None:
        # Verify the output exists and belongs to this user
        output = (self.db.table("outputs")
                  .select("id")
                  .eq("id", str(output_id))
                  .eq("user_id", str(user_id))
                  .execute())
        if not output.data:
            raise NotFoundException("Output not found")

        # Collect all output IDs to delete: the target + any child versions
        child_outputs = (self.db.table("outputs")
                         .select("id")
                         .eq("parent_output_id", str(output_id))
                         .execute().data)
        child_ids = [c["id"] for c in child_outputs]
        all_ids = child_ids + [str(output_id)]

        # Delete in correct order to respect foreign key constraints:
        # 1. Chat messages (reference output_id)
        for oid in all_ids:
            self.db.table("chat_messages").delete().eq("output_id", oid).execute()

        # 2. Archive entries (reference output_id)
        for oid in all_ids:
            self.db.table("archive").delete().eq("output_id", oid).execute()

        # 3. Child outputs first, then parent
        for oid in child_ids:
            self.db.table("outputs").delete().eq("id", oid).execute()

        # 4. Finally the target output
        self.db.table("outputs").delete().eq("id", str(output_id)).eq("user_id", str(user_id)).execute()

        logger.info("Deleted output %s (+ %d children)", output_id, len(child_ids))

    def review(self, output_id: UUID, user_id: UUID, review_data) -> dict:
        """Review output: update archive + outputs status."""
        archive_update = {
            "review_status": review_data.status.value,
            "feedback": review_data.feedback,
            "feedback_categories": review_data.feedback_categories,
            "is_reference": review_data.is_reference,
            "reviewed_at": datetime.utcnow().isoformat(),
        }
        if review_data.reference_notes:
            archive_update["reference_notes"] = review_data.reference_notes

        self.db.table("archive").update(archive_update).eq(
            "output_id", str(output_id)
        ).eq("user_id", str(user_id)).execute()

        if review_data.status.value == "approved":
            self.db.table("outputs").update({"status": "completed"}).eq("id", str(output_id)).execute()
        elif review_data.status.value == "rejected":
            self.db.table("outputs").update({"status": "rejected"}).eq("id", str(output_id)).execute()

        logger.info("Reviewed output %s | status=%s", output_id, review_data.status.value)
        return {"reviewed": True, "status": review_data.status.value}
