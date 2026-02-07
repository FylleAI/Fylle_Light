from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from app.config.settings import get_settings
from app.config.supabase import get_supabase_admin
from uuid import UUID


async def get_current_user(authorization: str = Header(...)) -> UUID:
    """Estrae user_id dal JWT Supabase."""
    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(
            token,
            get_settings().supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(401, "Invalid token")


def get_db():
    return get_supabase_admin()
