"""Custom exception hierarchy for the CGS MVP backend."""

from typing import Optional


class AppException(Exception):
    """Base exception for all application errors."""

    status_code: int = 500
    detail: str = "Errore interno del server"

    def __init__(self, detail: Optional[str] = None, *, context: Optional[dict] = None):
        self.detail = detail or self.__class__.detail
        self.context = context or {}
        super().__init__(self.detail)


# ── 4xx Client Errors ──


class NotFoundException(AppException):
    status_code = 404
    detail = "Risorsa non trovata"


class ValidationException(AppException):
    status_code = 422
    detail = "Dati non validi"


class UnauthorizedException(AppException):
    status_code = 401
    detail = "Non autenticato"


class ForbiddenException(AppException):
    status_code = 403
    detail = "Accesso non consentito"


class ConflictException(AppException):
    status_code = 409
    detail = "Conflitto con lo stato attuale della risorsa"


class RateLimitException(AppException):
    status_code = 429
    detail = "Troppe richieste. Riprova più tardi."


# ── 5xx Service Errors ──


class ExternalServiceException(AppException):
    """Error from an external API (LLM, Perplexity, etc.)."""

    status_code = 502
    detail = "Errore nel servizio esterno"


class LLMException(ExternalServiceException):
    detail = "Errore nella generazione LLM"


class StorageException(AppException):
    status_code = 503
    detail = "Errore nel servizio di storage"


class WorkflowException(AppException):
    status_code = 500
    detail = "Errore nell'esecuzione del workflow"
