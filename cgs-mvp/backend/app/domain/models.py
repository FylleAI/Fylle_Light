from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, validator

from app.domain.enums import (
    BriefStatus,
    CardType,
    ChatActionType,
    ContextStatus,
    OutputStatus,
    OutputType,
    ReviewStatus,
    RunStatus,
)

# ─── Profile ────────────────────────────────────────


class Profile(BaseModel):
    id: UUID
    email: str
    full_name: str | None = None
    avatar_url: str | None = None
    settings: dict = {}
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    avatar_url: str | None = None
    settings: dict | None = None


# ─── Context ────────────────────────────────────────


class ContextCreate(BaseModel):
    name: str
    brand_name: str
    website: str | None = None
    industry: str | None = None
    company_info: dict = {}
    audience_info: dict = {}
    voice_info: dict = {}
    goals_info: dict = {}


class ContextUpdate(BaseModel):
    name: str | None = None
    company_info: dict | None = None
    audience_info: dict | None = None
    voice_info: dict | None = None
    goals_info: dict | None = None
    status: ContextStatus | None = None


class Context(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    brand_name: str
    website: str | None = None
    industry: str | None = None
    company_info: dict = {}
    audience_info: dict = {}
    voice_info: dict = {}
    goals_info: dict = {}
    status: ContextStatus = ContextStatus.ACTIVE
    created_at: datetime
    updated_at: datetime


# ─── Card ────────────────────────────────────────────


class CardUpdate(BaseModel):
    title: str | None = None
    content: dict | None = None
    is_visible: bool | None = None


class Card(BaseModel):
    id: UUID
    context_id: UUID
    card_type: CardType
    title: str
    subtitle: str | None = None
    content: dict
    sort_order: int = 0
    is_visible: bool = True
    created_at: datetime
    updated_at: datetime


# ─── Brief Settings (Pack-as-Template / Brief-as-Characterizer) ──


class AgentOverride(BaseModel):
    """Override for a single agent in the pack, defined in the Brief.

    Allows the brief to customize an agent's behavior without modifying
    the pack template. Keys in BriefSettings.agent_overrides must match
    agent names from pack.agents_config.
    """

    prompt_append: str | None = None
    prompt_replace: str | None = None
    model: str | None = None
    provider: str | None = None
    temperature: float | None = None


class BriefSettings(BaseModel):
    """Structure for the briefs.settings JSONB column.

    agent_overrides: per-agent customization (key = agent name from pack)
    global_instructions: text appended to ALL agents' prompts
    """

    agent_overrides: dict[str, AgentOverride] = {}
    global_instructions: str | None = None


# ─── Brief ───────────────────────────────────────────


class BriefCreate(BaseModel):
    context_id: UUID
    pack_id: UUID
    name: str
    description: str | None = None
    answers: dict = {}
    settings: BriefSettings | None = None
    # slug viene auto-generato dal name nel service


class BriefUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    answers: dict | None = None
    compiled_brief: str | None = None
    settings: BriefSettings | None = None
    status: BriefStatus | None = None


class Brief(BaseModel):
    id: UUID
    context_id: UUID
    pack_id: UUID
    user_id: UUID
    name: str
    slug: str | None = None
    description: str | None = None
    questions: list = []
    answers: dict = {}
    compiled_brief: str | None = None
    settings: BriefSettings = BriefSettings()
    status: BriefStatus = BriefStatus.ACTIVE
    created_at: datetime
    updated_at: datetime


# ─── AgentPack ───────────────────────────────────────


class AgentPack(BaseModel):
    id: UUID
    context_id: UUID | None = None
    user_id: UUID | None = None
    slug: str
    name: str
    description: str | None = None
    icon: str | None = None
    content_type_id: UUID | None = None
    agents_config: list
    tools_config: list = []
    brief_questions: list
    prompt_templates: dict = {}
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o"
    # Design Lab fields
    status: str = "available"
    outcome: str | None = None
    route: str | None = None
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
    current_step: str | None = None
    task_outputs: dict = {}
    final_output: str | None = None
    total_tokens: int = 0
    total_cost_usd: float = 0
    duration_seconds: float | None = None
    error_message: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime


# ─── Output ──────────────────────────────────────────


class Output(BaseModel):
    id: UUID
    run_id: UUID
    brief_id: UUID | None = None
    user_id: UUID
    output_type: OutputType
    mime_type: str
    text_content: str | None = None
    file_path: str | None = None
    file_size_bytes: int | None = None
    preview_path: str | None = None
    title: str | None = None
    metadata: dict = {}
    version: int = 1
    parent_output_id: UUID | None = None
    # Design Lab fields
    status: OutputStatus = OutputStatus.PENDING_REVIEW
    is_new: bool = True
    number: int | None = None
    author: str | None = None
    created_at: datetime


# ─── Archive ─────────────────────────────────────────


class ReviewRequest(BaseModel):
    status: ReviewStatus
    feedback: str | None = None
    feedback_categories: list[str] = []
    is_reference: bool = False
    reference_notes: str | None = None


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
    feedback: str | None = None
    feedback_categories: list = []
    is_reference: bool = False
    reference_notes: str | None = None
    created_at: datetime


class ArchiveSearch(BaseModel):
    query: str
    context_id: UUID
    brief_id: UUID | None = None


# ─── Chat ────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str


class ChatMessage(BaseModel):
    id: UUID
    output_id: UUID
    user_id: UUID
    role: str
    content: str
    action_type: ChatActionType | None = None
    action_data: dict | None = None
    created_at: datetime


class ChatResponse(BaseModel):
    message: ChatMessage
    updated_output: Output | None = None
    context_changes: dict | None = None
    brief_changes: dict | None = None


# ─── Onboarding ──────────────────────────────────────


class OnboardingStart(BaseModel):
    brand_name: str
    website: str | None = None
    email: str
    additional_context: str | None = None


# ─── Context Import/Export ───────────────────────────


class CardImport(BaseModel):
    """Schema for importing a single card"""

    card_type: str
    title: str
    subtitle: str | None = None
    content: dict[str, Any]
    sort_order: int = 0
    is_visible: bool = True

    @validator("card_type")
    def validate_card_type(cls, v):
        valid_types = [
            "product",
            "target",
            "brand_voice",
            "competitor",
            "topic",
            "campaigns",
            "performance",
            "feedback",
        ]
        if v not in valid_types:
            raise ValueError(f"Invalid card_type: {v}. Must be one of {valid_types}")
        return v


# ─── Context Items (hierarchical) ──────────────────


class ContextItemCreate(BaseModel):
    """Crea un singolo nodo nell'albero del contesto."""

    name: str
    content: str | None = None
    parent_id: UUID | None = None
    level: int = 0
    sort_order: int = 0


class ContextItemUpdate(BaseModel):
    """Aggiorna un nodo esistente (nome o contenuto)."""

    name: str | None = None
    content: str | None = None
    sort_order: int | None = None


# ─── Context Import/Export ───────────────────────────


class ContextImport(BaseModel):
    """Schema for importing a complete context via template"""

    version: str = "1.0"
    template_type: str = "context"

    context: dict[str, Any] = Field(..., description="Context metadata including company_info, audience_info, etc.")

    cards: list[CardImport] = Field(..., min_items=1, max_items=8, description="Card data (1-8 cards)")

    @validator("context")
    def validate_context_structure(cls, v):
        required_fields = ["brand_name", "name"]
        for field in required_fields:
            if field not in v:
                raise ValueError(f"Missing required field in context: {field}")
        return v

    @validator("cards")
    def validate_unique_card_types(cls, v):
        card_types = [card.card_type for card in v]
        if len(card_types) != len(set(card_types)):
            raise ValueError("Duplicate card_type found. Each card_type must be unique.")
        return v
