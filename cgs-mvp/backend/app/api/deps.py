from fastapi import Depends, HTTPException, Header
from typing import Optional
from app.config.supabase import get_supabase_admin, get_supabase_client
from uuid import UUID


async def get_current_user(authorization: Optional[str] = Header(None)) -> UUID:
    """Verifica token JWT tramite Supabase Auth (supporta HS256 e ES256)."""
    if not authorization:
        raise HTTPException(401, "Missing authorization header")
    token = authorization.replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Missing token")
    try:
        # Usa il client admin per validare il token via Supabase Auth
        db = get_supabase_admin()
        user = db.auth.get_user(token)
        return UUID(user.user.id)
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")


def get_db():
    return get_supabase_admin()
