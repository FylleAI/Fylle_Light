import structlog
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

logger = structlog.get_logger("cgs-mvp.workflow")


class WorkflowService:
    def __init__(self):
        self.db = get_supabase_admin()

    async def execute(self, run_id: UUID, user_id: UUID) -> AsyncGenerator[dict, None]:
        """Execute a workflow, yield SSE events for progress."""
        tracker = RunTracker(run_id)
        start_time = time.time()

        try:
            # Load all context
            run = self.db.table("workflow_runs").select("*").eq("id", str(run_id)).single().execute().data
            brief = self.db.table("briefs").select("*").eq("id", run["brief_id"]).single().execute().data
            context = self.db.table("contexts").select("*").eq("id", brief["context_id"]).single().execute().data
            pack = self.db.table("agent_packs").select("*").eq("id", brief["pack_id"]).single().execute().data
            cards = self.db.table("cards").select("*").eq("context_id", brief["context_id"]).execute().data
            context_items = self.db.table("context_items").select("*").eq("context_id", brief["context_id"]).order("level").order("sort_order").execute().data

            # Load Archive (learning loop)
            archive_repo = ArchiveRepository(self.db)
            references = archive_repo.get_references(UUID(brief["context_id"]))
            guardrails = archive_repo.get_guardrails(UUID(brief["context_id"]))

            # Log feedback loop data
            logger.info(
                "Feedback loop loaded",
                context_id=brief["context_id"],
                references_count=len(references),
                guardrails_count=len(guardrails),
            )
            if references:
                for ref in references:
                    logger.info(
                        "Reference loaded",
                        topic=ref.get("topic", "N/A"),
                        is_reference=ref.get("is_reference"),
                        notes=(ref.get("reference_notes") or "none")[:100],
                    )
            if guardrails:
                for g in guardrails:
                    logger.info(
                        "Guardrail loaded",
                        topic=g.get("topic", "N/A"),
                        feedback=(g.get("feedback") or "N/A")[:100],
                        categories=g.get("feedback_categories", []),
                    )

            # Update status
            tracker.update_run(status="running", started_at=datetime.utcnow().isoformat())
            yield {"type": "status", "data": {"status": "running"}}

            # Prepare execution context
            exec_context = self._build_execution_context(context, brief, cards, run["topic"], context_items)
            archive_prompt = self._build_archive_prompt(references, guardrails)

            # Log archive prompt injection
            if archive_prompt:
                logger.info(
                    "Archive prompt built",
                    length_chars=len(archive_prompt),
                    preview=archive_prompt[:200].replace("\n", " | "),
                )
            else:
                logger.info("Archive prompt is empty — no references or guardrails")

            agents = pack["agents_config"]
            total_agents = len(agents)
            agent_outputs = {}
            total_tokens = 0
            total_cost = 0.0

            # Execute agents in sequence
            for i, agent in enumerate(agents):
                agent_name = agent["name"]
                agent_role = agent.get("role", agent_name)
                agent_tools = agent.get("tools", [])
                progress = int((i / total_agents) * 90)

                yield {"type": "progress", "data": {"progress": progress, "step": agent_name, "agent": agent_role}}
                tracker.update_run(progress=progress, current_step=agent_name)
                tracker.info(f"Starting agent: {agent_name}", agent_name=agent_name, step_number=i)

                # Execute tools if necessary
                tool_results = {}
                for tool_name in agent_tools:
                    result = await self._execute_tool(tool_name, run["topic"], exec_context, user_id, run_id)
                    tool_results[tool_name] = result

                # Build prompt with Jinja2 template rendering
                # Get agent prompt (embedded in agents_config)
                agent_prompt_template = agent.get("prompt", "")
                if not agent_prompt_template:
                    # Fallback to old prompt_templates
                    agent_prompt_template = pack["prompt_templates"].get(agent_name, f"You are a {agent_role}.")

                # Build template context
                template_context = {
                    # Brief variables (topic, target_word_count, etc.)
                    **run.get("input_data", {}),
                    "topic": run["topic"],

                    # Context data
                    "context": {
                        "brand_name": context.get("brand_name", ""),
                        "industry": context.get("industry", ""),
                        "audience_info": context.get("audience_info", {}),
                        "voice_info": context.get("voice_info", {}),
                        "company_info": context.get("company_info", {}),
                        "goals_info": context.get("goals_info", {}),
                    },

                    # Agent outputs (for chaining) - index, original name, and normalized name
                    "agent": {
                        # Index-based: agent['0'], agent['1'], etc.
                        **{str(idx): {"output": agent_outputs[agents[idx]["name"]]} for idx in range(i)},
                        # Original name: agent["Context Specialist"], etc.
                        **{agents[idx]["name"]: {"output": agent_outputs[agents[idx]["name"]]} for idx in range(i)},
                        # Normalized name (spaces→underscores): agent.Context_Specialist, etc.
                        **{agents[idx]["name"].replace(" ", "_"): {"output": agent_outputs[agents[idx]["name"]]} for idx in range(i)},
                    }
                }

                # Render Jinja2 template
                from jinja2 import Template, TemplateSyntaxError
                try:
                    template = Template(agent_prompt_template)
                    rendered_prompt = template.render(**template_context)
                except TemplateSyntaxError as e:
                    logger.error("Template syntax error", agent=agent_name, error=str(e))
                    rendered_prompt = agent_prompt_template  # Fallback to raw
                except Exception as e:
                    logger.error("Template rendering error", agent=agent_name, error=str(e))
                    rendered_prompt = agent_prompt_template  # Fallback to raw

                # Build final system prompt
                # Archive prompt (guardrails/references) goes FIRST for maximum weight
                system_prompt = rendered_prompt
                if archive_prompt:
                    system_prompt += f"\n\n{archive_prompt}"
                system_prompt += "\n\nIMPORTANT: All generated content MUST be in English."
                system_prompt += f"\n\n{exec_context}"

                # Log system prompt composition for this agent
                logger.info(
                    "Agent system prompt built",
                    agent=agent_name,
                    total_chars=len(system_prompt),
                    rendered_chars=len(rendered_prompt),
                    exec_context_chars=len(exec_context),
                    archive_chars=len(archive_prompt),
                )

                if tool_results:
                    system_prompt += f"\n\nSEARCH RESULTS:\n" + "\n".join(
                        f"- {k}: {v[:2000]}" for k, v in tool_results.items()
                    )

                if agent_outputs:
                    system_prompt += f"\n\nPREVIOUS AGENT OUTPUTS:\n" + "\n".join(
                        f"- {k}: {v[:2000]}" for k, v in agent_outputs.items()
                    )

                # Build user message with guardrail reminder
                user_message = f"Topic: {run['topic']}"
                if guardrails:
                    guardrail_reminder = "\n\nREMINDER — Before writing, re-read the MANDATORY RULES above. Specifically:\n"
                    for g in guardrails[:5]:
                        feedback = g.get('feedback', '')
                        if feedback:
                            guardrail_reminder += f"• {feedback}\n"
                    guardrail_reminder += "Failure to follow these rules will result in content rejection."
                    user_message += guardrail_reminder

                # Call LLM
                llm = get_llm_adapter(pack.get("default_llm_provider", "openai"))
                response = await llm.generate(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    model=pack.get("default_llm_model"),
                )

                agent_outputs[agent_name] = response.content
                total_tokens += response.tokens_in + response.tokens_out
                total_cost += response.cost_usd

                tracker.info(
                    f"Agent {agent_name} completed",
                    agent_name=agent_name,
                    tokens_used=response.tokens_in + response.tokens_out,
                    cost_usd=float(response.cost_usd),
                )

                yield {"type": "agent_complete", "data": {"agent": agent_name, "tokens": response.tokens_in + response.tokens_out}}

            # Calculate next sequential number for this brief
            output_repo = OutputRepository(self.db)
            next_number = output_repo.get_next_number(UUID(brief["id"]))

            # Save final output
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
                "status": "pending_review",
                "is_new": True,
                "number": next_number,
                "author": last_agent_name,
            }
            output = self.db.table("outputs").insert(output_data).execute().data[0]

            # Create archive entry (pending review)
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

    def _build_execution_context(self, context, brief, cards, topic, context_items=None) -> str:
        lines = [
            f"## CONTEXT: {context['brand_name']}",
            f"Industry: {context.get('industry', 'N/A')}",
            f"Company: {json.dumps(context.get('company_info', {}), indent=2)}",
            f"Audience: {json.dumps(context.get('audience_info', {}), indent=2)}",
            f"Voice: {json.dumps(context.get('voice_info', {}), indent=2)}",
            f"Goals: {json.dumps(context.get('goals_info', {}), indent=2)}",
        ]

        # Inject cards data into context
        if cards:
            lines.append("")
            lines.append("## CONTEXT CARDS")
            card_type_labels = {
                "product": "Product & Services",
                "target": "Target Audience",
                "brand_voice": "Brand Voice",
                "competitor": "Competitors",
                "topic": "Content Topics",
                "campaigns": "Campaigns",
                "performance": "Performance Data",
                "feedback": "Feedback & Learnings",
            }
            for card in sorted(cards, key=lambda c: c.get("sort_order", 0)):
                card_type = card.get("card_type", "unknown")
                label = card_type_labels.get(card_type, card_type.replace("_", " ").title())
                lines.append(f"### {label}: {card.get('title', '')}")
                content = card.get("content", {})
                if isinstance(content, dict):
                    lines.append(json.dumps(content, indent=2))
                else:
                    lines.append(str(content))

        # Inject hierarchical context items (from CSV import)
        if context_items:
            lines.append("")
            lines.append("## FULL CONTEXT DATA")
            # Build tree from flat items
            by_id = {}
            for item in context_items:
                by_id[item["id"]] = {**item, "children": []}
            roots = []
            for item in context_items:
                node = by_id[item["id"]]
                parent_id = item.get("parent_id")
                if parent_id and parent_id in by_id:
                    by_id[parent_id]["children"].append(node)
                else:
                    roots.append(node)

            def render_tree(nodes, depth=0):
                for node in nodes:
                    heading = "#" * min(depth + 3, 6)  # ### → ######
                    lines.append(f"{heading} {node['name']}")
                    if node.get("content"):
                        lines.append(node["content"])
                        lines.append("")
                    render_tree(node["children"], depth + 1)

            render_tree(roots)

        lines.extend([
            "",
            "## BRIEF",
            f"Name: {brief['name']}",
            f"Answers: {json.dumps(brief.get('answers', {}), indent=2)}",
            f"Compiled: {brief.get('compiled_brief', '')}",
            "",
            f"## TOPIC: {topic}",
        ])
        return "\n".join(lines)

    def _build_archive_prompt(self, references, guardrails) -> str:
        if not references and not guardrails:
            return ""
        lines = [
            "=" * 60,
            "⚠️  MANDATORY RULES FROM USER FEEDBACK — YOU MUST FOLLOW THESE",
            "=" * 60,
            "",
            "The following rules come from the user's direct feedback on previous content.",
            "Violating ANY of these rules will result in content rejection.",
            "These rules take HIGHEST PRIORITY over all other instructions.",
            "",
        ]
        if references:
            lines.append("### ✅ POSITIVE REFERENCES (emulate these patterns)")
            for ref in references[:3]:
                lines.append(f"- Topic: \"{ref['topic']}\"")
                if ref.get("reference_notes"):
                    lines.append(f"  → Follow this guidance: {ref['reference_notes']}")
                if ref.get("outputs") and ref["outputs"].get("text_content"):
                    lines.append(f"  → Example to emulate: {ref['outputs']['text_content'][:300]}...")
            lines.append("")
        if guardrails:
            lines.append("### 🚫 CRITICAL GUARDRAILS — NEVER DO THESE")
            lines.append("The user REJECTED content for the following reasons.")
            lines.append("You MUST avoid repeating these mistakes:")
            lines.append("")
            for g in guardrails[:5]:
                lines.append(f"**REJECTED**: \"{g['topic']}\"")
                feedback = g.get('feedback', 'N/A')
                lines.append(f"  → REASON: {feedback}")
                if g.get("feedback_categories"):
                    lines.append(f"  → CATEGORIES: {', '.join(g['feedback_categories'])}")
                # Parse actionable rules from feedback
                lines.append(f"  → YOU MUST: Follow the user's feedback above exactly.")
                lines.append("")
        lines.append("=" * 60)
        lines.append("END OF MANDATORY RULES")
        lines.append("=" * 60)
        return "\n".join(lines)

    async def _execute_tool(self, tool_name, topic, exec_context, user_id, run_id):
        if tool_name == "perplexity_search":
            tool = PerplexityTool()
            return await tool.search(f"{topic} - deep research")
        elif tool_name == "image_generation":
            tool = ImageGenerationTool()
            result = await tool.generate(topic)
            # Save image to storage
            storage = StorageService()
            image_bytes = tool.decode_image(result["b64_data"])
            file_path = await storage.upload_file(
                user_id=user_id,
                file_data=image_bytes,
                file_name=f"{run_id}_image.png",
                content_type="image/png",
            )
            # Create image output
            self.db.table("outputs").insert({
                "run_id": str(run_id),
                "user_id": str(user_id),
                "output_type": "image",
                "mime_type": "image/png",
                "file_path": file_path,
                "file_size_bytes": len(image_bytes),
                "title": result["revised_prompt"],
            }).execute()
            return f"[Generated image: {result['revised_prompt']}]"
        return ""
