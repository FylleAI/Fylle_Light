from uuid import UUID

from fastapi import Header, HTTPException

from app.config.supabase import get_supabase_admin


async def get_current_user(authorization: str | None = Header(None)) -> UUID:
    """Verify JWT token via Supabase Auth (supports HS256 and ES256)."""
    if not authorization:
        raise HTTPException(401, "Missing authorization header")
    token = authorization.replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Missing token")
    try:
        # Use admin client to validate token via Supabase Auth
        db = get_supabase_admin()
        user = db.auth.get_user(token)
        return UUID(user.user.id)
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")


def get_db():
    return get_supabase_admin()
