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


class OutputStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    ADAPTED = "adapted"
    REJECTED = "rejected"


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
