import logging
import re
from uuid import UUID
import json
from app.config.supabase import get_supabase_admin
from app.infrastructure.llm.factory import get_llm_adapter
from app.exceptions import NotFoundException, LLMException

logger = logging.getLogger("cgs-mvp.chat")

CHAT_SYSTEM_PROMPT = """You are an expert AI editor. You can do 3 things:

1. EDIT_OUTPUT: Edit the content. Reply with the complete updated content.
2. UPDATE_CONTEXT: If the user tells you something about the brand identity, suggest a Context update.
3. UPDATE_BRIEF: If the user tells you something about how they want the content, suggest a Brief update.

ALWAYS reply with valid JSON:
{
    "message": "your response to the user",
    "action": null | "edit_output" | "update_context" | "update_brief",
    "edited_content": "complete edited content (only if action=edit_output)" | null,
    "context_update": {"field": "value"} | null,
    "brief_update": {"field": "value"} | null
}"""


class ChatService:
    def __init__(self):
        self.db = get_supabase_admin()
        self.llm = get_llm_adapter()

    async def chat(self, output_id: UUID, user_id: UUID, user_message: str) -> dict:
        logger.info("Chat request | output=%s user=%s", output_id, user_id)

        # Load output and context
        output = self.db.table("outputs").select("*").eq("id", str(output_id)).single().execute().data
        if not output:
            raise NotFoundException("Output not found", context={"output_id": str(output_id)})
        run = self.db.table("workflow_runs").select("*").eq("id", output["run_id"]).single().execute().data
        brief = self.db.table("briefs").select("*").eq("id", run["brief_id"]).single().execute().data
        context = self.db.table("contexts").select("*").eq("id", brief["context_id"]).single().execute().data

        # Load history
        history = (self.db.table("chat_messages")
                   .select("*")
                   .eq("output_id", str(output_id))
                   .order("created_at")
                   .execute().data)

        # Save user message
        self.db.table("chat_messages").insert({
            "output_id": str(output_id),
            "user_id": str(user_id),
            "role": "user",
            "content": user_message,
        }).execute()

        # Build messages for LLM
        messages = [
            {"role": "system", "content": CHAT_SYSTEM_PROMPT + f"""

CURRENT CONTENT:
{output.get('text_content', '')}

CONTEXT (brand: {context['brand_name']}):
{json.dumps(context.get('voice_info', {}), indent=2)}

BRIEF (name: {brief['name']}):
{json.dumps(brief.get('answers', {}), indent=2)}"""},
        ]

        for msg in history[-10:]:  # Last 10 messages
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        # Call LLM
        try:
            response = await self.llm.generate(messages, temperature=0.5)
        except Exception as e:
            logger.error("LLM call failed | output=%s error=%s", output_id, str(e))
            raise LLMException("Error generating response")

        # Robust JSON parsing with multiple fallback strategies
        parsed = self._parse_llm_response(response.content)

        action_type = parsed.get("action")
        action_data = {}
        updated_output = None
        context_changes = None
        brief_changes = None

        # Execute action
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
                "status": "adapted",
                "is_new": False,
                "number": output.get("number"),
                "author": output.get("author"),
            }).execute().data[0]
            # Update the status of the original (root) output
            root_id = output.get("parent_output_id") or str(output_id)
            self.db.table("outputs").update({"status": "adapted"}).eq("id", root_id).execute()
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

        # Save assistant message
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

    def _parse_llm_response(self, content: str) -> dict:
        """Parse LLM JSON response with multiple fallback strategies."""
        VALID_ACTIONS = {"edit_output", "update_context", "update_brief", None}

        # Strategy 1: Direct JSON parse
        try:
            parsed = json.loads(content)
            if isinstance(parsed, dict) and "message" in parsed:
                if parsed.get("action") not in VALID_ACTIONS:
                    parsed["action"] = None
                return parsed
        except json.JSONDecodeError:
            pass

        # Strategy 2: Extract JSON from markdown code block
        code_block = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if code_block:
            try:
                parsed = json.loads(code_block.group(1))
                if isinstance(parsed, dict) and "message" in parsed:
                    if parsed.get("action") not in VALID_ACTIONS:
                        parsed["action"] = None
                    return parsed
            except json.JSONDecodeError:
                pass

        # Strategy 3: Find outermost JSON object with balanced braces
        depth = 0
        start_idx = None
        for i, ch in enumerate(content):
            if ch == '{':
                if depth == 0:
                    start_idx = i
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0 and start_idx is not None:
                    try:
                        parsed = json.loads(content[start_idx:i + 1])
                        if isinstance(parsed, dict) and "message" in parsed:
                            if parsed.get("action") not in VALID_ACTIONS:
                                parsed["action"] = None
                            return parsed
                    except json.JSONDecodeError:
                        start_idx = None
                        continue

        # Fallback: treat entire response as plain message
        logger.warning("Could not parse LLM response as JSON, using as plain message")
        return {"message": content, "action": None}

    def get_history(self, output_id: UUID):
        res = (self.db.table("chat_messages")
               .select("*")
               .eq("output_id", str(output_id))
               .order("created_at")
               .execute())
        return res.data
