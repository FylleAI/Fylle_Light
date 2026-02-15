#!/usr/bin/env python3
"""
Migration 010: Add 'rejected' to outputs status check constraint.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env
backend_path = Path(__file__).parent / "backend"
load_dotenv(backend_path / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

from supabase import create_client

db = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# The migration: drop old constraint, add new one with 'rejected'
sql = """
ALTER TABLE public.outputs DROP CONSTRAINT IF EXISTS outputs_status_check;
ALTER TABLE public.outputs ADD CONSTRAINT outputs_status_check
    CHECK (status IN ('pending_review', 'completed', 'adapted', 'rejected'));
"""

print(f"Connecting to: {SUPABASE_URL}")
print("Executing migration 010...")

try:
    result = db.rpc("exec_sql", {"sql": sql}).execute()
    print("Migration executed via exec_sql RPC!")
    print(f"Result: {result.data}")
except Exception as e:
    print(f"exec_sql RPC not available: {e}")
    print()
    print("Please run this SQL manually in the Supabase SQL Editor:")
    print("=" * 60)
    print(sql)
    print("=" * 60)

    # Extract project ref from URL for dashboard link
    project_ref = SUPABASE_URL.replace("https://", "").split(".")[0]
    print(f"\nDashboard: https://supabase.com/dashboard/project/{project_ref}/sql/new")
