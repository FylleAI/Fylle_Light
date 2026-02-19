"""Global exception handler middleware for FastAPI."""

import sentry_sdk
import structlog

from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions import AppException

logger = structlog.get_logger("cgs-mvp.errors")


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle custom AppException hierarchy."""
    if exc.status_code >= 500:
        logger.error(
            "Server error",
            error_type=exc.__class__.__name__,
            detail=exc.detail,
            path=request.url.path,
            context=exc.context,
        )
        # Send 5xx errors to Sentry for alerting
        sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_type": exc.__class__.__name__,
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all for unhandled exceptions — never leak stack traces to client."""
    logger.error(
        "Unhandled exception",
        method=request.method,
        path=request.url.path,
        error_type=type(exc).__name__,
        error_message=str(exc),
        exc_info=exc,
    )
    # Sentry captures these automatically via FastAPI integration,
    # but we capture explicitly too for completeness
    sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": "InternalError",
        },
    )
