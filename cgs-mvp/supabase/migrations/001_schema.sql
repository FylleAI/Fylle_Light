-- =============================================================
-- Fylle MVP — Complete Supabase Schema
-- =============================================================
-- Migration 001: All tables, indexes, triggers, RLS
-- Run in Supabase SQL Editor or via CLI
-- =============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- =============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{"theme":"light","language":"en"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: automatically create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- 2. CONTENT TYPES (types of generatable content)
-- =============================================================
CREATE TABLE public.content_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    output_format TEXT NOT NULL DEFAULT 'text',
    mime_types TEXT[] DEFAULT ARRAY['text/plain'],
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 3. CONTEXTS (Pillar 1 — Brand Identity)
-- =============================================================
CREATE TABLE public.contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    company_info JSONB DEFAULT '{}'::jsonb,
    audience_info JSONB DEFAULT '{}'::jsonb,
    voice_info JSONB DEFAULT '{}'::jsonb,
    goals_info JSONB DEFAULT '{}'::jsonb,
    research_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 4. CARDS (8 types per context)
-- =============================================================
CREATE TABLE public.cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID NOT NULL REFERENCES public.contexts(id) ON DELETE CASCADE,
    card_type TEXT NOT NULL CHECK (card_type IN (
        'product','target','brand_voice','competitor',
        'topic','campaigns','performance','feedback'
    )),
    title TEXT NOT NULL,
    subtitle TEXT,
    content JSONB NOT NULL,
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(context_id, card_type)
);

-- =============================================================
-- 5. AGENT PACKS (workflow templates per content type)
-- =============================================================
CREATE TABLE public.agent_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type_id UUID REFERENCES public.content_types(id),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    agents_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    tools_config JSONB DEFAULT '[]'::jsonb,
    prompt_templates JSONB NOT NULL DEFAULT '{}'::jsonb,
    default_llm_provider TEXT DEFAULT 'openai',
    default_llm_model TEXT DEFAULT 'gpt-4o',
    brief_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Design Lab fields
    status TEXT DEFAULT 'available' CHECK (status IN ('active','available','coming_soon')),
    outcome TEXT,
    route TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 6. BRIEFS (Pillar 2 — How you want the content)
-- =============================================================
CREATE TABLE public.briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID NOT NULL REFERENCES public.contexts(id) ON DELETE CASCADE,
    pack_id UUID NOT NULL REFERENCES public.agent_packs(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,
    questions JSONB NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    compiled_brief TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 7. WORKFLOW RUNS (executions)
-- =============================================================
CREATE TABLE public.workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brief_id UUID NOT NULL REFERENCES public.briefs(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    topic TEXT NOT NULL,
    input_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled')),
    progress INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    current_step TEXT,
    task_outputs JSONB DEFAULT '{}'::jsonb,
    final_output TEXT,
    total_tokens INT DEFAULT 0,
    total_cost_usd NUMERIC(10,6) DEFAULT 0,
    duration_seconds NUMERIC(10,3),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    error_message TEXT
);

-- =============================================================
-- 8. OUTPUTS (Multi-format: text, images, audio, video)
-- =============================================================
CREATE TABLE public.outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    brief_id UUID REFERENCES public.briefs(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    output_type TEXT NOT NULL CHECK (output_type IN ('text','image','audio','video')),
    mime_type TEXT NOT NULL,
    text_content TEXT,
    file_path TEXT,
    file_size_bytes BIGINT,
    preview_path TEXT,
    title TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    version INT DEFAULT 1,
    parent_output_id UUID REFERENCES public.outputs(id),
    -- Design Lab fields
    status TEXT DEFAULT 'da_approvare' CHECK (status IN ('da_approvare','completato','adattato')),
    is_new BOOLEAN DEFAULT TRUE,
    number INT,
    author TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 9. ARCHIVE (Pillar 3 — Learning Loop)
-- =============================================================
CREATE TABLE public.archive (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    output_id UUID NOT NULL REFERENCES public.outputs(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES public.workflow_runs(id),
    context_id UUID NOT NULL REFERENCES public.contexts(id),
    brief_id UUID NOT NULL REFERENCES public.briefs(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    topic TEXT NOT NULL,
    content_type TEXT NOT NULL,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
    reviewed_at TIMESTAMPTZ,
    feedback TEXT,
    feedback_categories JSONB DEFAULT '[]'::jsonb,
    is_reference BOOLEAN DEFAULT FALSE,
    reference_notes TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 10. CHAT MESSAGES (Design Lab — editing via chat)
-- =============================================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    output_id UUID NOT NULL REFERENCES public.outputs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    action_type TEXT CHECK (action_type IS NULL OR action_type IN (
        'edit_output', 'update_context', 'update_brief'
    )),
    action_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 11. ONBOARDING SESSIONS (onboarding/brief wizard state)
-- =============================================================
CREATE TABLE public.onboarding_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    session_type TEXT NOT NULL CHECK (session_type IN ('context','brief')),
    context_id UUID REFERENCES public.contexts(id),
    pack_id UUID REFERENCES public.agent_packs(id),
    state TEXT NOT NULL CHECK (state IN (
        'started','researching','questions_ready','answering','processing','completed','failed'
    )),
    current_step INT DEFAULT 0,
    initial_input JSONB DEFAULT '{}'::jsonb,
    research_data JSONB DEFAULT '{}'::jsonb,
    questions JSONB DEFAULT '[]'::jsonb,
    answers JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 12. RUN LOGS (structured logging for debug)
-- =============================================================
CREATE TABLE public.run_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'INFO',
    message TEXT NOT NULL,
    agent_name TEXT,
    step_number INT,
    tokens_used INT,
    cost_usd NUMERIC(10,6),
    duration_ms NUMERIC(10,3),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_contexts_user ON public.contexts(user_id);
CREATE INDEX idx_contexts_status ON public.contexts(status);
CREATE INDEX idx_cards_context ON public.cards(context_id);
CREATE INDEX idx_briefs_user ON public.briefs(user_id);
CREATE INDEX idx_briefs_context ON public.briefs(context_id);
CREATE INDEX idx_briefs_pack ON public.briefs(pack_id);
CREATE INDEX idx_briefs_slug ON public.briefs(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_runs_brief ON public.workflow_runs(brief_id);
CREATE INDEX idx_runs_user ON public.workflow_runs(user_id);
CREATE INDEX idx_runs_status ON public.workflow_runs(status);
CREATE INDEX idx_outputs_run ON public.outputs(run_id);
CREATE INDEX idx_outputs_user ON public.outputs(user_id);
CREATE INDEX idx_outputs_brief ON public.outputs(brief_id);
CREATE INDEX idx_outputs_status ON public.outputs(status);
CREATE INDEX idx_outputs_new ON public.outputs(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_archive_context ON public.archive(context_id);
CREATE INDEX idx_archive_brief ON public.archive(brief_id);
CREATE INDEX idx_archive_status ON public.archive(review_status);
CREATE INDEX idx_archive_ref ON public.archive(is_reference) WHERE is_reference = TRUE;
CREATE INDEX idx_chat_output ON public.chat_messages(output_id);
CREATE INDEX idx_sessions_user ON public.onboarding_sessions(user_id);
CREATE INDEX idx_logs_run ON public.run_logs(run_id);

-- Vector similarity search
CREATE INDEX idx_archive_embedding ON public.archive
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contexts_updated BEFORE UPDATE ON public.contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cards_updated BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_briefs_updated BEFORE UPDATE ON public.briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_archive_updated BEFORE UPDATE ON public.archive FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.onboarding_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_contexts" ON public.contexts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_cards" ON public.cards FOR ALL USING (
    EXISTS (SELECT 1 FROM public.contexts WHERE id = cards.context_id AND user_id = auth.uid())
);
CREATE POLICY "own_briefs" ON public.briefs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_runs" ON public.workflow_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_outputs" ON public.outputs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_archive" ON public.archive FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_chat" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_sessions" ON public.onboarding_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_logs" ON public.run_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workflow_runs WHERE id = run_logs.run_id AND user_id = auth.uid())
);

-- Content types and agent packs are public (read-only)
CREATE POLICY "public_content_types" ON public.content_types FOR SELECT USING (TRUE);
CREATE POLICY "public_packs" ON public.agent_packs FOR SELECT USING (TRUE);
