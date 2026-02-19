import structlog

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config.settings import get_settings
from app.config.logging import setup_observability
from app.api.v1 import router as v1_router
from app.exceptions import AppException
from app.middleware.error_handler import app_exception_handler, generic_exception_handler
from app.middleware.rate_limit import limiter
from app.middleware.correlation import CorrelationIdMiddleware

settings = get_settings()

# ── Observability: structlog + Sentry ──
# This replaces the old logging.basicConfig with:
# - JSON structured logs in production (machine-readable)
# - Pretty colored logs in development (human-readable)
# - Sentry error monitoring (if SENTRY_DSN is set)
setup_observability()

logger = structlog.get_logger("cgs-mvp")

# ── App ──
app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# ── Rate Limiter ──
app.state.limiter = limiter

# ── Exception Handlers ──
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ── Middleware (order matters: last added = first executed) ──
# CORS must be outermost so preflight requests get proper headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Correlation ID middleware runs inside CORS — assigns a unique ID per request
app.add_middleware(CorrelationIdMiddleware)

# ── Routes ──
app.include_router(v1_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name}


# Log startup info
logger.info(
    "Application started",
    app_name=settings.app_name,
    environment=settings.app_env,
    debug=settings.debug,
    sentry_enabled=bool(settings.sentry_dsn),
)
