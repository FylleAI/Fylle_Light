from fastapi import Depends, HTTPException, Header
from app.config.supabase import get_supabase_admin, get_supabase_client
from uuid import UUID


async def get_current_user(authorization: str = Header(...)) -> UUID:
    """Verifica token JWT tramite Supabase Auth (supporta HS256 e ES256)."""
    token = authorization.replace("Bearer ", "")
    try:
        # Usa il client admin per validare il token via Supabase Auth
        db = get_supabase_admin()
        user = db.auth.get_user(token)
        return UUID(user.user.id)
    except Exception:
        raise HTTPException(401, "Invalid token")


def get_db():
    return get_supabase_admin()
