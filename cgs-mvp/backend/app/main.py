import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config.settings import get_settings
from app.api.v1 import router as v1_router
from app.exceptions import AppException
from app.middleware.error_handler import app_exception_handler, generic_exception_handler
from app.middleware.rate_limit import limiter

settings = get_settings()

# ── Structured Logging ──
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("cgs-mvp")

# ── App ──
app = FastAPI(title=settings.app_name, debug=settings.debug)

# ── Rate Limiter ──
app.state.limiter = limiter

# ── Exception Handlers ──
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ── Middleware ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──
app.include_router(v1_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return {"status": "ok", "service": settings.app_name}
