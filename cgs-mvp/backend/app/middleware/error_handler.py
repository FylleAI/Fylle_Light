"""Global exception handler middleware for FastAPI."""

import sentry_sdk
import structlog

from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions import AppException
from app.config.settings import get_settings

logger = structlog.get_logger("cgs-mvp.errors")


def _cors_headers(request: Request) -> dict[str, str]:
    """Build CORS headers for error responses.

    When an exception bypasses the CORSMiddleware pipeline (e.g. unhandled
    server errors), the browser blocks the response because it lacks
    Access-Control-Allow-Origin.  Adding CORS headers here ensures the
    frontend can always read error details instead of seeing "Failed to fetch".
    """
    origin = request.headers.get("origin", "")
    settings = get_settings()
    # Only allow configured origins — mirror CORSMiddleware behaviour
    if origin in settings.cors_origins_list:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


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
        headers=_cors_headers(request),
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
        headers=_cors_headers(request),
    )
