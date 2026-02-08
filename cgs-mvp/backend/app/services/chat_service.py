import logging
from uuid import UUID
import json
from app.config.supabase import get_supabase_admin
from app.infrastructure.llm.factory import get_llm_adapter
from app.exceptions import NotFoundException, LLMException

logger = logging.getLogger("cgs-mvp.chat")

CHAT_SYSTEM_PROMPT = """Sei un editor AI esperto. Puoi fare 3 cose:

1. EDIT_OUTPUT: Modifica il contenuto. Rispondi con il contenuto aggiornato completo.
2. UPDATE_CONTEXT: Se l'utente ti dice qualcosa sull'identita del brand, suggerisci aggiornamento al Context.
3. UPDATE_BRIEF: Se l'utente ti dice qualcosa su come vuole il contenuto, suggerisci aggiornamento al Brief.

Rispondi SEMPRE con JSON valido:
{
    "message": "la tua risposta all'utente",
    "action": null | "edit_output" | "update_context" | "update_brief",
    "edited_content": "contenuto modificato completo (solo se action=edit_output)" | null,
    "context_update": {"campo": "valore"} | null,
    "brief_update": {"campo": "valore"} | null
}"""


class ChatService:
    def __init__(self):
        self.db = get_supabase_admin()
        self.llm = get_llm_adapter()

    async def chat(self, output_id: UUID, user_id: UUID, user_message: str) -> dict:
        logger.info("Chat request | output=%s user=%s", output_id, user_id)

        # Carica output e contesto
        output = self.db.table("outputs").select("*").eq("id", str(output_id)).single().execute().data
        if not output:
            raise NotFoundException("Output non trovato", context={"output_id": str(output_id)})
        run = self.db.table("workflow_runs").select("*").eq("id", output["run_id"]).single().execute().data
        brief = self.db.table("briefs").select("*").eq("id", run["brief_id"]).single().execute().data
        context = self.db.table("contexts").select("*").eq("id", brief["context_id"]).single().execute().data

        # Carica history
        history = (self.db.table("chat_messages")
                   .select("*")
                   .eq("output_id", str(output_id))
                   .order("created_at")
                   .execute().data)

        # Salva messaggio utente
        self.db.table("chat_messages").insert({
            "output_id": str(output_id),
            "user_id": str(user_id),
            "role": "user",
            "content": user_message,
        }).execute()

        # Costruisci messages per LLM
        messages = [
            {"role": "system", "content": CHAT_SYSTEM_PROMPT + f"""

CONTENUTO ATTUALE:
{output.get('text_content', '')}

CONTEXT (brand: {context['brand_name']}):
{json.dumps(context.get('voice_info', {}), indent=2)}

BRIEF (name: {brief['name']}):
{json.dumps(brief.get('answers', {}), indent=2)}"""},
        ]

        for msg in history[-10:]:  # Ultimi 10 messaggi
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        # Chiama LLM
        try:
            response = await self.llm.generate(messages, temperature=0.5)
        except Exception as e:
            logger.error("LLM call failed | output=%s error=%s", output_id, str(e))
            raise LLMException("Errore nella generazione della risposta")

        # Parsing sicuro con fallback
        try:
            parsed = json.loads(response.content)
        except json.JSONDecodeError:
            # Prova ad estrarre JSON dal testo
            start = response.content.find("{")
            end = response.content.rfind("}")
            if start != -1 and end != -1:
                try:
                    parsed = json.loads(response.content[start:end + 1])
                except json.JSONDecodeError:
                    parsed = {"message": response.content, "action": None}
            else:
                parsed = {"message": response.content, "action": None}

        action_type = parsed.get("action")
        action_data = {}
        updated_output = None
        context_changes = None
        brief_changes = None

        # Esegui azione
        if action_type:
            logger.info("Chat action: %s | output=%s", action_type, output_id)
        if action_type == "edit_output" and parsed.get("edited_content"):
            new_output = self.db.table("outputs").insert({
                "run_id": output["run_id"],
                "brief_id": output.get("brief_id"),
                "user_id": str(user_id),
                "output_type": output["output_type"],
                "mime_type": output["mime_type"],
                "text_content": parsed["edited_content"],
                "title": output.get("title"),
                "version": output["version"] + 1,
                "parent_output_id": str(output_id),
                "status": "adattato",
                "is_new": False,
                "number": output.get("number"),
                "author": output.get("author"),
            }).execute().data[0]
            # Aggiorna lo status dell'output originale (radice della chain)
            root_id = output.get("parent_output_id") or str(output_id)
            self.db.table("outputs").update({"status": "adattato"}).eq("id", root_id).execute()
            action_data = {"new_output_id": new_output["id"]}
            updated_output = new_output

        elif action_type == "update_context" and parsed.get("context_update"):
            updates = parsed["context_update"]
            for field, value in updates.items():
                if field in ("company_info", "audience_info", "voice_info", "goals_info"):
                    existing = context.get(field, {})
                    if isinstance(existing, dict) and isinstance(value, dict):
                        existing.update(value)
                        self.db.table("contexts").update({field: existing}).eq("id", context["id"]).execute()
            context_changes = updates
            action_data = {"context_id": context["id"], "changes": updates}

        elif action_type == "update_brief" and parsed.get("brief_update"):
            updates = parsed["brief_update"]
            existing_answers = brief.get("answers", {})
            existing_answers.update(updates)
            self.db.table("briefs").update({"answers": existing_answers}).eq("id", brief["id"]).execute()
            brief_changes = updates
            action_data = {"brief_id": brief["id"], "changes": updates}

        # Salva messaggio assistant
        assistant_msg = self.db.table("chat_messages").insert({
            "output_id": str(output_id),
            "user_id": str(user_id),
            "role": "assistant",
            "content": parsed.get("message", response.content),
            "action_type": action_type,
            "action_data": action_data or None,
        }).execute().data[0]

        logger.info("Chat completed | output=%s action=%s", output_id, action_type or "none")

        return {
            "message": assistant_msg,
            "updated_output": updated_output,
            "context_changes": context_changes,
            "brief_changes": brief_changes,
        }

    def get_history(self, output_id: UUID):
        res = (self.db.table("chat_messages")
               .select("*")
               .eq("output_id", str(output_id))
               .order("created_at")
               .execute())
        return res.data
