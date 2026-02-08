from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime
from app.domain.enums import (
    ContextStatus, CardType, BriefStatus, RunStatus,
    OutputType, OutputStatus, ReviewStatus, SessionType,
    SessionState, ChatActionType,
)


# ─── Profile ────────────────────────────────────────

class Profile(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: dict = {}
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[dict] = None


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
    # slug viene auto-generato dal name nel service


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
    slug: Optional[str] = None
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
    status: str = "available"
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
    input_data: dict = {}
    status: RunStatus = RunStatus.PENDING
    progress: int = 0
    current_step: Optional[str] = None
    task_outputs: dict = {}
    final_output: Optional[str] = None
    total_tokens: int = 0
    total_cost_usd: float = 0
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


# ─── Output ──────────────────────────────────────────

class Output(BaseModel):
    id: UUID
    run_id: UUID
    brief_id: Optional[UUID] = None
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
    status: OutputStatus = OutputStatus.PENDING_REVIEW
    is_new: bool = True
    number: Optional[int] = None
    author: Optional[str] = None
    created_at: datetime


# ─── Archive ─────────────────────────────────────────

class ReviewRequest(BaseModel):
    status: ReviewStatus
    feedback: Optional[str] = None
    feedback_categories: list[str] = []
    is_reference: bool = False
    reference_notes: Optional[str] = None


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
    reference_notes: Optional[str] = None
    created_at: datetime


class ArchiveSearch(BaseModel):
    query: str
    context_id: UUID


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
