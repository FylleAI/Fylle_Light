#!/usr/bin/env python3
"""
Verify that the 006_multi_tenant rollback was successful.
Checks that multi-tenant tables and columns no longer exist.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.config.supabase import get_supabase_admin

def verify_rollback():
    """Verify that rollback completed successfully."""
    client = get_supabase_admin()

    print("=" * 60)
    print("🔍 VERIFYING DATABASE ROLLBACK")
    print("=" * 60)
    print()

    all_passed = True

    # Test 1: Check that multi-tenant tables don't exist
    print("📋 Test 1: Verify multi-tenant tables are removed")
    try:
        result = client.table('organizations').select('*').limit(1).execute()
        print("  ❌ FAIL: 'organizations' table still exists")
        all_passed = False
    except Exception as e:
        if '404' in str(e) or 'not found' in str(e).lower():
            print("  ✅ PASS: 'organizations' table removed")
        else:
            print(f"  ⚠️  Unexpected error: {e}")

    try:
        result = client.table('context_documents').select('*').limit(1).execute()
        print("  ❌ FAIL: 'context_documents' table still exists")
        all_passed = False
    except Exception as e:
        if '404' in str(e) or 'not found' in str(e).lower():
            print("  ✅ PASS: 'context_documents' table removed")
        else:
            print(f"  ⚠️  Unexpected error: {e}")

    try:
        result = client.table('brief_documents').select('*').limit(1).execute()
        print("  ❌ FAIL: 'brief_documents' table still exists")
        all_passed = False
    except Exception as e:
        if '404' in str(e) or 'not found' in str(e).lower():
            print("  ✅ PASS: 'brief_documents' table removed")
        else:
            print(f"  ⚠️  Unexpected error: {e}")

    print()

    # Test 2: Check that contexts table still exists but without organization_id
    print("📋 Test 2: Verify contexts table is intact")
    try:
        result = client.table('contexts').select('*').limit(1).execute()
        print(f"  ✅ PASS: 'contexts' table exists (found {len(result.data)} records)")

        # Check if organization_id column exists (it shouldn't)
        if result.data and len(result.data) > 0:
            if 'organization_id' in result.data[0]:
                print("  ❌ FAIL: 'organization_id' column still exists in contexts")
                all_passed = False
            else:
                print("  ✅ PASS: 'organization_id' column removed from contexts")
    except Exception as e:
        print(f"  ❌ FAIL: Error accessing contexts table: {e}")
        all_passed = False

    print()

    # Test 3: Check that base tables still exist
    print("📋 Test 3: Verify base tables are intact")

    try:
        result = client.table('content_types').select('*').limit(5).execute()
        print(f"  ✅ PASS: 'content_types' table exists ({len(result.data)} records)")
    except Exception as e:
        print(f"  ❌ FAIL: Error accessing content_types: {e}")
        all_passed = False

    try:
        result = client.table('agent_packs').select('*').limit(5).execute()
        print(f"  ✅ PASS: 'agent_packs' table exists ({len(result.data)} records)")
    except Exception as e:
        print(f"  ❌ FAIL: Error accessing agent_packs: {e}")
        all_passed = False

    try:
        result = client.table('profiles').select('id,email').limit(5).execute()
        print(f"  ✅ PASS: 'profiles' table exists ({len(result.data)} records)")
    except Exception as e:
        print(f"  ❌ FAIL: Error accessing profiles: {e}")
        all_passed = False

    print()
    print("=" * 60)

    if all_passed:
        print("✅ ROLLBACK VERIFICATION PASSED")
        print("   Database is in clean single-tenant state")
    else:
        print("❌ ROLLBACK VERIFICATION FAILED")
        print("   Some multi-tenant artifacts still exist")

    print("=" * 60)

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(verify_rollback())
