from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.config.supabase import get_supabase_client
from app.middleware.rate_limit import limiter

router = APIRouter()


class AuthRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
@limiter.limit("10/minute")
async def register(request: Request, req: AuthRequest):
    try:
        result = get_supabase_client().auth.sign_up({"email": req.email, "password": req.password})
        return {"user_id": result.user.id, "email": result.user.email}
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/login")
@limiter.limit("10/minute")
async def login(request: Request, req: AuthRequest):
    try:
        result = get_supabase_client().auth.sign_in_with_password({"email": req.email, "password": req.password})
        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user": {"id": result.user.id, "email": result.user.email},
        }
    except Exception as e:
        raise HTTPException(401, str(e))


@router.post("/refresh")
async def refresh(refresh_token: str):
    try:
        result = get_supabase_client().auth.refresh_session(refresh_token)
        return {"access_token": result.session.access_token, "refresh_token": result.session.refresh_token}
    except Exception as e:
        raise HTTPException(401, str(e))


@router.post("/logout")
async def logout():
    return {"message": "Logged out"}
