"""
Observability setup: structured logging (structlog) + error monitoring (Sentry).

Why structlog?
- In production, logs are JSON → easy to query in Railway/CloudWatch/Datadog
- In development, logs are human-readable with colors
- Every log automatically includes correlation_id, timestamp, log level

Why Sentry?
- Catches unhandled exceptions automatically (FastAPI integration)
- Sends alerts in real-time (email/Slack)
- Groups similar errors and tracks frequency
- Free tier: 5K events/month (more than enough for MVP)
"""

import logging

import sentry_sdk
import structlog
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.config.settings import get_settings


def setup_sentry() -> None:
    """Initialize Sentry error monitoring.

    Only activates if SENTRY_DSN is set. In local dev without DSN,
    Sentry does nothing — zero overhead.
    """
    settings = get_settings()

    if not settings.sentry_dsn:
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,  # "development" | "production"
        release=f"{settings.app_name}@0.1.0",
        # Performance monitoring: sample 20% of requests for traces
        traces_sample_rate=settings.sentry_traces_sample_rate,
        # Profile 10% of sampled transactions (CPU profiling)
        profiles_sample_rate=settings.sentry_profiles_sample_rate,
        # Privacy: don't send cookies, headers with auth tokens, etc.
        send_default_pii=False,
        # FastAPI + Starlette integrations for automatic error capture
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(transaction_style="endpoint"),
        ],
    )


def setup_logging() -> None:
    """Configure structlog for the entire application.

    In production (app_env != 'development'):
      → JSON output, machine-readable, perfect for log aggregators
      → Example: {"event": "Request completed", "status": 200, "duration_ms": 45.2}

    In development:
      → Pretty-printed with colors, human-readable
      → Example: 2026-02-19 10:30:00 [info] Request completed status=200 duration_ms=45.2
    """
    settings = get_settings()
    is_dev = settings.app_env == "development"
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Shared processors that run on every log entry
    shared_processors: list[structlog.types.Processor] = [
        # Merge any context vars bound via structlog.contextvars
        structlog.contextvars.merge_contextvars,
        # Add log level as a field (info, error, warning, etc.)
        structlog.processors.add_log_level,
        # Add ISO timestamp
        structlog.processors.TimeStamper(fmt="iso"),
        # Add logger name (e.g., "cgs-mvp.workflow")
        structlog.processors.CallsiteParameterAdder(
            [
                structlog.processors.CallsiteParameter.MODULE,
            ]
        ),
        # Render stack traces nicely
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    # Output format depends on environment
    if is_dev:
        # Human-readable colored output for local development
        renderer = structlog.dev.ConsoleRenderer()
    else:
        # JSON for production — easy to parse by Railway, CloudWatch, etc.
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure stdlib logging to go through structlog
    # This catches logs from third-party libraries (uvicorn, httpx, etc.)
    logging.basicConfig(
        format="%(message)s",
        level=log_level,
        handlers=[logging.StreamHandler()],
        force=True,  # Override any existing basicConfig
    )


def setup_observability() -> None:
    """One-call setup for all observability: logging + Sentry.

    Call this once at application startup (in main.py).
    """
    setup_logging()
    setup_sentry()
