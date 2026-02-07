from uuid import UUID, uuid4
from datetime import datetime
import json
import time
from typing import AsyncGenerator
from app.config.supabase import get_supabase_admin
from app.infrastructure.llm.factory import get_llm_adapter
from app.infrastructure.tools.perplexity import PerplexityTool
from app.infrastructure.tools.image_gen import ImageGenerationTool
from app.infrastructure.storage.supabase_storage import StorageService
from app.infrastructure.logging.tracker import RunTracker
from app.db.repositories.archive_repo import ArchiveRepository
from app.db.repositories.output_repo import OutputRepository


class WorkflowService:
    def __init__(self):
        self.db = get_supabase_admin()

    async def execute(self, run_id: UUID, user_id: UUID) -> AsyncGenerator[dict, None]:
        """Esegue un workflow, yield SSE events per progress."""
        tracker = RunTracker(run_id)
        start_time = time.time()

        try:
            # Carica tutto il contesto
            run = self.db.table("workflow_runs").select("*").eq("id", str(run_id)).single().execute().data
            brief = self.db.table("briefs").select("*").eq("id", run["brief_id"]).single().execute().data
            context = self.db.table("contexts").select("*").eq("id", brief["context_id"]).single().execute().data
            pack = self.db.table("agent_packs").select("*").eq("id", brief["pack_id"]).single().execute().data
            cards = self.db.table("cards").select("*").eq("context_id", brief["context_id"]).execute().data

            # Carica Archive (learning loop)
            archive_repo = ArchiveRepository(self.db)
            references = archive_repo.get_references(UUID(brief["context_id"]))
            guardrails = archive_repo.get_guardrails(UUID(brief["context_id"]))

            # Update status
            tracker.update_run(status="running", started_at=datetime.utcnow().isoformat())
            yield {"type": "status", "data": {"status": "running"}}

            # Prepara execution context
            exec_context = self._build_execution_context(context, brief, cards, run["topic"])
            archive_prompt = self._build_archive_prompt(references, guardrails)

            agents = pack["agents_config"]
            total_agents = len(agents)
            agent_outputs = {}
            total_tokens = 0
            total_cost = 0.0

            # Esegui agenti in sequenza
            for i, agent in enumerate(agents):
                agent_name = agent["name"]
                agent_role = agent["role"]
                agent_tools = agent.get("tools", [])
                progress = int((i / total_agents) * 90)

                yield {"type": "progress", "data": {"progress": progress, "step": agent_name, "agent": agent_role}}
                tracker.update_run(progress=progress, current_step=agent_name)
                tracker.info(f"Avvio agente: {agent_name}", agent_name=agent_name, step_number=i)

                # Esegui tools se necessario
                tool_results = {}
                for tool_name in agent_tools:
                    result = await self._execute_tool(tool_name, run["topic"], exec_context, user_id, run_id)
                    tool_results[tool_name] = result

                # Costruisci prompt
                system_prompt = pack["prompt_templates"].get(agent_name, f"Sei un {agent_role}.")
                system_prompt += f"\n\n{exec_context}\n\n{archive_prompt}"

                if tool_results:
                    system_prompt += f"\n\nRISULTATI RICERCA:\n" + "\n".join(
                        f"- {k}: {v[:2000]}" for k, v in tool_results.items()
                    )

                if agent_outputs:
                    system_prompt += f"\n\nOUTPUT AGENTI PRECEDENTI:\n" + "\n".join(
                        f"- {k}: {v[:2000]}" for k, v in agent_outputs.items()
                    )

                # Chiama LLM
                llm = get_llm_adapter(pack.get("default_llm_provider", "openai"))
                response = await llm.generate(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Topic: {run['topic']}"},
                    ],
                    model=pack.get("default_llm_model"),
                )

                agent_outputs[agent_name] = response.content
                total_tokens += response.tokens_in + response.tokens_out
                total_cost += response.cost_usd

                tracker.info(
                    f"Agente {agent_name} completato",
                    agent_name=agent_name,
                    tokens_used=response.tokens_in + response.tokens_out,
                    cost_usd=float(response.cost_usd),
                )

                yield {"type": "agent_complete", "data": {"agent": agent_name, "tokens": response.tokens_in + response.tokens_out}}

            # Calcola numero progressivo per questo brief
            output_repo = OutputRepository(self.db)
            next_number = output_repo.get_next_number(UUID(brief["id"]))

            # Salva output finale
            final_output = agent_outputs.get(agents[-1]["name"], "")
            last_agent_name = agents[-1].get("name", "AI")
            output_data = {
                "run_id": str(run_id),
                "brief_id": brief["id"],
                "user_id": str(user_id),
                "output_type": "text",
                "mime_type": "text/markdown",
                "text_content": final_output,
                "title": run["topic"],
                "metadata": {"agent_outputs": {k: v[:500] for k, v in agent_outputs.items()}},
                "version": 1,
                "status": "da_approvare",
                "is_new": True,
                "number": next_number,
                "author": last_agent_name,
            }
            output = self.db.table("outputs").insert(output_data).execute().data[0]

            # Crea entry in archive (pending review)
            self.db.table("archive").insert({
                "output_id": output["id"],
                "run_id": str(run_id),
                "context_id": brief["context_id"],
                "brief_id": brief["id"],
                "user_id": str(user_id),
                "topic": run["topic"],
                "content_type": pack["slug"],
                "review_status": "pending",
            }).execute()

            duration = time.time() - start_time
            tracker.update_run(
                status="completed",
                progress=100,
                task_outputs=agent_outputs,
                final_output=final_output[:10000],
                total_tokens=total_tokens,
                total_cost_usd=float(total_cost),
                duration_seconds=round(duration, 3),
                completed_at=datetime.utcnow().isoformat(),
            )

            yield {"type": "completed", "data": {
                "output_id": output["id"],
                "total_tokens": total_tokens,
                "total_cost_usd": round(total_cost, 4),
                "duration_seconds": round(duration, 1),
            }}

        except Exception as e:
            tracker.error(str(e))
            tracker.update_run(status="failed", error_message=str(e))
            yield {"type": "error", "data": {"error": str(e)}}

    def _build_execution_context(self, context, brief, cards, topic) -> str:
        lines = [
            f"## CONTEXT: {context['brand_name']}",
            f"Industry: {context.get('industry', 'N/A')}",
            f"Company: {json.dumps(context.get('company_info', {}), indent=2)}",
            f"Audience: {json.dumps(context.get('audience_info', {}), indent=2)}",
            f"Voice: {json.dumps(context.get('voice_info', {}), indent=2)}",
            f"Goals: {json.dumps(context.get('goals_info', {}), indent=2)}",
            "",
            "## BRIEF",
            f"Name: {brief['name']}",
            f"Answers: {json.dumps(brief.get('answers', {}), indent=2)}",
            f"Compiled: {brief.get('compiled_brief', '')}",
            "",
            f"## TOPIC: {topic}",
        ]
        return "\n".join(lines)

    def _build_archive_prompt(self, references, guardrails) -> str:
        if not references and not guardrails:
            return ""
        lines = []
        if references:
            lines.append("## REFERENCE POSITIVE (usa come guida)")
            for ref in references[:3]:
                lines.append(f"- Topic: {ref['topic']}")
                if ref.get("reference_notes"):
                    lines.append(f"  Note: {ref['reference_notes']}")
                if ref.get("outputs") and ref["outputs"].get("text_content"):
                    lines.append(f"  Esempio: {ref['outputs']['text_content'][:300]}...")
        if guardrails:
            lines.append("\n## GUARDRAIL (evita questi errori)")
            for g in guardrails[:3]:
                lines.append(f"- Topic: {g['topic']}")
                lines.append(f"  Feedback: {g.get('feedback', 'N/A')}")
                if g.get("feedback_categories"):
                    lines.append(f"  Categorie: {', '.join(g['feedback_categories'])}")
        return "\n".join(lines)

    async def _execute_tool(self, tool_name, topic, exec_context, user_id, run_id):
        if tool_name == "perplexity_search":
            tool = PerplexityTool()
            return await tool.search(f"{topic} - ricerca approfondita")
        elif tool_name == "image_generation":
            tool = ImageGenerationTool()
            result = await tool.generate(topic)
            # Salva immagine su storage
            storage = StorageService()
            image_bytes = tool.decode_image(result["b64_data"])
            file_path = await storage.upload_file(
                user_id=user_id,
                file_data=image_bytes,
                file_name=f"{run_id}_image.png",
                content_type="image/png",
            )
            # Crea output immagine
            self.db.table("outputs").insert({
                "run_id": str(run_id),
                "user_id": str(user_id),
                "output_type": "image",
                "mime_type": "image/png",
                "file_path": file_path,
                "file_size_bytes": len(image_bytes),
                "title": result["revised_prompt"],
            }).execute()
            return f"[Immagine generata: {result['revised_prompt']}]"
        return ""
