-- =============================================================
-- Fylle MVP — Seed Data
-- =============================================================
-- Migration 002: Content Types + Agent Packs
-- Separated from schema to evolve independently
-- =============================================================

-- =============================================================
-- CONTENT TYPES
-- =============================================================
INSERT INTO public.content_types (slug, name, description, icon, output_format, mime_types, sort_order) VALUES
    ('blog_post',     'Blog Post',      'Blog article for your company',       '📝', 'text',  ARRAY['text/markdown','text/html'], 1),
    ('newsletter',    'Newsletter',     'Periodic email newsletter',           '📧', 'text',  ARRAY['text/html'],                 2),
    ('linkedin_post', 'LinkedIn Post',  'Post for LinkedIn',                   '💼', 'text',  ARRAY['text/plain'],                3),
    ('twitter_thread','Twitter Thread', 'Thread for X/Twitter',                '🐦', 'text',  ARRAY['text/plain'],                4),
    ('instagram',     'Instagram',      'Caption for Instagram',               '📸', 'text',  ARRAY['text/plain'],                5),
    ('podcast_script','Podcast Script', 'Script for podcast episode',          '🎙', 'text',  ARRAY['text/markdown'],             6),
    ('video_script',  'Video Script',   'Script for video',                    '🎬', 'text',  ARRAY['text/markdown'],             7),
    ('image',         'Image',          'AI-generated image',                  '🖼', 'image', ARRAY['image/png','image/webp'],    8),
    ('social',        'Social Post',    'Multi-channel social post',           '📱', 'text',  ARRAY['text/plain'],                9);

-- =============================================================
-- AGENT PACKS (slugs aligned with Design Lab mock: data.ts)
-- =============================================================

-- Pack 1: Newsletter (available — first available pack)
INSERT INTO public.agent_packs (
    slug, name, description, icon, content_type_id,
    agents_config, tools_config, brief_questions, prompt_templates,
    status, outcome, route, sort_order
) VALUES (
    'newsletter',
    'Newsletter Pack',
    'Create engaging newsletters',
    '📧',
    (SELECT id FROM public.content_types WHERE slug = 'newsletter'),
    '[{"name":"curator","role":"Content Curator","goal":"Select relevant content for the target audience","tools":["perplexity_search"]},{"name":"writer","role":"Newsletter Writer","goal":"Write compelling email copy","tools":[]}]'::jsonb,
    '["perplexity_search"]'::jsonb,
    '[{"id":"newsletter_type","question":"What type of newsletter?","type":"select","options":["Weekly digest","Product update","Educational","Promotional"],"required":true},{"id":"sections","question":"Which sections to include?","type":"multiselect","options":["Personal intro","Industry news","Tips","Resources","Final CTA"],"required":true},{"id":"frequency","question":"How often do you send it?","type":"select","options":["Daily","Weekly","Bi-weekly","Monthly"],"required":true}]'::jsonb,
    '{"curator":"You are a content curator. Find relevant news and trends for the target audience.","writer":"You are an email copywriter. Write compelling subject lines, personalize content, create urgency without being spammy."}'::jsonb,
    'available',
    'Newsletter ready and published every week.',
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
    'Generate SEO-optimized blog articles',
    '📝',
    (SELECT id FROM public.content_types WHERE slug = 'blog_post'),
    '[{"name":"researcher","role":"Research Specialist","goal":"Gather in-depth information on the topic","tools":["perplexity_search"]},{"name":"writer","role":"Content Writer","goal":"Write engaging and SEO-friendly content","tools":[]},{"name":"editor","role":"Editor","goal":"Refine and optimize the content","tools":[]}]'::jsonb,
    '["perplexity_search"]'::jsonb,
    '[{"id":"tone","question":"What tone do you want for your blog posts?","type":"select","options":["Professional","Conversational","Technical","Inspirational"],"required":true},{"id":"length","question":"How long should the articles be?","type":"select","options":["Short (500-800 words)","Medium (800-1500 words)","Long (1500-2500 words)"],"required":true},{"id":"seo_focus","question":"Main keywords to include?","type":"text","placeholder":"keyword1, keyword2","required":false},{"id":"cta","question":"Primary call-to-action?","type":"text","placeholder":"e.g. Subscribe to the newsletter","required":false}]'::jsonb,
    '{"researcher":"You are a research specialist. Find accurate and up-to-date information. Cite your sources.","writer":"You are an expert content writer. Write in an engaging way, use subheadings and bullet points. Optimize for SEO.","editor":"You are an editor. Fix errors, improve readability, ensure tone consistency."}'::jsonb,
    'available',
    'SEO articles published consistently.',
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
    'Multi-channel social media plan and posts',
    '💼',
    (SELECT id FROM public.content_types WHERE slug = 'linkedin_post'),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    'coming_soon',
    'Multi-channel plan and posts published.',
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
    'Audio episodes produced and distributed',
    '🎙',
    (SELECT id FROM public.content_types WHERE slug = 'podcast_script'),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    'coming_soon',
    'Audio episodes produced and distributed.',
    NULL,
    4
);
