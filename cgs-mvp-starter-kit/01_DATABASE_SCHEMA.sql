-- =============================================================
-- CGS MVP - Schema Supabase Completo
-- =============================================================
-- Eseguire in ordine nel SQL Editor di Supabase
-- =============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================
-- 1. PROFILES (estende auth.users di Supabase)
-- =============================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{"theme":"light","language":"it"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crea profilo automaticamente quando un utente si registra
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
-- 2. CONTENT TYPES (tipologie di contenuto generabile)
-- =============================================================
CREATE TABLE public.content_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    output_format TEXT NOT NULL DEFAULT 'text',  -- text, image, audio, video
    mime_types TEXT[] DEFAULT ARRAY['text/plain'],
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed dati iniziali
INSERT INTO public.content_types (slug, name, description, icon, output_format, mime_types, sort_order) VALUES
    ('blog_post',     'Blog Post',      'Articolo per blog aziendale',   '📝', 'text',  ARRAY['text/markdown','text/html'], 1),
    ('newsletter',    'Newsletter',     'Email newsletter periodica',    '📧', 'text',  ARRAY['text/html'],                 2),
    ('linkedin_post', 'LinkedIn Post',  'Post per LinkedIn',             '💼', 'text',  ARRAY['text/plain'],                3),
    ('twitter_thread','Twitter Thread', 'Thread per X/Twitter',          '🐦', 'text',  ARRAY['text/plain'],                4),
    ('instagram',     'Instagram',      'Caption per Instagram',         '📸', 'text',  ARRAY['text/plain'],                5),
    ('podcast_script','Podcast Script', 'Script per episodio podcast',   '🎙', 'text',  ARRAY['text/markdown'],             6),
    ('video_script',  'Video Script',   'Script per video',              '🎬', 'text',  ARRAY['text/markdown'],             7),
    ('image',         'Image',          'Immagine generata AI',          '🖼', 'image', ARRAY['image/png','image/webp'],    8);

-- =============================================================
-- 3. CONTEXTS (Pilastro 1 - Identita del brand)
-- =============================================================
CREATE TABLE public.contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    company_info JSONB DEFAULT '{}'::jsonb,    -- {name, description, products, usp, values}
    audience_info JSONB DEFAULT '{}'::jsonb,   -- {primary_segment, pain_points, demographics}
    voice_info JSONB DEFAULT '{}'::jsonb,      -- {tone, personality, dos, donts}
    goals_info JSONB DEFAULT '{}'::jsonb,      -- {primary_goal, kpis, content_pillars}
    research_data JSONB DEFAULT '{}'::jsonb,   -- Dati grezzi dalla ricerca Perplexity
    status TEXT DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 4. CARDS (8 tipologie per context)
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
    content JSONB NOT NULL,   -- Struttura specifica per tipo (vedi existing_code/types/cards.ts)
    sort_order INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(context_id, card_type)
);

-- =============================================================
-- 5. AGENT PACKS (template di workflow per tipo contenuto)
-- =============================================================
CREATE TABLE public.agent_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type_id UUID REFERENCES public.content_types(id),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    -- Configurazione agenti: [{name, role, goal, tools}]
    agents_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Tools abilitati: ["perplexity_search", "image_generation"]
    tools_config JSONB DEFAULT '[]'::jsonb,
    -- Template prompt per ogni agente: {agent_name: "prompt con {{variabili}}"}
    prompt_templates JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- LLM defaults
    default_llm_provider TEXT DEFAULT 'openai',
    default_llm_model TEXT DEFAULT 'gpt-4o',
    -- Domande per creare il brief: [{id, question, type, options, required}]
    brief_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Design Lab: stato, outcome, route
    status TEXT DEFAULT 'available' CHECK (status IN ('active','available','coming_soon')),
    outcome TEXT,                -- Descrizione dell'output per la UI ("Newsletter pronta ogni settimana")
    route TEXT,                  -- Route frontend (es. "/design-lab/outputs/newsletter")
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 6. BRIEFS (Pilastro 2 - Come vuoi il contenuto)
-- =============================================================
CREATE TABLE public.briefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    context_id UUID NOT NULL REFERENCES public.contexts(id) ON DELETE CASCADE,
    pack_id UUID NOT NULL REFERENCES public.agent_packs(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE,                      -- URL-safe identifier (es. "welcome-b2b")
    questions JSONB NOT NULL,             -- Copia delle domande dal pack
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Risposte utente
    compiled_brief TEXT,                  -- Brief compilato in markdown
    settings JSONB DEFAULT '{}'::jsonb,   -- Impostazioni aggiuntive
    status TEXT DEFAULT 'active' CHECK (status IN ('draft','active','archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 7. WORKFLOW RUNS (esecuzioni)
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
    task_outputs JSONB DEFAULT '{}'::jsonb,  -- {agent_name: output_text}
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
-- 8. OUTPUTS (Multi-formato: testo, immagini, audio, video)
-- =============================================================
CREATE TABLE public.outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    brief_id UUID REFERENCES public.briefs(id),       -- Denormalizzato da workflow_runs per query dirette
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    -- Tipo output
    output_type TEXT NOT NULL CHECK (output_type IN ('text','image','audio','video')),
    mime_type TEXT NOT NULL,
    -- Contenuto testuale (per output tipo text)
    text_content TEXT,
    -- File (per output tipo image/audio/video, salvato in Supabase Storage)
    file_path TEXT,
    file_size_bytes BIGINT,
    -- Preview (thumbnail per immagini/video)
    preview_path TEXT,
    -- Metadata
    title TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Versioning (per editing via chat)
    version INT DEFAULT 1,
    parent_output_id UUID REFERENCES public.outputs(id),
    -- Design Lab: status, notifica, progressivo, autore
    status TEXT DEFAULT 'da_approvare' CHECK (status IN ('da_approvare','completato','adattato')),
    is_new BOOLEAN DEFAULT TRUE,           -- Flag notifica (pallino rosso)
    number INT,                            -- Progressivo nel brief (calcolato dal backend)
    author TEXT,                           -- Nome dell'agente/persona che ha generato
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 9. ARCHIVE (Pilastro 3 - Learning Loop)
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
    -- Review
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
    reviewed_at TIMESTAMPTZ,
    -- Feedback (per rejected)
    feedback TEXT,
    feedback_categories JSONB DEFAULT '[]'::jsonb,  -- ["Tono sbagliato", "Troppo lungo"]
    -- Reference (per approved promosso)
    is_reference BOOLEAN DEFAULT FALSE,
    reference_notes TEXT,
    -- Embedding per semantic search
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 10. CHAT MESSAGES (Design Lab - editing via chat)
-- =============================================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    output_id UUID NOT NULL REFERENCES public.outputs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Azione eseguita dall'agent (se presente)
    action_type TEXT CHECK (action_type IS NULL OR action_type IN (
        'edit_output', 'update_context', 'update_brief'
    )),
    action_data JSONB,  -- {new_output_id, context_id, changes, etc.}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 11. ONBOARDING SESSIONS (stato wizard onboarding/brief)
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
    initial_input JSONB DEFAULT '{}'::jsonb,   -- {brand_name, website, email}
    research_data JSONB DEFAULT '{}'::jsonb,   -- Output ricerca Perplexity
    questions JSONB DEFAULT '[]'::jsonb,       -- Domande generate dall'AI
    answers JSONB DEFAULT '{}'::jsonb,         -- Risposte utente
    error_message TEXT,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- 12. RUN LOGS (logging strutturato per debug)
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
CREATE INDEX idx_runs_brief ON public.workflow_runs(brief_id);
CREATE INDEX idx_runs_user ON public.workflow_runs(user_id);
CREATE INDEX idx_runs_status ON public.workflow_runs(status);
CREATE INDEX idx_outputs_run ON public.outputs(run_id);
CREATE INDEX idx_outputs_user ON public.outputs(user_id);
CREATE INDEX idx_outputs_brief ON public.outputs(brief_id);
CREATE INDEX idx_outputs_status ON public.outputs(status);
CREATE INDEX idx_outputs_new ON public.outputs(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_briefs_slug ON public.briefs(slug) WHERE slug IS NOT NULL;
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
-- UPDATED_AT TRIGGER (automatico su UPDATE)
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_contexts_updated BEFORE UPDATE ON public.contexts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cards_updated BEFORE UPDATE ON public.cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_briefs_updated BEFORE UPDATE ON public.briefs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_archive_updated BEFORE UPDATE ON public.archive FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.onboarding_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY (ogni utente vede solo i propri dati)
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

-- Content types e agent packs sono pubblici (lettura)
CREATE POLICY "public_content_types" ON public.content_types FOR SELECT USING (TRUE);
CREATE POLICY "public_packs" ON public.agent_packs FOR SELECT USING (TRUE);

-- =============================================================
-- STORAGE BUCKETS
-- =============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('outputs', 'outputs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('previews', 'previews', true);

CREATE POLICY "user_upload_outputs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_view_outputs" ON storage.objects
    FOR SELECT USING (bucket_id = 'outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_delete_outputs" ON storage.objects
    FOR DELETE USING (bucket_id = 'outputs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "public_previews" ON storage.objects
    FOR SELECT USING (bucket_id = 'previews');
CREATE POLICY "user_upload_previews" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'previews' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================
-- RPC FUNCTIONS
-- =============================================================

-- Semantic search nell'archivio
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

-- Statistiche archivio per utente
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

-- =============================================================
-- SEED: AGENT PACKS
-- =============================================================
INSERT INTO public.agent_packs (slug, name, description, icon, content_type_id, agents_config, tools_config, brief_questions, prompt_templates, status, outcome, route, sort_order)
VALUES
-- Newsletter Pack (slug allineato con Design Lab mock: "newsletter")
('newsletter', 'Newsletter Pack', 'Crea newsletter engaging', '📧',
 (SELECT id FROM public.content_types WHERE slug = 'newsletter'),
 '[{"name":"curator","role":"Content Curator","goal":"Selezionare contenuti rilevanti","tools":["perplexity_search"]},{"name":"writer","role":"Newsletter Writer","goal":"Scrivere copy accattivante per email","tools":[]}]'::jsonb,
 '["perplexity_search"]'::jsonb,
 '[{"id":"newsletter_type","question":"Che tipo di newsletter?","type":"select","options":["Digest settimanale","Update prodotto","Educational","Promozionale"],"required":true},{"id":"sections","question":"Quali sezioni includere?","type":"multiselect","options":["Intro personale","News del settore","Tips","Risorse","CTA finale"],"required":true},{"id":"frequency","question":"Con che frequenza invii?","type":"select","options":["Giornaliera","Settimanale","Bisettimanale","Mensile"],"required":true}]'::jsonb,
 '{"curator":"Sei un content curator. Trova notizie e trend rilevanti per il pubblico target.","writer":"Sei un email copywriter. Subject line accattivanti, personalizzazione, urgenza senza spam."}'::jsonb,
 'available', 'Newsletter pronta e pubblicata ogni settimana.', '/design-lab/outputs/newsletter', 1
),

-- Blog Pack (slug allineato con Design Lab mock: "blog")
('blog', 'Blog Pack', 'Genera articoli di blog ottimizzati SEO', '📝',
 (SELECT id FROM public.content_types WHERE slug = 'blog_post'),
 '[{"name":"researcher","role":"Research Specialist","goal":"Raccogliere informazioni approfondite sul topic","tools":["perplexity_search"]},{"name":"writer","role":"Content Writer","goal":"Scrivere contenuto engaging e SEO-friendly","tools":[]},{"name":"editor","role":"Editor","goal":"Rifinire e ottimizzare il contenuto","tools":[]}]'::jsonb,
 '["perplexity_search"]'::jsonb,
 '[{"id":"tone","question":"Che tono vuoi per i tuoi blog post?","type":"select","options":["Professionale","Conversazionale","Tecnico","Ispirante"],"required":true},{"id":"length","question":"Quanto lunghi devono essere gli articoli?","type":"select","options":["Breve (500-800 parole)","Medio (800-1500 parole)","Lungo (1500-2500 parole)"],"required":true},{"id":"seo_focus","question":"Keywords principali da includere?","type":"text","placeholder":"keyword1, keyword2","required":false},{"id":"cta","question":"Call-to-action principale?","type":"text","placeholder":"es. Iscriviti alla newsletter","required":false}]'::jsonb,
 '{"researcher":"Sei un research specialist. Cerca informazioni accurate e aggiornate. Cita le fonti.","writer":"Sei un content writer esperto. Scrivi in modo engaging, usa sottotitoli e bullet points. Ottimizza per SEO.","editor":"Sei un editor. Correggi errori, migliora leggibilita, assicurati coerenza tono."}'::jsonb,
 'available', 'Articoli SEO pubblicati con continuità.', '/design-lab/outputs/blog', 2
),

-- Social Pack (coming_soon — slug allineato con Design Lab mock: "social")
('social', 'Social Pack', 'Piano e post multi-canale per social media', '💼',
 (SELECT id FROM public.content_types WHERE slug = 'linkedin_post'),
 '[]'::jsonb, '[]'::jsonb,
 '[]'::jsonb,
 '{}'::jsonb,
 'coming_soon', 'Piano e post multi-canale pubblicati.', NULL, 3
),

-- Podcast Pack (coming_soon — slug allineato con Design Lab mock: "podcast")
('podcast', 'Podcast Pack', 'Episodi audio prodotti e distribuiti', '🎙',
 (SELECT id FROM public.content_types WHERE slug = 'podcast_script'),
 '[]'::jsonb, '[]'::jsonb,
 '[]'::jsonb,
 '{}'::jsonb,
 'coming_soon', 'Episodi audio prodotti e distribuiti.', NULL, 4
);
