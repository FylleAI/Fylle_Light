import re
from uuid import UUID
from app.config.supabase import get_supabase_admin


class BriefService:
    def __init__(self):
        self.db = get_supabase_admin()

    def generate_slug(self, name: str) -> str:
        """Genera slug URL-safe dal nome."""
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        # Verifica unicità
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
