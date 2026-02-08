import logging
from uuid import UUID, uuid4
from app.config.supabase import get_supabase_admin
from app.infrastructure.tools.perplexity import PerplexityTool
from app.infrastructure.llm.factory import get_llm_adapter
from app.exceptions import LLMException, ExternalServiceException
import json

logger = logging.getLogger("cgs-mvp.onboarding")


class OnboardingService:
    def __init__(self):
        self.db = get_supabase_admin()
        self.perplexity = PerplexityTool()
        self.llm = get_llm_adapter()

    async def start(self, user_id: UUID, data: dict) -> dict:
        """Start onboarding: research + generate questions."""
        logger.info("Onboarding start | user=%s brand=%s", user_id, data.get("brand_name"))
        session_id = uuid4()

        # Create session
        self.db.table("onboarding_sessions").insert({
            "id": str(session_id),
            "user_id": str(user_id),
            "session_type": "context",
            "state": "researching",
            "initial_input": data,
        }).execute()

        # 1. Research with Perplexity
        research_query = f"""Analyze the company "{data['brand_name']}".
        {'Website: ' + data['website'] if data.get('website') else ''}
        Provide: description, industry, products/services, target audience, competitors, tone of voice."""

        try:
            research = await self.perplexity.search(research_query)
        except Exception as e:
            logger.error("Perplexity research failed | session=%s error=%s", session_id, str(e))
            raise ExternalServiceException("Company research error")

        # 2. Generate questions with LLM
        questions_prompt = f"""Based on this research:
{research}

Generate 5-8 clarifying questions to complete the company profile for "{data['brand_name']}".
Each question must have: id, question, type (select/text), options (if select), required (bool).

Reply in JSON: [{{"id":"q1","question":"...","type":"select","options":["A","B","C"],"required":true}}]"""

        response = await self.llm.generate([
            {"role": "system", "content": "You are a business analyst. Generate relevant questions. IMPORTANT: All questions and text MUST be in English. Reply ONLY with valid JSON."},
            {"role": "user", "content": questions_prompt},
        ])

        # Safe parsing with retry
        questions = self._safe_json_parse(response.content)
        if questions is None:
            # Retry with more explicit prompt
            retry_response = await self.llm.generate([
                {"role": "system", "content": "Reply EXCLUSIVELY with a valid JSON array, no additional text."},
                {"role": "user", "content": f"Convert to a valid JSON array:\n{response.content}"},
            ], temperature=0.3)
            questions = self._safe_json_parse(retry_response.content)
            if questions is None:
                questions = []

        # Update session
        self.db.table("onboarding_sessions").update({
            "state": "questions_ready",
            "research_data": {"raw": research},
            "questions": questions,
        }).eq("id", str(session_id)).execute()

        return {
            "session_id": str(session_id),
            "questions": questions,
            "research_summary": research[:500],
        }

    async def process_answers(self, session_id: UUID, user_id: UUID, answers: dict) -> dict:
        """Process answers and create Context + 8 Cards."""
        logger.info("Processing answers | session=%s user=%s", session_id, user_id)
        session = self.db.table("onboarding_sessions").select("*").eq("id", str(session_id)).single().execute()
        session = session.data

        # Update session state
        self.db.table("onboarding_sessions").update({
            "state": "processing",
            "answers": answers,
        }).eq("id", str(session_id)).execute()

        # Generate Context with LLM
        context_prompt = f"""Based on the company research and user answers, generate a complete profile.

RESEARCH: {json.dumps(session['research_data'])}
QUESTIONS AND ANSWERS: {json.dumps(dict(zip([q['question'] for q in session['questions']], [answers.get(q['id']) for q in session['questions']])))}

Generate a JSON with:
- company_info: {{name, description, products, usp, values, industry}}
- audience_info: {{primary_segment, secondary_segments, pain_points, demographics}}
- voice_info: {{tone, personality, dos, donts, style_guidelines}}
- goals_info: {{primary_goal, kpis, content_pillars}}

And for each of the 8 card types, generate the content:
- product: {{valueProposition, features[], differentiators[], useCases[], performanceMetrics[]}}
- target: {{icpName, description, painPoints[], goals[], preferredLanguage, communicationChannels[]}}
- brand_voice: {{toneDescription, styleGuidelines[], dosExamples[], dontsExamples[], termsToUse[], termsToAvoid[]}}
- competitor: {{competitorName, positioning, keyMessages[], strengths[], weaknesses[], differentiationOpportunities[]}}
- topic: {{description, keywords[], angles[], relatedContent[], trends[]}}
- campaigns: {{objective, keyMessages[], tone, assets[], learnings[]}}
- performance: {{period, metrics[], topPerformingContent[], insights[]}}
- feedback: {{source, summary, details, actionItems[], priority}}

Reply with JSON: {{"context": {{...}}, "cards": [{{type, title, content: {{...}}}}]}}"""

        response = await self.llm.generate([
            {"role": "system", "content": "You are an expert business strategist. Generate detailed company profiles. IMPORTANT: All generated content MUST be in English, regardless of the company's language or country. Reply ONLY with valid JSON."},
            {"role": "user", "content": context_prompt},
        ], max_tokens=8000)

        # Safe parsing with retry
        result = self._safe_json_parse(response.content)
        if result is None:
            retry_response = await self.llm.generate([
                {"role": "system", "content": "Reply EXCLUSIVELY with valid JSON, no additional text."},
                {"role": "user", "content": f"Fix and return as valid JSON:\n{response.content[:4000]}"},
            ], temperature=0.3)
            result = self._safe_json_parse(retry_response.content)
            if result is None:
                self.db.table("onboarding_sessions").update({
                    "state": "failed",
                    "error_message": "Failed to parse LLM response as JSON",
                }).eq("id", str(session_id)).execute()
                raise ValueError("Failed to parse context generation response")

        # Create Context
        brand_name = session["initial_input"]["brand_name"]
        context_data = result.get("context", {})
        context = self.db.table("contexts").insert({
            "user_id": str(user_id),
            "name": f"Context - {brand_name}",
            "brand_name": brand_name,
            "website": session["initial_input"].get("website"),
            "industry": context_data.get("company_info", {}).get("industry"),
            "company_info": context_data.get("company_info", {}),
            "audience_info": context_data.get("audience_info", {}),
            "voice_info": context_data.get("voice_info", {}),
            "goals_info": context_data.get("goals_info", {}),
            "research_data": session["research_data"],
            "status": "active",
        }).execute()
        context_id = context.data[0]["id"]

        # Create 8 Cards
        cards = result.get("cards", [])
        for i, card_data in enumerate(cards):
            self.db.table("cards").insert({
                "context_id": context_id,
                "card_type": card_data["type"],
                "title": card_data.get("title", card_data["type"].replace("_", " ").title()),
                "content": card_data["content"],
                "sort_order": i,
            }).execute()

        # Update session
        self.db.table("onboarding_sessions").update({
            "state": "completed",
            "context_id": context_id,
        }).eq("id", str(session_id)).execute()

        logger.info("Onboarding completed | session=%s context=%s cards=%d", session_id, context_id, len(cards))
        return {"context_id": context_id, "cards_count": len(cards)}

    @staticmethod
    def _safe_json_parse(text: str):
        """Safe JSON parsing: try raw text, then extract JSON block."""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        # Try to extract the first valid JSON block
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            end = text.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start:end + 1])
                except json.JSONDecodeError:
                    continue
        return None
