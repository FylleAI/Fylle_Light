from supabase import create_client, Client
from functools import lru_cache
from app.config.settings import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Client con anon key — usato per auth (rispetta RLS)."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_anon_key)


@lru_cache()
def get_supabase_admin() -> Client:
    """Client con service_role_key — bypassa RLS (usato dai servizi backend)."""
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)
