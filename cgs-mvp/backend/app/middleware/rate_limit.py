"""Rate limiting configuration using slowapi."""

from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request


def _get_user_or_ip(request: Request) -> str:
    """Rate limit key: use authenticated user_id if available, else remote IP."""
    # The user_id is set by the get_current_user dependency — but rate limiting
    # runs before dependency injection. So we fall back to IP for the key func
    # and apply per-endpoint limits via decorators on the routes that need them.
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_or_ip, default_limits=["120/minute"])
