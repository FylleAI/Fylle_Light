-- =============================================================
-- Fylle MVP — Seed Data
-- =============================================================
-- Migration 002: Content Types + Agent Packs
-- Separato dallo schema per poter evolvere indipendentemente
-- =============================================================

-- =============================================================
-- CONTENT TYPES
-- =============================================================
INSERT INTO public.content_types (slug, name, description, icon, output_format, mime_types, sort_order) VALUES
    ('blog_post',     'Blog Post',      'Articolo per blog aziendale',   '📝', 'text',  ARRAY['text/markdown','text/html'], 1),
    ('newsletter',    'Newsletter',     'Email newsletter periodica',    '📧', 'text',  ARRAY['text/html'],                 2),
    ('linkedin_post', 'LinkedIn Post',  'Post per LinkedIn',             '💼', 'text',  ARRAY['text/plain'],                3),
    ('twitter_thread','Twitter Thread', 'Thread per X/Twitter',          '🐦', 'text',  ARRAY['text/plain'],                4),
    ('instagram',     'Instagram',      'Caption per Instagram',         '📸', 'text',  ARRAY['text/plain'],                5),
    ('podcast_script','Podcast Script', 'Script per episodio podcast',   '🎙', 'text',  ARRAY['text/markdown'],             6),
    ('video_script',  'Video Script',   'Script per video',              '🎬', 'text',  ARRAY['text/markdown'],             7),
    ('image',         'Image',          'Immagine generata AI',          '🖼', 'image', ARRAY['image/png','image/webp'],    8),
    ('social',        'Social Post',    'Post multi-canale social',      '📱', 'text',  ARRAY['text/plain'],                9);

-- =============================================================
-- AGENT PACKS (slug allineati con Design Lab mock: data.ts)
-- =============================================================

-- Pack 1: Newsletter (active — il primo pack disponibile)
INSERT INTO public.agent_packs (
    slug, name, description, icon, content_type_id,
    agents_config, tools_config, brief_questions, prompt_templates,
    status, outcome, route, sort_order
) VALUES (
    'newsletter',
    'Newsletter Pack',
    'Crea newsletter engaging',
    '📧',
    (SELECT id FROM public.content_types WHERE slug = 'newsletter'),
    '[{"name":"curator","role":"Content Curator","goal":"Selezionare contenuti rilevanti","tools":["perplexity_search"]},{"name":"writer","role":"Newsletter Writer","goal":"Scrivere copy accattivante per email","tools":[]}]'::jsonb,
    '["perplexity_search"]'::jsonb,
    '[{"id":"newsletter_type","question":"Che tipo di newsletter?","type":"select","options":["Digest settimanale","Update prodotto","Educational","Promozionale"],"required":true},{"id":"sections","question":"Quali sezioni includere?","type":"multiselect","options":["Intro personale","News del settore","Tips","Risorse","CTA finale"],"required":true},{"id":"frequency","question":"Con che frequenza invii?","type":"select","options":["Giornaliera","Settimanale","Bisettimanale","Mensile"],"required":true}]'::jsonb,
    '{"curator":"Sei un content curator. Trova notizie e trend rilevanti per il pubblico target.","writer":"Sei un email copywriter. Subject line accattivanti, personalizzazione, urgenza senza spam."}'::jsonb,
    'available',
    'Newsletter pronta e pubblicata ogni settimana.',
    '/design-lab/outputs/newsletter',
    1
);

-- Pack 2: Blog (available)
INSERT INTO public.agent_packs (
    slug, name, description, icon, content_type_id,
    agents_config, tools_config, brief_questions, prompt_templates,
    status, outcome, route, sort_order
) VALUES (
    'blog',
    'Blog Pack',
    'Genera articoli di blog ottimizzati SEO',
    '📝',
    (SELECT id FROM public.content_types WHERE slug = 'blog_post'),
    '[{"name":"researcher","role":"Research Specialist","goal":"Raccogliere informazioni approfondite sul topic","tools":["perplexity_search"]},{"name":"writer","role":"Content Writer","goal":"Scrivere contenuto engaging e SEO-friendly","tools":[]},{"name":"editor","role":"Editor","goal":"Rifinire e ottimizzare il contenuto","tools":[]}]'::jsonb,
    '["perplexity_search"]'::jsonb,
    '[{"id":"tone","question":"Che tono vuoi per i tuoi blog post?","type":"select","options":["Professionale","Conversazionale","Tecnico","Ispirante"],"required":true},{"id":"length","question":"Quanto lunghi devono essere gli articoli?","type":"select","options":["Breve (500-800 parole)","Medio (800-1500 parole)","Lungo (1500-2500 parole)"],"required":true},{"id":"seo_focus","question":"Keywords principali da includere?","type":"text","placeholder":"keyword1, keyword2","required":false},{"id":"cta","question":"Call-to-action principale?","type":"text","placeholder":"es. Iscriviti alla newsletter","required":false}]'::jsonb,
    '{"researcher":"Sei un research specialist. Cerca informazioni accurate e aggiornate. Cita le fonti.","writer":"Sei un content writer esperto. Scrivi in modo engaging, usa sottotitoli e bullet points. Ottimizza per SEO.","editor":"Sei un editor. Correggi errori, migliora leggibilita, assicurati coerenza tono."}'::jsonb,
    'available',
    'Articoli SEO pubblicati con continuità.',
    '/design-lab/outputs/blog',
    2
);

-- Pack 3: Social (coming_soon)
INSERT INTO public.agent_packs (
    slug, name, description, icon, content_type_id,
    agents_config, tools_config, brief_questions, prompt_templates,
    status, outcome, route, sort_order
) VALUES (
    'social',
    'Social Pack',
    'Piano e post multi-canale per social media',
    '💼',
    (SELECT id FROM public.content_types WHERE slug = 'linkedin_post'),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    'coming_soon',
    'Piano e post multi-canale pubblicati.',
    NULL,
    3
);

-- Pack 4: Podcast (coming_soon)
INSERT INTO public.agent_packs (
    slug, name, description, icon, content_type_id,
    agents_config, tools_config, brief_questions, prompt_templates,
    status, outcome, route, sort_order
) VALUES (
    'podcast',
    'Podcast Pack',
    'Episodi audio prodotti e distribuiti',
    '🎙',
    (SELECT id FROM public.content_types WHERE slug = 'podcast_script'),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    'coming_soon',
    'Episodi audio prodotti e distribuiti.',
    NULL,
    4
);
