-- =============================================================
-- Fylle MVP — Archive Brief Scope
-- =============================================================
-- Migration 005: Add brief_id parameter to semantic search RPC
-- Enables brief-level feedback loop with context fallback.
-- =============================================================

-- Update semantic search to support optional brief_id filtering.
-- Fully backward compatible: existing calls without match_brief_id
-- continue to work identically (defaults to NULL = no brief filter).
CREATE OR REPLACE FUNCTION search_archive_by_embedding(
    query_embedding VECTOR(1536),
    match_context_id UUID,
    match_count INT DEFAULT 5,
    match_brief_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    output_id UUID,
    topic TEXT,
    content_type TEXT,
    review_status TEXT,
    is_reference BOOLEAN,
    feedback TEXT,
    similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        a.id, a.output_id, a.topic, a.content_type,
        a.review_status, a.is_reference, a.feedback,
        1 - (a.embedding <=> query_embedding) AS similarity
    FROM public.archive a
    WHERE a.context_id = match_context_id
      AND (match_brief_id IS NULL OR a.brief_id = match_brief_id)
      AND a.embedding IS NOT NULL
    ORDER BY a.embedding <=> query_embedding
    LIMIT match_count;
$$;
