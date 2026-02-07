-- =============================================================
-- Fylle MVP — RPC Functions
-- =============================================================
-- Migration 004: Funzioni PostgreSQL per operazioni complesse
-- =============================================================

-- =============================================================
-- Semantic search nell'archivio
-- =============================================================
-- Usata per trovare contenuti simili (references e guardrails)
-- durante la generazione di nuovi contenuti.
-- Richiede che le entry archive abbiano un embedding generato.
CREATE OR REPLACE FUNCTION search_archive_by_embedding(
    query_embedding VECTOR(1536),
    match_context_id UUID,
    match_count INT DEFAULT 5
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
      AND a.embedding IS NOT NULL
    ORDER BY a.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- =============================================================
-- Statistiche archivio per utente
-- =============================================================
-- Usata dalla pagina Archive per mostrare contatori aggregati.
CREATE OR REPLACE FUNCTION get_archive_stats(p_user_id UUID)
RETURNS TABLE (
    total BIGINT,
    approved BIGINT,
    rejected BIGINT,
    pending_count BIGINT,
    references_count BIGINT
)
LANGUAGE sql STABLE
AS $$
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE review_status = 'approved'),
        COUNT(*) FILTER (WHERE review_status = 'rejected'),
        COUNT(*) FILTER (WHERE review_status = 'pending'),
        COUNT(*) FILTER (WHERE is_reference = TRUE)
    FROM public.archive
    WHERE user_id = p_user_id;
$$;
