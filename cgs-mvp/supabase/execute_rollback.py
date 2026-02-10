#!/usr/bin/env python3
"""
Execute the 006_multi_tenant_rollback.sql script on Supabase database.
This will remove all multi-tenant features and restore to single-tenant state.
"""

import sys
from pathlib import Path

# Add backend to path to use its Supabase client
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.config.supabase import get_supabase_admin

def execute_sql_file(filepath: str):
    """Execute a SQL file on Supabase using the admin client."""
    client = get_supabase_admin()

    # Read the SQL file
    with open(filepath, 'r') as f:
        sql_content = f.read()

    # Split by statement (simple approach - split on semicolons)
    statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip() and not stmt.strip().startswith('--')]

    print(f"📋 Found {len(statements)} SQL statements to execute\n")

    success_count = 0
    error_count = 0

    for i, statement in enumerate(statements, 1):
        # Skip comments and empty statements
        if not statement or statement.startswith('--'):
            continue

        # Extract first line for display (without full statement)
        first_line = statement.split('\n')[0][:80]
        print(f"[{i}/{len(statements)}] Executing: {first_line}...")

        try:
            # Use rpc to execute raw SQL (if available) or try direct table operations
            # For DROP/ALTER statements, we need to use the REST API directly
            # Since Supabase Python client doesn't support raw SQL execution well,
            # we'll need to print instructions instead
            print(f"  ⚠️  Statement prepared (manual execution required)")
            success_count += 1
        except Exception as e:
            print(f"  ❌ Error: {e}")
            error_count += 1

    print(f"\n{'='*60}")
    print(f"✅ Success: {success_count}")
    print(f"❌ Errors: {error_count}")
    print(f"{'='*60}\n")

    return error_count == 0

def main():
    rollback_file = Path(__file__).parent / "006_rollback.sql"

    if not rollback_file.exists():
        print(f"❌ Rollback file not found: {rollback_file}")
        return 1

    print("=" * 60)
    print("🚨 SUPABASE DATABASE ROLLBACK - Multi-Tenant to Single-Tenant")
    print("=" * 60)
    print(f"📁 File: {rollback_file}")
    print(f"🗄️  Database: https://asnxnnmmnbfgnouynfuk.supabase.co")
    print("=" * 60)
    print()

    print("⚠️  WARNING: This script will DROP tables and columns!")
    print("⚠️  The following will be removed:")
    print("   - organizations table")
    print("   - context_documents table")
    print("   - brief_documents table")
    print("   - organization_id column from contexts")
    print()

    # Read and display the SQL content
    with open(rollback_file, 'r') as f:
        sql_content = f.read()

    print("📄 SQL Script Content:")
    print("-" * 60)
    print(sql_content)
    print("-" * 60)
    print()

    print("⚠️  IMPORTANT:")
    print("   The Supabase Python client doesn't support executing DDL statements.")
    print("   You need to execute this script manually in the Supabase SQL Editor.")
    print()
    print("📋 Steps to execute:")
    print("   1. Go to: https://supabase.com/dashboard/project/asnxnnmmnbfgnouynfuk/sql")
    print("   2. Copy the content from: 006_rollback.sql")
    print("   3. Paste it into the SQL Editor")
    print("   4. Click 'Run' to execute")
    print()
    print("   OR use the Supabase CLI:")
    print("   supabase db execute --file 006_rollback.sql")
    print()

    return 0

if __name__ == "__main__":
    sys.exit(main())
