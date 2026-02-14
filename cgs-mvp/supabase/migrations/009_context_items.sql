-- =============================================================
-- Migration 009: Hierarchical Context Items
-- =============================================================
-- Adds a tree-structured table for rich, multi-level context data
-- imported from CSV files. Works alongside the existing 8-card system.
-- =============================================================

CREATE TABLE public.context_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID NOT NULL REFERENCES public.contexts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.context_items(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 0 AND 10),
    name TEXT NOT NULL,
    content TEXT,              -- leaf content (NULL for branch/category nodes)
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_context_items_context ON public.context_items(context_id);
CREATE INDEX idx_context_items_parent ON public.context_items(parent_id);
CREATE INDEX idx_context_items_level ON public.context_items(context_id, level, sort_order);

-- Updated_at trigger (same pattern as all other tables)
CREATE TRIGGER trg_context_items_updated
    BEFORE UPDATE ON public.context_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (same pattern as cards: check ownership via contexts)
ALTER TABLE public.context_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_context_items" ON public.context_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.contexts WHERE id = context_items.context_id AND user_id = auth.uid())
);
