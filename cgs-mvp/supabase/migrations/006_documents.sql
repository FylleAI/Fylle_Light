-- =============================================================
-- Fylle MVP — Migration 006: Document Upload System
-- =============================================================
-- Simple single-tenant document management for contexts and briefs
-- No multi-tenancy, no organizations - just user_id based ownership
-- =============================================================

-- =============================================================
-- 1. CONTEXT DOCUMENTS TABLE
-- =============================================================
CREATE TABLE public.context_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID NOT NULL REFERENCES public.contexts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- File metadata
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,

    -- Optional: For future RAG implementation
    text_content TEXT,
    embedding VECTOR(1536),

    -- Additional metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 2. BRIEF DOCUMENTS TABLE
-- =============================================================
CREATE TABLE public.brief_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brief_id UUID NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- File metadata
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,

    -- Optional: For future RAG implementation
    text_content TEXT,
    embedding VECTOR(1536),

    -- Additional metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 3. INDEXES
-- =============================================================
CREATE INDEX idx_context_docs_context ON public.context_documents(context_id);
CREATE INDEX idx_context_docs_user ON public.context_documents(user_id);
CREATE INDEX idx_brief_docs_brief ON public.brief_documents(brief_id);
CREATE INDEX idx_brief_docs_user ON public.brief_documents(user_id);

-- Vector search indexes (for future RAG implementation)
CREATE INDEX idx_context_docs_embedding ON public.context_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    WHERE embedding IS NOT NULL;
CREATE INDEX idx_brief_docs_embedding ON public.brief_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    WHERE embedding IS NOT NULL;

-- =============================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.context_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_context_documents" ON public.context_documents
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_brief_documents" ON public.brief_documents
    FOR ALL USING (auth.uid() = user_id);

-- =============================================================
-- 5. UPDATED_AT TRIGGERS
-- =============================================================
CREATE TRIGGER trg_context_docs_updated
    BEFORE UPDATE ON public.context_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_brief_docs_updated
    BEFORE UPDATE ON public.brief_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- 6. STORAGE BUCKET FOR DOCUMENTS
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 7. STORAGE RLS POLICIES
-- =============================================================
-- Policy: Users can upload documents to their own folder
CREATE POLICY "user_upload_documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can view their own documents
CREATE POLICY "user_view_documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Policy: Users can delete their own documents
CREATE POLICY "user_delete_documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================================
-- MIGRATION COMPLETE
-- =============================================================
-- Storage path convention:
-- - Context docs: documents/{user_id}/contexts/{context_id}/{filename}
-- - Brief docs: documents/{user_id}/briefs/{brief_id}/{filename}
--
-- Verification queries:
-- SELECT * FROM context_documents LIMIT 1;
-- SELECT * FROM brief_documents LIMIT 1;
-- SELECT * FROM storage.buckets WHERE id = 'documents';
-- =============================================================
