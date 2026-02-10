-- =============================================================
-- Fylle MVP — Migration 006: ROLLBACK Script
-- =============================================================
-- Use this to revert the multi-tenant migration if needed
-- =============================================================

-- WARNING: This will delete all organizations and documents!
-- Backup your database before running this script.

-- =============================================================
-- 1. DROP STORAGE POLICIES
-- =============================================================
DROP POLICY IF EXISTS "user_delete_documents" ON storage.objects;
DROP POLICY IF EXISTS "user_view_documents" ON storage.objects;
DROP POLICY IF EXISTS "user_upload_documents" ON storage.objects;

-- =============================================================
-- 2. DROP RLS POLICIES
-- =============================================================
DROP POLICY IF EXISTS "own_brief_documents" ON public.brief_documents;
DROP POLICY IF EXISTS "own_context_documents" ON public.context_documents;
DROP POLICY IF EXISTS "access_org_via_contexts" ON public.organizations;

-- =============================================================
-- 3. DROP TABLES
-- =============================================================
DROP TABLE IF EXISTS public.brief_documents CASCADE;
DROP TABLE IF EXISTS public.context_documents CASCADE;

-- Remove organization_id from contexts (keep contexts table)
ALTER TABLE public.contexts DROP COLUMN IF EXISTS organization_id;

DROP TABLE IF EXISTS public.organizations CASCADE;

-- =============================================================
-- 4. DROP HELPER FUNCTIONS
-- =============================================================
DROP FUNCTION IF EXISTS public.get_organization_context_count(UUID);
DROP FUNCTION IF EXISTS public.get_context_document_count(UUID);

-- =============================================================
-- 5. DELETE STORAGE BUCKET (Optional - keeps uploaded files)
-- =============================================================
-- Uncomment to delete the documents bucket and all files
-- DELETE FROM storage.buckets WHERE id = 'documents';

-- =============================================================
-- ROLLBACK COMPLETE
-- =============================================================
-- Verify rollback:
-- SELECT COUNT(*) FROM public.organizations; -- Should error (table doesn't exist)
-- SELECT organization_id FROM public.contexts LIMIT 1; -- Should error (column doesn't exist)
-- =============================================================
