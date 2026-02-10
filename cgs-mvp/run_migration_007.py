#!/usr/bin/env python3
"""
Script to execute migration 007_context_packs.sql
Adds context-specific pack support to the database.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
env_path = backend_path / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

# Read migration file
migration_file = Path(__file__).parent / "supabase" / "migrations" / "007_context_packs.sql"
if not migration_file.exists():
    print(f"❌ Migration file not found: {migration_file}")
    sys.exit(1)

migration_sql = migration_file.read_text()

print(f"📄 Reading migration from: {migration_file}")
print(f"🔗 Connecting to: {SUPABASE_URL}")

# Create Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("🚀 Executing migration 007_context_packs.sql...")
print("-" * 60)

try:
    # Execute the migration SQL
    result = supabase.rpc("exec_sql", {"sql": migration_sql}).execute()

    print("✅ Migration executed successfully!")
    print("-" * 60)
    print("\n📊 Verifying migration...")

    # Verify: Check if columns were added
    verify_sql = """
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'agent_packs'
    AND column_name IN ('context_id', 'user_id');
    """

    verify_result = supabase.rpc("exec_sql", {"sql": verify_sql}).execute()
    print(f"✅ Columns added: {verify_result.data}")

    # Verify: Check template packs
    template_packs = supabase.table("agent_packs").select("id, name, context_id, user_id").is_("context_id", "null").execute()
    print(f"\n📦 Template packs (context_id = NULL): {len(template_packs.data)} found")
    for pack in template_packs.data:
        print(f"   - {pack['name']}")

    print("\n✅ Migration 007 completed successfully!")
    print("🎉 Context-specific packs are now enabled!")

except Exception as e:
    print(f"❌ Migration failed: {e}")
    print(f"Error details: {type(e).__name__}")

    # Try alternative method: Execute statements one by one
    print("\n⚙️  Trying alternative execution method...")

    try:
        from app.config.supabase import get_supabase_admin

        db = get_supabase_admin()

        # Split migration into individual statements
        statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]

        for i, statement in enumerate(statements, 1):
            if statement:
                print(f"\n[{i}/{len(statements)}] Executing: {statement[:60]}...")
                # Note: Supabase Python client doesn't support raw SQL execution
                # We need to use the SQL Editor in Supabase Dashboard instead
                print(f"Statement: {statement}")

        print("\n⚠️  Please execute the migration manually in Supabase SQL Editor")
        print(f"📝 Copy the SQL from: {migration_file}")
        print(f"🌐 Go to: {SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new")

    except Exception as alt_error:
        print(f"❌ Alternative method also failed: {alt_error}")
        print("\n📋 Manual execution required:")
        print(f"   1. Open Supabase Dashboard: {SUPABASE_URL}")
        print(f"   2. Go to SQL Editor")
        print(f"   3. Copy and run the SQL from: {migration_file}")
        sys.exit(1)
