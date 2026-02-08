import re
import logging
from uuid import UUID
from typing import Optional
from app.config.supabase import get_supabase_admin
from app.exceptions import NotFoundException, ValidationException

logger = logging.getLogger("cgs-mvp.brief")


class BriefService:
    def __init__(self):
        self.db = get_supabase_admin()

    # ── Utility ──

    def generate_slug(self, name: str) -> str:
        """Genera slug URL-safe dal nome."""
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        existing = self.db.table("briefs").select("id").eq("slug", slug).execute().data
        if existing:
            slug = f"{slug}-{len(existing) + 1}"
        return slug

    def compile_brief(self, questions: list, answers: dict) -> str:
        """Compila answers in markdown per injection nei prompt."""
        lines = ["# Brief\n"]
        for q in questions:
            answer = answers.get(q["id"], "")
            if answer:
                lines.append(f"## {q['question']}")
                if isinstance(answer, list):
                    for item in answer:
                        lines.append(f"- {item}")
                else:
                    lines.append(str(answer))
                lines.append("")
        return "\n".join(lines)

    # ── CRUD ──

    def list(self, user_id: UUID, context_id: Optional[UUID] = None, pack_id: Optional[UUID] = None) -> list:
        query = self.db.table("briefs").select("*").eq("user_id", str(user_id))
        if context_id:
            query = query.eq("context_id", str(context_id))
        if pack_id:
            query = query.eq("pack_id", str(pack_id))
        return query.order("created_at", desc=True).execute().data

    def get(self, brief_id: UUID, user_id: UUID) -> dict:
        result = (self.db.table("briefs")
                  .select("*")
                  .eq("id", str(brief_id))
                  .eq("user_id", str(user_id))
                  .single()
                  .execute())
        if not result.data:
            raise NotFoundException("Brief non trovato")
        return result.data

    def get_by_slug(self, slug: str, user_id: UUID) -> dict:
        result = (self.db.table("briefs")
                  .select("*")
                  .eq("slug", slug)
                  .eq("user_id", str(user_id))
                  .single()
                  .execute())
        if not result.data:
            raise NotFoundException("Brief non trovato")
        return result.data

    def create(self, user_id: UUID, data) -> dict:
        """Crea brief: pack lookup + slug gen + compile + insert."""
        pack = (self.db.table("agent_packs")
                .select("brief_questions")
                .eq("id", str(data.pack_id))
                .single()
                .execute())
        if not pack.data:
            raise NotFoundException("Pack non trovato")

        slug = self.generate_slug(data.name)
        questions = pack.data["brief_questions"]
        compiled_brief = self.compile_brief(questions, data.answers) if data.answers else None

        logger.info("Creating brief | user=%s name=%s slug=%s", user_id, data.name, slug)
        return self.db.table("briefs").insert({
            **data.model_dump(mode="json"),
            "user_id": str(user_id),
            "slug": slug,
            "questions": questions,
            "compiled_brief": compiled_brief,
            "status": "active",
        }).execute().data[0]

    def update(self, brief_id: UUID, user_id: UUID, data) -> list:
        """Aggiorna brief, ricompila se le risposte cambiano."""
        update_data = data.model_dump(exclude_none=True)
        if not update_data:
            raise ValidationException("Nessun campo da aggiornare")

        if "answers" in update_data:
            brief = (self.db.table("briefs")
                     .select("questions")
                     .eq("id", str(brief_id))
                     .single()
                     .execute().data)
            if brief:
                update_data["compiled_brief"] = self.compile_brief(brief["questions"], update_data["answers"])

        return (self.db.table("briefs")
                .update(update_data)
                .eq("id", str(brief_id))
                .eq("user_id", str(user_id))
                .execute().data)

    def delete(self, brief_id: UUID, user_id: UUID) -> None:
        self.db.table("briefs").delete().eq("id", str(brief_id)).eq("user_id", str(user_id)).execute()
        logger.info("Deleted brief %s", brief_id)

    def duplicate(self, brief_id: UUID, user_id: UUID) -> dict:
        """Duplica brief con nuovo nome e slug."""
        original = self.get(brief_id, user_id)
        new_name = f"{original['name']} (copia)"
        new_slug = self.generate_slug(new_name)

        logger.info("Duplicating brief %s as '%s'", brief_id, new_name)
        return self.db.table("briefs").insert({
            "context_id": original["context_id"],
            "pack_id": original["pack_id"],
            "user_id": str(user_id),
            "name": new_name,
            "slug": new_slug,
            "description": original.get("description"),
            "questions": original["questions"],
            "answers": original.get("answers", {}),
            "compiled_brief": original.get("compiled_brief"),
            "settings": original.get("settings", {}),
            "status": "draft",
        }).execute().data[0]
