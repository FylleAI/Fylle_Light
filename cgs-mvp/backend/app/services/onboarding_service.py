from uuid import UUID, uuid4
from app.config.supabase import get_supabase_admin
from app.infrastructure.tools.perplexity import PerplexityTool
from app.infrastructure.llm.factory import get_llm_adapter
import json


class OnboardingService:
    def __init__(self):
        self.db = get_supabase_admin()
        self.perplexity = PerplexityTool()
        self.llm = get_llm_adapter()

    async def start(self, user_id: UUID, data: dict) -> dict:
        """Avvia onboarding: research + genera domande."""
        session_id = uuid4()

        # Crea sessione
        self.db.table("onboarding_sessions").insert({
            "id": str(session_id),
            "user_id": str(user_id),
            "session_type": "context",
            "state": "researching",
            "initial_input": data,
        }).execute()

        # 1. Research con Perplexity
        research_query = f"""Analizza l'azienda "{data['brand_name']}".
        {'Sito web: ' + data['website'] if data.get('website') else ''}
        Fornisci: descrizione, settore, prodotti/servizi, target, competitors, tone of voice."""

        research = await self.perplexity.search(research_query)

        # 2. Genera domande con LLM
        questions_prompt = f"""Basandoti su questa ricerca:
{research}

Genera 5-8 domande clarificatorie per completare il profilo dell'azienda "{data['brand_name']}".
Ogni domanda deve avere: id, question, type (select/text), options (se select), required (bool).

Rispondi in JSON: [{{"id":"q1","question":"...","type":"select","options":["A","B","C"],"required":true}}]"""

        response = await self.llm.generate([
            {"role": "system", "content": "Sei un business analyst. Genera domande pertinenti in italiano. Rispondi SOLO con JSON valido."},
            {"role": "user", "content": questions_prompt},
        ])

        # Parsing sicuro con retry
        questions = self._safe_json_parse(response.content)
        if questions is None:
            # Retry con prompt più esplicito
            retry_response = await self.llm.generate([
                {"role": "system", "content": "Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo aggiuntivo."},
                {"role": "user", "content": f"Converti in JSON array valido:\n{response.content}"},
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
        """Processa risposte e crea Context + 8 Cards."""
        session = self.db.table("onboarding_sessions").select("*").eq("id", str(session_id)).single().execute()
        session = session.data

        # Update session state
        self.db.table("onboarding_sessions").update({
            "state": "processing",
            "answers": answers,
        }).eq("id", str(session_id)).execute()

        # Genera Context con LLM
        context_prompt = f"""Basandoti sulla ricerca aziendale e le risposte dell'utente, genera un profilo completo.

RICERCA: {json.dumps(session['research_data'])}
DOMANDE E RISPOSTE: {json.dumps(dict(zip([q['question'] for q in session['questions']], [answers.get(q['id']) for q in session['questions']])))}

Genera un JSON con:
- company_info: {{name, description, products, usp, values, industry}}
- audience_info: {{primary_segment, secondary_segments, pain_points, demographics}}
- voice_info: {{tone, personality, dos, donts, style_guidelines}}
- goals_info: {{primary_goal, kpis, content_pillars}}

E per ciascuno degli 8 tipi di card, genera il contenuto:
- product: {{valueProposition, features[], differentiators[], useCases[], performanceMetrics[]}}
- target: {{icpName, description, painPoints[], goals[], preferredLanguage, communicationChannels[]}}
- brand_voice: {{toneDescription, styleGuidelines[], dosExamples[], dontsExamples[], termsToUse[], termsToAvoid[]}}
- competitor: {{competitorName, positioning, keyMessages[], strengths[], weaknesses[], differentiationOpportunities[]}}
- topic: {{description, keywords[], angles[], relatedContent[], trends[]}}
- campaigns: {{objective, keyMessages[], tone, assets[], learnings[]}}
- performance: {{period, metrics[], topPerformingContent[], insights[]}}
- feedback: {{source, summary, details, actionItems[], priority}}

Rispondi con JSON: {{"context": {{...}}, "cards": [{{type, title, content: {{...}}}}]}}"""

        response = await self.llm.generate([
            {"role": "system", "content": "Sei un business strategist esperto. Genera profili aziendali dettagliati. Rispondi SOLO con JSON valido."},
            {"role": "user", "content": context_prompt},
        ], max_tokens=8000)

        # Parsing sicuro con retry
        result = self._safe_json_parse(response.content)
        if result is None:
            retry_response = await self.llm.generate([
                {"role": "system", "content": "Rispondi ESCLUSIVAMENTE con JSON valido, senza testo aggiuntivo."},
                {"role": "user", "content": f"Correggi e restituisci come JSON valido:\n{response.content[:4000]}"},
            ], temperature=0.3)
            result = self._safe_json_parse(retry_response.content)
            if result is None:
                self.db.table("onboarding_sessions").update({
                    "state": "failed",
                    "error_message": "Failed to parse LLM response as JSON",
                }).eq("id", str(session_id)).execute()
                raise ValueError("Failed to parse context generation response")

        # Crea Context
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

        # Crea 8 Cards
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

        return {"context_id": context_id, "cards_count": len(cards)}

    @staticmethod
    def _safe_json_parse(text: str):
        """Parsing JSON sicuro: prova testo grezzo, poi estrae blocco JSON."""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        # Prova ad estrarre il primo blocco JSON valido
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            end = text.rfind(end_char)
            if start != -1 and end != -1 and end > start:
                try:
                    return json.loads(text[start:end + 1])
                except json.JSONDecodeError:
                    continue
        return None
