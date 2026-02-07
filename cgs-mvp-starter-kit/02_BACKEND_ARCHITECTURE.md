# Backend Architecture - Codice Completo

Questo documento contiene TUTTO il codice backend necessario.
Copia-incolla e adatta.

---

## 1. Dipendenze

### requirements.txt

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
httpx==0.26.0
supabase==2.3.4
openai==1.12.0
anthropic==0.18.0
google-generativeai==0.4.0
slowapi==0.1.9
```

### .env.example

```env
# === APP ===
APP_NAME=cgs-mvp
APP_ENV=development
DEBUG=true
LOG_LEVEL=INFO

# === API ===
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v1
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# === SUPABASE ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret

# === LLM PROVIDERS ===
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o

# === TOOLS ===
PERPLEXITY_API_KEY=pplx-...

# === STORAGE ===
OUTPUT_BUCKET=outputs
PREVIEW_BUCKET=previews
MAX_UPLOAD_SIZE_MB=50
```

---

## 2. Config

### app/config/settings.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    app_name: str = "cgs-mvp"
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:5173"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"

    # Tools
    perplexity_api_key: str = ""

    # Storage
    output_bucket: str = "outputs"
    preview_bucket: str = "previews"
    max_upload_size_mb: int = 50

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

### app/config/supabase.py

```python
from supabase import create_client, Client
from functools import lru_cache
from app.config.settings import get_settings

@lru_cache()
def get_supabase_client() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_anon_key)

@lru_cache()
def get_supabase_admin() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)
```

---

## 3. Domain

### app/domain/enums.py

```python
from enum import Enum

class ContextStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class CardType(str, Enum):
    PRODUCT = "product"
    TARGET = "target"
    BRAND_VOICE = "brand_voice"
    COMPETITOR = "competitor"
    TOPIC = "topic"
    CAMPAIGNS = "campaigns"
    PERFORMANCE = "performance"
    FEEDBACK = "feedback"

class BriefStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"

class RunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class OutputType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"

class ReviewStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class SessionType(str, Enum):
    CONTEXT = "context"
    BRIEF = "brief"

class SessionState(str, Enum):
    STARTED = "started"
    RESEARCHING = "researching"
    QUESTIONS_READY = "questions_ready"
    ANSWERING = "answering"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ChatActionType(str, Enum):
    EDIT_OUTPUT = "edit_output"
    UPDATE_CONTEXT = "update_context"
    UPDATE_BRIEF = "update_brief"
```

### app/domain/models.py

```python
from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from app.domain.enums import *

# ─── Profile ────────────────────────────────────────

class Profile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: dict = {}
    created_at: datetime
    updated_at: datetime

# ─── Context ────────────────────────────────────────

class ContextCreate(BaseModel):
    name: str
    brand_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_info: dict = {}
    audience_info: dict = {}
    voice_info: dict = {}
    goals_info: dict = {}

class ContextUpdate(BaseModel):
    name: Optional[str] = None
    company_info: Optional[dict] = None
    audience_info: Optional[dict] = None
    voice_info: Optional[dict] = None
    goals_info: Optional[dict] = None
    status: Optional[ContextStatus] = None

class Context(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    brand_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_info: dict = {}
    audience_info: dict = {}
    voice_info: dict = {}
    goals_info: dict = {}
    status: ContextStatus = ContextStatus.ACTIVE
    created_at: datetime
    updated_at: datetime

# ─── Card ────────────────────────────────────────────

class CardUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None
    is_visible: Optional[bool] = None

class Card(BaseModel):
    id: UUID
    context_id: UUID
    card_type: CardType
    title: str
    subtitle: Optional[str] = None
    content: dict
    sort_order: int = 0
    is_visible: bool = True
    created_at: datetime
    updated_at: datetime

# ─── Brief ───────────────────────────────────────────

class BriefCreate(BaseModel):
    context_id: UUID
    pack_id: UUID
    name: str
    description: Optional[str] = None
    answers: dict = {}

class BriefUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    answers: Optional[dict] = None
    compiled_brief: Optional[str] = None
    settings: Optional[dict] = None
    status: Optional[BriefStatus] = None

class Brief(BaseModel):
    id: UUID
    context_id: UUID
    pack_id: UUID
    user_id: UUID
    name: str
    slug: Optional[str] = None  # URL-safe identifier (es. "welcome-b2b")
    description: Optional[str] = None
    questions: list = []
    answers: dict = {}
    compiled_brief: Optional[str] = None
    settings: dict = {}
    status: BriefStatus = BriefStatus.ACTIVE
    created_at: datetime
    updated_at: datetime

# ─── AgentPack ───────────────────────────────────────

class AgentPack(BaseModel):
    id: UUID
    slug: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    content_type_id: Optional[UUID] = None
    agents_config: list
    tools_config: list = []
    brief_questions: list
    prompt_templates: dict = {}
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"
    # Design Lab fields
    status: str = "available"  # active, available, coming_soon
    outcome: Optional[str] = None
    route: Optional[str] = None
    is_active: bool = True

# ─── Run ─────────────────────────────────────────────

class RunCreate(BaseModel):
    brief_id: UUID
    topic: str
    input_data: dict = {}

class Run(BaseModel):
    id: UUID
    brief_id: UUID
    user_id: UUID
    topic: str
    status: RunStatus = RunStatus.PENDING
    progress: int = 0
    current_step: Optional[str] = None
    total_tokens: int = 0
    total_cost_usd: float = 0
    duration_seconds: Optional[float] = None
    created_at: datetime

# ─── Output ──────────────────────────────────────────

class OutputStatus(str, Enum):
    DA_APPROVARE = "da_approvare"
    COMPLETATO = "completato"
    ADATTATO = "adattato"

class Output(BaseModel):
    id: UUID
    run_id: UUID
    brief_id: Optional[UUID] = None  # Denormalizzato da workflow_runs
    user_id: UUID
    output_type: OutputType
    mime_type: str
    text_content: Optional[str] = None
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    preview_path: Optional[str] = None
    title: Optional[str] = None
    metadata: dict = {}
    version: int = 1
    parent_output_id: Optional[UUID] = None
    # Design Lab fields
    status: OutputStatus = OutputStatus.DA_APPROVARE
    is_new: bool = True
    number: Optional[int] = None  # Progressivo nel brief
    author: Optional[str] = None  # Nome agente/persona
    created_at: datetime

# ─── Archive ─────────────────────────────────────────

class ReviewRequest(BaseModel):
    status: ReviewStatus
    feedback: Optional[str] = None
    feedback_categories: list[str] = []
    is_reference: bool = False

class ArchiveItem(BaseModel):
    id: UUID
    output_id: UUID
    run_id: UUID
    context_id: UUID
    brief_id: UUID
    user_id: UUID
    topic: str
    content_type: str
    review_status: ReviewStatus = ReviewStatus.PENDING
    feedback: Optional[str] = None
    feedback_categories: list = []
    is_reference: bool = False
    created_at: datetime

# ─── Chat ────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str

class ChatMessage(BaseModel):
    id: UUID
    output_id: UUID
    user_id: UUID
    role: str
    content: str
    action_type: Optional[ChatActionType] = None
    action_data: Optional[dict] = None
    created_at: datetime

class ChatResponse(BaseModel):
    message: ChatMessage
    updated_output: Optional[Output] = None
    context_changes: Optional[dict] = None
    brief_changes: Optional[dict] = None

# ─── Onboarding ──────────────────────────────────────

class OnboardingStart(BaseModel):
    brand_name: str
    website: Optional[str] = None
    email: str
    additional_context: Optional[str] = None
```

---

## 4. Infrastructure

### app/infrastructure/llm/base.py

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel

class LLMResponse(BaseModel):
    content: str
    model: str
    tokens_in: int
    tokens_out: int
    cost_usd: float

class LLMAdapter(ABC):
    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        pass
```

### app/infrastructure/llm/openai_adapter.py

```python
from openai import AsyncOpenAI
from app.config.settings import get_settings
from .base import LLMAdapter, LLMResponse

PRICING = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
}

class OpenAIAdapter(LLMAdapter):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=get_settings().openai_api_key)

    async def generate(self, messages, model=None, temperature=0.7, max_tokens=4096):
        model = model or "gpt-4o"
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        choice = response.choices[0]
        usage = response.usage
        prices = PRICING.get(model, {"input": 5.0, "output": 15.0})
        cost = (usage.prompt_tokens * prices["input"] + usage.completion_tokens * prices["output"]) / 1_000_000

        return LLMResponse(
            content=choice.message.content,
            model=model,
            tokens_in=usage.prompt_tokens,
            tokens_out=usage.completion_tokens,
            cost_usd=cost,
        )
```

### app/infrastructure/llm/anthropic_adapter.py

```python
from anthropic import AsyncAnthropic
from app.config.settings import get_settings
from .base import LLMAdapter, LLMResponse

PRICING = {
    "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
    "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.0},
}

class AnthropicAdapter(LLMAdapter):
    def __init__(self):
        self.client = AsyncAnthropic(api_key=get_settings().anthropic_api_key)

    async def generate(self, messages, model=None, temperature=0.7, max_tokens=4096):
        model = model or "claude-sonnet-4-20250514"
        system_msg = None
        chat_msgs = []
        for m in messages:
            if m["role"] == "system":
                system_msg = m["content"]
            else:
                chat_msgs.append(m)

        response = await self.client.messages.create(
            model=model,
            system=system_msg or "",
            messages=chat_msgs,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        prices = PRICING.get(model, {"input": 3.0, "output": 15.0})
        cost = (response.usage.input_tokens * prices["input"]
                + response.usage.output_tokens * prices["output"]) / 1_000_000

        return LLMResponse(
            content=response.content[0].text,
            model=model,
            tokens_in=response.usage.input_tokens,
            tokens_out=response.usage.output_tokens,
            cost_usd=cost,
        )
```

### app/infrastructure/llm/gemini_adapter.py

```python
import google.generativeai as genai
from app.config.settings import get_settings
from .base import LLMAdapter, LLMResponse

PRICING = {
    "gemini-1.5-pro": {"input": 1.25, "output": 5.0},
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
}

class GeminiAdapter(LLMAdapter):
    def __init__(self):
        genai.configure(api_key=get_settings().google_api_key)

    async def generate(self, messages, model=None, temperature=0.7, max_tokens=4096):
        model_name = model or "gemini-1.5-pro"
        gm = genai.GenerativeModel(model_name)

        # Converti formato OpenAI → Gemini
        parts = []
        for m in messages:
            parts.append(f"[{m['role'].upper()}]: {m['content']}")
        prompt = "\n\n".join(parts)

        response = gm.generate_content(
            prompt,
            generation_config={"temperature": temperature, "max_output_tokens": max_tokens},
        )
        tokens_in = response.usage_metadata.prompt_token_count or 0
        tokens_out = response.usage_metadata.candidates_token_count or 0
        prices = PRICING.get(model_name, {"input": 1.25, "output": 5.0})
        cost = (tokens_in * prices["input"] + tokens_out * prices["output"]) / 1_000_000

        return LLMResponse(
            content=response.text,
            model=model_name,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost_usd=cost,
        )
```

### app/infrastructure/llm/factory.py

```python
from .base import LLMAdapter
from .openai_adapter import OpenAIAdapter
from .anthropic_adapter import AnthropicAdapter
from .gemini_adapter import GeminiAdapter

_ADAPTERS = {
    "openai": OpenAIAdapter,
    "anthropic": AnthropicAdapter,
    "gemini": GeminiAdapter,
}

def get_llm_adapter(provider: str = "openai") -> LLMAdapter:
    cls = _ADAPTERS.get(provider)
    if not cls:
        raise ValueError(f"Unknown LLM provider: {provider}. Available: {list(_ADAPTERS.keys())}")
    return cls()
```

### app/infrastructure/tools/perplexity.py

```python
import httpx
from app.config.settings import get_settings

class PerplexityTool:
    async def search(self, query: str, max_results: int = 5) -> str:
        settings = get_settings()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.perplexity_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-sonar-large-128k-online",
                    "messages": [{"role": "user", "content": query}],
                    "max_tokens": 2000,
                },
                timeout=30.0,
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]
```

### app/infrastructure/tools/image_gen.py

```python
import base64
from openai import AsyncOpenAI
from app.config.settings import get_settings

class ImageGenerationTool:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=get_settings().openai_api_key)

    async def generate(self, prompt: str, size: str = "1024x1024", style: str = "vivid"):
        response = await self.client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            style=style,
            response_format="b64_json",
            n=1,
        )
        image_data = response.data[0]
        return {
            "b64_data": image_data.b64_json,
            "revised_prompt": image_data.revised_prompt,
        }

    def decode_image(self, b64_data: str) -> bytes:
        return base64.b64decode(b64_data)
```

### app/infrastructure/storage/supabase_storage.py

```python
from app.config.supabase import get_supabase_admin
from app.config.settings import get_settings
from uuid import UUID

class StorageService:
    def __init__(self):
        self.client = get_supabase_admin()
        self.settings = get_settings()

    async def upload_file(
        self,
        user_id: UUID,
        file_data: bytes,
        file_name: str,
        content_type: str,
        bucket: str | None = None,
    ) -> str:
        bucket = bucket or self.settings.output_bucket
        path = f"{user_id}/{file_name}"
        self.client.storage.from_(bucket).upload(
            path, file_data, {"content-type": content_type}
        )
        return path

    def get_signed_url(self, path: str, expires_in: int = 3600, bucket: str | None = None) -> str:
        bucket = bucket or self.settings.output_bucket
        res = self.client.storage.from_(bucket).create_signed_url(path, expires_in)
        return res["signedURL"]

    def get_public_url(self, path: str, bucket: str | None = None) -> str:
        bucket = bucket or self.settings.preview_bucket
        res = self.client.storage.from_(bucket).get_public_url(path)
        return res

    def delete_file(self, path: str, bucket: str | None = None):
        bucket = bucket or self.settings.output_bucket
        self.client.storage.from_(bucket).remove([path])
```

### app/infrastructure/logging/tracker.py

```python
from uuid import UUID
from datetime import datetime
from app.config.supabase import get_supabase_admin

class RunTracker:
    def __init__(self, run_id: UUID):
        self.run_id = run_id
        self.db = get_supabase_admin()

    def log(self, level: str, message: str, **kwargs):
        self.db.table("run_logs").insert({
            "run_id": str(self.run_id),
            "level": level,
            "message": message,
            "agent_name": kwargs.get("agent_name"),
            "step_number": kwargs.get("step_number"),
            "tokens_used": kwargs.get("tokens_used"),
            "cost_usd": kwargs.get("cost_usd"),
            "duration_ms": kwargs.get("duration_ms"),
            "metadata": kwargs.get("metadata", {}),
        }).execute()

    def info(self, msg, **kw): self.log("INFO", msg, **kw)
    def error(self, msg, **kw): self.log("ERROR", msg, **kw)
    def warn(self, msg, **kw): self.log("WARN", msg, **kw)

    def update_run(self, **fields):
        self.db.table("workflow_runs").update(fields).eq("id", str(self.run_id)).execute()
```

---

## 5. Repositories

### app/db/repositories/base.py

```python
from uuid import UUID
from supabase import Client

class BaseRepository:
    def __init__(self, db: Client, table_name: str):
        self.db = db
        self.table = table_name

    def get_by_id(self, id: UUID):
        res = self.db.table(self.table).select("*").eq("id", str(id)).single().execute()
        return res.data

    def list_by_user(self, user_id: UUID, limit: int = 50, offset: int = 0):
        res = (self.db.table(self.table)
               .select("*")
               .eq("user_id", str(user_id))
               .order("created_at", desc=True)
               .range(offset, offset + limit - 1)
               .execute())
        return res.data

    def create(self, data: dict):
        res = self.db.table(self.table).insert(data).execute()
        return res.data[0]

    def update(self, id: UUID, data: dict):
        res = self.db.table(self.table).update(data).eq("id", str(id)).execute()
        return res.data[0] if res.data else None

    def delete(self, id: UUID):
        self.db.table(self.table).delete().eq("id", str(id)).execute()
```

### app/db/repositories/context_repo.py

```python
from .base import BaseRepository
from uuid import UUID

class ContextRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "contexts")

    def get_with_cards(self, id: UUID):
        context = self.get_by_id(id)
        if not context:
            return None
        cards = (self.db.table("cards")
                 .select("*")
                 .eq("context_id", str(id))
                 .order("sort_order")
                 .execute())
        context["cards"] = cards.data
        return context
```

### app/db/repositories/archive_repo.py

```python
from .base import BaseRepository
from uuid import UUID

class ArchiveRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "archive")

    def get_references(self, context_id: UUID, limit: int = 5):
        res = (self.db.table("archive")
               .select("*, outputs(text_content)")
               .eq("context_id", str(context_id))
               .eq("is_reference", True)
               .order("created_at", desc=True)
               .limit(limit)
               .execute())
        return res.data

    def get_guardrails(self, context_id: UUID, limit: int = 5):
        res = (self.db.table("archive")
               .select("*, outputs(text_content)")
               .eq("context_id", str(context_id))
               .eq("review_status", "rejected")
               .order("created_at", desc=True)
               .limit(limit)
               .execute())
        return res.data

    def semantic_search(self, embedding: list, context_id: UUID, limit: int = 5):
        res = self.db.rpc("search_archive_by_embedding", {
            "query_embedding": embedding,
            "match_context_id": str(context_id),
            "match_count": limit,
        }).execute()
        return res.data
```

---

## 6. Services (IL CUORE)

### app/services/onboarding_service.py

```python
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
        """Avvia onboarding: research + genera domande"""
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

        questions = json.loads(response.content)

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
        """Processa risposte e crea Context + 8 Cards"""
        session = self.db.table("onboarding_sessions").select("*").eq("id", str(session_id)).single().execute()
        session = session.data

        # Update session state
        self.db.table("onboarding_sessions").update({"state": "processing", "answers": answers}).eq("id", str(session_id)).execute()

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

        result = json.loads(response.content)

        # Crea Context
        brand_name = session["initial_input"]["brand_name"]
        context_data = result["context"]
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
        for i, card_data in enumerate(result["cards"]):
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

        return {"context_id": context_id, "cards_count": len(result["cards"])}
```

### app/services/workflow_service.py

```python
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

class WorkflowService:
    def __init__(self):
        self.db = get_supabase_admin()

    async def execute(self, run_id: UUID, user_id: UUID) -> AsyncGenerator[dict, None]:
        """Esegue un workflow, yield SSE events per progress"""
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
                    system_prompt += f"\n\nRISULTATI RICERCA:\n" + "\n".join(f"- {k}: {v[:2000]}" for k, v in tool_results.items())

                if agent_outputs:
                    system_prompt += f"\n\nOUTPUT AGENTI PRECEDENTI:\n" + "\n".join(f"- {k}: {v[:2000]}" for k, v in agent_outputs.items())

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
            existing_count = self.db.table("outputs").select("id", count="exact").eq(
                "brief_id", brief["id"]
            ).eq("parent_output_id", None).execute()
            next_number = (existing_count.count or 0) + 1

            # Salva output finale
            final_output = agent_outputs.get(agents[-1]["name"], "")
            last_agent_name = agents[-1].get("name", "AI")
            output_data = {
                "run_id": str(run_id),
                "brief_id": brief["id"],  # Denormalizzato per query dirette
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
```

### app/services/chat_service.py

```python
from uuid import UUID, uuid4
import json
from app.config.supabase import get_supabase_admin
from app.infrastructure.llm.factory import get_llm_adapter

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
        # Carica output e contesto
        output = self.db.table("outputs").select("*").eq("id", str(output_id)).single().execute().data
        run = self.db.table("workflow_runs").select("*").eq("id", output["run_id"]).single().execute().data
        brief = self.db.table("briefs").select("*").eq("id", run["brief_id"]).single().execute().data
        context = self.db.table("contexts").select("*").eq("id", brief["context_id"]).single().execute().data

        # Carica history
        history = self.db.table("chat_messages").select("*").eq("output_id", str(output_id)).order("created_at").execute().data

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
        response = await self.llm.generate(messages, temperature=0.5)

        # Parsa risposta
        try:
            parsed = json.loads(response.content)
        except json.JSONDecodeError:
            parsed = {"message": response.content, "action": None}

        action_type = parsed.get("action")
        action_data = {}
        updated_output = None
        context_changes = None
        brief_changes = None

        # Esegui azione
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

        return {
            "message": assistant_msg,
            "updated_output": updated_output,
            "context_changes": context_changes,
            "brief_changes": brief_changes,
        }

    def get_history(self, output_id: UUID):
        res = self.db.table("chat_messages").select("*").eq("output_id", str(output_id)).order("created_at").execute()
        return res.data
```

---

## 7. API Endpoints

### app/main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import get_settings
from app.api.v1 import router as v1_router

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix=settings.api_prefix)

@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name}
```

### app/api/deps.py

```python
from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from app.config.settings import get_settings
from app.config.supabase import get_supabase_admin
from uuid import UUID

async def get_current_user(authorization: str = Header(...)) -> UUID:
    """Estrae user_id dal JWT Supabase"""
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(
            token,
            get_settings().supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(401, "Invalid token")

def get_db():
    return get_supabase_admin()
```

### app/api/v1/__init__.py

```python
from fastapi import APIRouter
from .auth import router as auth_router
from .users import router as users_router
from .onboarding import router as onboarding_router
from .contexts import router as contexts_router
from .packs import router as packs_router
from .briefs import router as briefs_router
from .execute import router as execute_router
from .outputs import router as outputs_router
from .archive import router as archive_router
from .chat import router as chat_router

router = APIRouter()
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(users_router, prefix="/users", tags=["users"])
router.include_router(onboarding_router, prefix="/onboarding", tags=["onboarding"])
router.include_router(contexts_router, prefix="/contexts", tags=["contexts"])
router.include_router(packs_router, prefix="/packs", tags=["packs"])
router.include_router(briefs_router, prefix="/briefs", tags=["briefs"])
router.include_router(execute_router, prefix="/execute", tags=["execute"])
router.include_router(outputs_router, prefix="/outputs", tags=["outputs"])
router.include_router(archive_router, prefix="/archive", tags=["archive"])
router.include_router(chat_router, prefix="/chat", tags=["chat"])
```

### app/api/v1/auth.py

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config.supabase import get_supabase_client

router = APIRouter()

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(req: AuthRequest):
    try:
        result = get_supabase_client().auth.sign_up({"email": req.email, "password": req.password})
        return {"user_id": result.user.id, "email": result.user.email}
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/login")
async def login(req: AuthRequest):
    try:
        result = get_supabase_client().auth.sign_in_with_password({"email": req.email, "password": req.password})
        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": {"id": result.user.id, "email": result.user.email},
        }
    except Exception as e:
        raise HTTPException(401, str(e))

@router.post("/refresh")
async def refresh(refresh_token: str):
    try:
        result = get_supabase_client().auth.refresh_session(refresh_token)
        return {"access_token": result.session.access_token, "refresh_token": result.session.refresh_token}
    except Exception as e:
        raise HTTPException(401, str(e))

@router.post("/logout")
async def logout():
    return {"message": "Logged out"}
```

### app/api/v1/execute.py

```python
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from uuid import UUID
import json
from app.api.deps import get_current_user, get_db
from app.domain.models import RunCreate
from app.services.workflow_service import WorkflowService

router = APIRouter()

@router.post("")
async def start_execution(data: RunCreate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    # Verifica che il brief appartenga all'utente
    brief = db.table("briefs").select("id").eq("id", str(data.brief_id)).eq("user_id", str(user_id)).single().execute()
    if not brief.data:
        raise HTTPException(404, "Brief not found")

    # Crea run
    run = db.table("workflow_runs").insert({
        "brief_id": str(data.brief_id),
        "user_id": str(user_id),
        "topic": data.topic,
        "input_data": data.input_data,
        "status": "pending",
    }).execute().data[0]

    return {"run_id": run["id"]}

@router.get("/{run_id}")
async def get_run(run_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    run = db.table("workflow_runs").select("*").eq("id", str(run_id)).eq("user_id", str(user_id)).single().execute()
    return run.data

@router.get("/{run_id}/stream")
async def stream_execution(run_id: UUID, user_id: UUID = Depends(get_current_user)):
    async def event_stream():
        service = WorkflowService()
        async for event in service.execute(run_id, user_id):
            yield f"data: {json.dumps(event)}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

### app/api/v1/chat.py

```python
from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user
from app.domain.models import ChatRequest
from app.services.chat_service import ChatService

router = APIRouter()

@router.post("/outputs/{output_id}")
async def chat_with_output(output_id: UUID, req: ChatRequest, user_id: UUID = Depends(get_current_user)):
    service = ChatService()
    result = await service.chat(output_id, user_id, req.message)
    return result

@router.get("/outputs/{output_id}/history")
async def get_chat_history(output_id: UUID, user_id: UUID = Depends(get_current_user)):
    service = ChatService()
    return service.get_history(output_id)
```

### app/api/v1/contexts.py

```python
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.api.deps import get_current_user, get_db
from app.domain.models import ContextCreate, ContextUpdate
from app.db.repositories.context_repo import ContextRepository

router = APIRouter()

@router.get("")
async def list_contexts(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    return repo.list_by_user(user_id)

@router.get("/{context_id}")
async def get_context(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    context = repo.get_with_cards(context_id)
    if not context or context["user_id"] != str(user_id):
        raise HTTPException(404)
    return context

@router.post("")
async def create_context(data: ContextCreate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    return repo.create({**data.model_dump(), "user_id": str(user_id)})

@router.patch("/{context_id}")
async def update_context(context_id: UUID, data: ContextUpdate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    return repo.update(context_id, data.model_dump(exclude_none=True))

@router.delete("/{context_id}")
async def delete_context(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    repo = ContextRepository(db)
    repo.delete(context_id)
    return {"deleted": True}

@router.get("/{context_id}/cards")
async def get_cards(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return db.table("cards").select("*").eq("context_id", str(context_id)).order("sort_order").execute().data

@router.patch("/{context_id}/cards/{card_type}")
async def update_card(context_id: UUID, card_type: str, data: dict, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return db.table("cards").update(data).eq("context_id", str(context_id)).eq("card_type", card_type).execute().data
```

### app/api/v1/briefs.py

```python
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from typing import Optional
from app.api.deps import get_current_user, get_db
from app.domain.models import BriefCreate, BriefUpdate

router = APIRouter()

@router.get("")
async def list_briefs(
    context_id: Optional[UUID] = None,
    pack_id: Optional[UUID] = None,
    user_id: UUID = Depends(get_current_user),
    db=Depends(get_db),
):
    query = db.table("briefs").select("*").eq("user_id", str(user_id))
    if context_id:
        query = query.eq("context_id", str(context_id))
    if pack_id:
        query = query.eq("pack_id", str(pack_id))
    return query.order("created_at", desc=True).execute().data

@router.get("/by-slug/{slug}")
async def get_brief_by_slug(slug: str, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Lookup brief per slug (usato dal frontend Design Lab con route :briefSlug)"""
    brief = db.table("briefs").select("*").eq("slug", slug).eq("user_id", str(user_id)).single().execute()
    return brief.data

@router.get("/{brief_id}")
async def get_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    brief = db.table("briefs").select("*").eq("id", str(brief_id)).eq("user_id", str(user_id)).single().execute()
    return brief.data

@router.post("")
async def create_brief(data: BriefCreate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    # Carica questions dal pack
    pack = db.table("agent_packs").select("brief_questions").eq("id", str(data.pack_id)).single().execute()
    # Genera slug dal nome (URL-safe)
    import re
    slug = re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-')
    return db.table("briefs").insert({
        **data.model_dump(mode="json"),
        "user_id": str(user_id),
        "slug": slug,
        "questions": pack.data["brief_questions"],
    }).execute().data[0]

@router.patch("/{brief_id}")
async def update_brief(brief_id: UUID, data: BriefUpdate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return db.table("briefs").update(data.model_dump(exclude_none=True)).eq("id", str(brief_id)).eq("user_id", str(user_id)).execute().data

@router.delete("/{brief_id}")
async def delete_brief(brief_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    db.table("briefs").delete().eq("id", str(brief_id)).eq("user_id", str(user_id)).execute()
    return {"deleted": True}
```

### app/api/v1/archive.py

```python
from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user, get_db
from app.domain.models import ReviewRequest

router = APIRouter()

@router.get("")
async def list_archive(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return db.table("archive").select("*").eq("user_id", str(user_id)).order("created_at", desc=True).execute().data

@router.get("/stats")
async def archive_stats(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    result = db.rpc("get_archive_stats", {"p_user_id": str(user_id)}).execute()
    return result.data[0] if result.data else {"total": 0}

## NOTA: la review e stata spostata su outputs.py (path unificato: POST /api/v1/outputs/{id}/review)
```

### app/api/v1/users.py

```python
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from app.api.deps import get_current_user, get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[dict] = None

@router.get("/profile")
async def get_profile(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    result = db.table("profiles").select("*").eq("id", str(user_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Profile not found")
    return result.data

@router.patch("/profile")
async def update_profile(data: ProfileUpdate, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    update_data = data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(400, "No fields to update")
    result = db.table("profiles").update(update_data).eq("id", str(user_id)).execute()
    return result.data[0] if result.data else None
```

### app/api/v1/onboarding.py

```python
from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user
from app.domain.models import OnboardingStart
from app.services.onboarding_service import OnboardingService

router = APIRouter()

@router.post("/start")
async def start_onboarding(data: OnboardingStart, user_id: UUID = Depends(get_current_user)):
    service = OnboardingService()
    return await service.start(user_id, data.model_dump())

@router.post("/{session_id}/answers")
async def submit_answers(session_id: UUID, answers: dict, user_id: UUID = Depends(get_current_user)):
    service = OnboardingService()
    return await service.process_answers(session_id, user_id, answers)
```

### app/api/v1/packs.py

```python
from fastapi import APIRouter, Depends
from uuid import UUID
from app.api.deps import get_current_user, get_db

router = APIRouter()

@router.get("")
async def list_packs(user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Lista pack con user_status calcolato dalla presenza di brief dell'utente."""
    packs = db.table("agent_packs").select("*").eq("is_active", True).order("sort_order").execute().data
    # Per ogni pack, conta i brief dell'utente
    briefs = db.table("briefs").select("pack_id").eq("user_id", str(user_id)).execute().data
    user_pack_ids = {b["pack_id"] for b in briefs}

    for pack in packs:
        if pack["id"] in user_pack_ids:
            pack["user_status"] = "active"  # L'utente ha brief per questo pack
        else:
            pack["user_status"] = pack.get("status", "available")
    return packs

@router.get("/{pack_id}")
async def get_pack(pack_id: UUID, db=Depends(get_db)):
    return db.table("agent_packs").select("*").eq("id", str(pack_id)).single().execute().data
```

### app/api/v1/outputs.py

```python
from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from typing import Optional
from datetime import datetime
from app.api.deps import get_current_user, get_db
from app.domain.models import ReviewRequest
from app.infrastructure.storage.supabase_storage import StorageService

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

@router.get("/{output_id}")
async def get_output(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    return db.table("outputs").select("*").eq("id", str(output_id)).eq("user_id", str(user_id)).single().execute().data

@router.patch("/{output_id}")
async def update_output(output_id: UUID, data: dict, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Per marcare contenuto come visto: {"is_new": false}"""
    allowed_fields = {"is_new"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    if not update_data:
        raise HTTPException(400, "No valid fields to update")
    return db.table("outputs").update(update_data).eq("id", str(output_id)).eq("user_id", str(user_id)).execute().data

@router.post("/{output_id}/review")
async def review_output(output_id: UUID, req: ReviewRequest, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Path unificato per review (spostato da archive.py).
    Aggiorna sia archive.review_status sia outputs.status."""
    # Aggiorna archive
    db.table("archive").update({
        "review_status": req.status.value,
        "feedback": req.feedback,
        "feedback_categories": req.feedback_categories,
        "is_reference": req.is_reference,
        "reviewed_at": datetime.utcnow().isoformat(),
    }).eq("output_id", str(output_id)).eq("user_id", str(user_id)).execute()

    # Aggiorna outputs.status → "completato" se approved, invariato se rejected
    if req.status.value == "approved":
        db.table("outputs").update({"status": "completato"}).eq("id", str(output_id)).execute()

    return {"reviewed": True}

@router.get("/{output_id}/download")
async def download_output(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    output = db.table("outputs").select("file_path").eq("id", str(output_id)).eq("user_id", str(user_id)).single().execute()
    if output.data and output.data.get("file_path"):
        storage = StorageService()
        url = storage.get_signed_url(output.data["file_path"])
        return {"download_url": url}
    return {"error": "No file"}

@router.get("/{output_id}/latest")
async def get_latest_version(output_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Risale la chain di versioni e restituisce l'ultima versione dell'output."""
    outputs = db.table("outputs").select("*").eq("user_id", str(user_id)).or_(
        f"id.eq.{output_id},parent_output_id.eq.{output_id}"
    ).order("version", desc=True).limit(1).execute()
    return outputs.data[0] if outputs.data else None
```

---

## 8. Delta per Design Lab (INTEGRATI)

> **NOTA**: I seguenti delta sono stati integrati direttamente nello schema SQL (`01_DATABASE_SCHEMA.sql`),
> nei modelli (`domain/models.py`), e negli endpoint (`outputs.py`, `briefs.py`, `packs.py`).
> Questa sezione resta come documentazione delle aggiunte rispetto al backend core.
>
> Campi integrati:
> - `agent_packs`: `status`, `outcome`, `route` → in CREATE TABLE + seed
> - `outputs`: `status`, `is_new`, `number`, `brief_id`, `author` → in CREATE TABLE
> - `briefs`: `slug` → in CREATE TABLE
> - Review spostata su `POST /api/v1/outputs/{id}/review` (era in `archive.py`)
> - `users.py` aggiunto con `GET/PATCH /api/v1/users/profile`
> - `briefs.py` aggiornato con filtro `?context_id=X` e lookup `GET /briefs/by-slug/:slug`
> - `outputs.py` aggiornato con filtro `?brief_id=X`, `PATCH /{id}` per `is_new`, `GET /{id}/latest`

### Endpoint aggiuntivo: Context Summary (per le 5 aree)

```python
# api/v1/contexts.py - aggiungere

@router.get("/{context_id}/summary")
async def get_context_summary(context_id: UUID, user_id: UUID = Depends(get_current_user), db=Depends(get_db)):
    """Restituisce le 5 aree del contesto per il Design Lab"""
    context = db.table("contexts").select("*").eq("id", str(context_id)).single().execute().data
    cards = db.table("cards").select("card_type, title").eq("context_id", str(context_id)).execute().data
    briefs = db.table("briefs").select("id, name, pack_id").eq("context_id", str(context_id)).execute().data

    return {
        "fonti_informative": {
            "label": "Fonti Informative",
            "data": context.get("company_info", {}),
            "count": len(context.get("company_info", {}).get("key_offerings", [])),
        },
        "fonti_mercato": {
            "label": "Fonti di Mercato",
            "data": context.get("research_data", {}),
            "has_data": bool(context.get("research_data")),
        },
        "brand": {
            "label": "Brand",
            "data": context.get("voice_info", {}),
            "cards": [c for c in cards if c["card_type"] == "brand_voice"],
        },
        "operativo": {
            "label": "Contesto Operativo",
            "cards": [c for c in cards if c["card_type"] in ("product", "target", "campaigns", "topic", "performance", "feedback")],
        },
        "agent_pack": {
            "label": "Agent Pack",
            "briefs": briefs,
            "count": len(briefs),
        },
    }
```

### Nota: Outputs per Brief e Packs user-specific

> I seguenti endpoint sono stati integrati direttamente in `outputs.py` e `packs.py` (sezione 7).
> - `GET /api/v1/outputs?brief_id=X` → filtro per brief con query diretta su `outputs.brief_id`
> - `PATCH /api/v1/outputs/{id}` → per `{is_new: false}`
> - `GET /api/v1/packs` → arricchito con `user_status` calcolato dalla presenza di brief

---

## 9. Avvio

```bash
# Installa dipendenze
cd backend
pip install -r requirements.txt

# Configura env
cp .env.example .env
# Modifica .env con le tue credenziali

# Avvia
uvicorn app.main:app --reload --port 8000
```

L'API sara disponibile su `http://localhost:8000`.
Docs interattive: `http://localhost:8000/docs`
