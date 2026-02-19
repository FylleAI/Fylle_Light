"""
Correlation ID middleware — threads a unique ID through every request.

Why?
- When a user reports "my generation failed", you can search logs
  by correlation_id and see EVERYTHING that happened for that request:
  the route hit, the DB queries, the LLM call, the error.
- Without this, logs from concurrent requests are interleaved and
  impossible to untangle.

How it works:
1. Incoming request → check for X-Correlation-ID header (from a frontend/client)
2. If not present → generate a new UUID
3. Bind it to structlog context vars → every log in this request includes it
4. Add it to the response header → frontend can reference it in bug reports
"""

import uuid
import time

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


logger = structlog.get_logger("cgs-mvp.http")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns and propagates a correlation ID per request."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Get or generate correlation ID
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())

        # 2. Bind to structlog context — all logs in this request will include it
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            method=request.method,
            path=request.url.path,
        )

        # 3. Track request timing
        start_time = time.perf_counter()

        # 4. Log request start
        logger.info("Request started")

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Request failed with unhandled exception",
                duration_ms=round(duration_ms, 2),
            )
            raise

        # 5. Log request completion
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            "Request completed",
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        # 6. Add correlation ID to response header
        response.headers["X-Correlation-ID"] = correlation_id

        return response
