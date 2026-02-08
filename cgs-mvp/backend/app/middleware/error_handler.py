"""Global exception handler middleware for FastAPI."""

import logging
import traceback

from fastapi import Request
from fastapi.responses import JSONResponse
from app.exceptions import AppException

logger = logging.getLogger("cgs-mvp")


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle custom AppException hierarchy."""
    if exc.status_code >= 500:
        logger.error(
            "Server error: %s | path=%s | context=%s",
            exc.detail,
            request.url.path,
            exc.context,
        )
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
        "Unhandled exception on %s %s: %s\n%s",
        request.method,
        request.url.path,
        str(exc),
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error_type": "InternalError",
        },
    )
