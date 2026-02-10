#!/usr/bin/env python3
"""Simple verification script with hardcoded credentials."""

from supabase import create_client

SUPABASE_URL = "https://asnxnnmmnbfgnouynfuk.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzbnhubm1tbmJmZ25vdXluZnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2Njc3OCwiZXhwIjoyMDg2MDQyNzc4fQ.x0Imn3QImMNIJzX4hvKFRMNgEE5g_w82q5E41rLP6Ys"

client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("🔍 VERIFYING DATABASE ROLLBACK")
print("=" * 60)
print()

all_passed = True

# Test 1: Multi-tenant tables should not exist
print("📋 Test 1: Multi-tenant tables removed")
for table in ['organizations', 'context_documents', 'brief_documents']:
    try:
        result = client.table(table).select('*').limit(1).execute()
        print(f"  ❌ FAIL: '{table}' table still exists")
        all_passed = False
    except Exception as e:
        if '404' in str(e) or 'not found' in str(e).lower() or 'does not exist' in str(e).lower():
            print(f"  ✅ PASS: '{table}' table removed")
        else:
            print(f"  ⚠️  '{table}': {e}")

print()

# Test 2: Base tables should exist
print("📋 Test 2: Base tables intact")
try:
    result = client.table('contexts').select('id').limit(1).execute()
    print(f"  ✅ PASS: 'contexts' table exists")

    # Check for organization_id column
    if result.data and len(result.data) > 0:
        if 'organization_id' in result.data[0]:
            print(f"  ❌ FAIL: 'organization_id' still in contexts")
            all_passed = False
        else:
            print(f"  ✅ PASS: 'organization_id' removed from contexts")
except Exception as e:
    print(f"  ❌ FAIL: contexts error: {e}")
    all_passed = False

try:
    result = client.table('content_types').select('*').limit(1).execute()
    print(f"  ✅ PASS: 'content_types' exists ({len(result.data)} records)")
except Exception as e:
    print(f"  ❌ FAIL: content_types error: {e}")
    all_passed = False

try:
    result = client.table('agent_packs').select('*').limit(1).execute()
    print(f"  ✅ PASS: 'agent_packs' exists ({len(result.data)} records)")
except Exception as e:
    print(f"  ❌ FAIL: agent_packs error: {e}")
    all_passed = False

print()
print("=" * 60)
if all_passed:
    print("✅ ROLLBACK VERIFICATION PASSED")
else:
    print("❌ ROLLBACK VERIFICATION FAILED")
print("=" * 60)
