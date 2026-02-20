"""Custom exception hierarchy for the CGS MVP backend."""


class AppException(Exception):
    """Base exception for all application errors."""

    status_code: int = 500
    detail: str = "Internal server error"

    def __init__(self, detail: str | None = None, *, context: dict | None = None):
        self.detail = detail or self.__class__.detail
        self.context = context or {}
        super().__init__(self.detail)


# ── 4xx Client Errors ──


class NotFoundException(AppException):
    status_code = 404
    detail = "Resource not found"


class ValidationException(AppException):
    status_code = 422
    detail = "Invalid data"


class UnauthorizedException(AppException):
    status_code = 401
    detail = "Not authenticated"


class ForbiddenException(AppException):
    status_code = 403
    detail = "Access denied"


class ConflictException(AppException):
    status_code = 409
    detail = "Conflict with the current state of the resource"


class RateLimitException(AppException):
    status_code = 429
    detail = "Too many requests. Please try again later."


# ── 5xx Service Errors ──


class ExternalServiceException(AppException):
    """Error from an external API (LLM, Perplexity, etc.)."""

    status_code = 502
    detail = "External service error"


class LLMException(ExternalServiceException):
    detail = "LLM generation error"


class StorageException(AppException):
    status_code = 503
    detail = "Storage service error"


class WorkflowException(AppException):
    status_code = 500
    detail = "Workflow execution error"
