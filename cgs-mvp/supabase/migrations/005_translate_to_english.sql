-- =============================================================
-- Fylle MVP — Translate seed data from Italian to English
-- =============================================================
-- Migration 005: Update existing content_types and agent_packs
-- Run in Supabase SQL Editor to update live data
-- =============================================================

-- =============================================================
-- CONTENT TYPES — descriptions
-- =============================================================
UPDATE public.content_types SET description = 'Blog article for your company'  WHERE slug = 'blog_post';
UPDATE public.content_types SET description = 'Periodic email newsletter'      WHERE slug = 'newsletter';
UPDATE public.content_types SET description = 'Post for LinkedIn'              WHERE slug = 'linkedin_post';
UPDATE public.content_types SET description = 'Thread for X/Twitter'           WHERE slug = 'twitter_thread';
UPDATE public.content_types SET description = 'Caption for Instagram'          WHERE slug = 'instagram';
UPDATE public.content_types SET description = 'Script for podcast episode'     WHERE slug = 'podcast_script';
UPDATE public.content_types SET description = 'Script for video'               WHERE slug = 'video_script';
UPDATE public.content_types SET description = 'AI-generated image'             WHERE slug = 'image';
UPDATE public.content_types SET description = 'Multi-channel social post'      WHERE slug = 'social';

-- =============================================================
-- AGENT PACKS — Newsletter Pack
-- =============================================================
UPDATE public.agent_packs SET
    description = 'Create engaging newsletters',
    outcome = 'Newsletter ready and published every week.',
    agents_config = '[{"name":"curator","role":"Content Curator","goal":"Select relevant content for the target audience","tools":["perplexity_search"]},{"name":"writer","role":"Newsletter Writer","goal":"Write compelling email copy","tools":[]}]'::jsonb,
    brief_questions = '[{"id":"newsletter_type","question":"What type of newsletter?","type":"select","options":["Weekly digest","Product update","Educational","Promotional"],"required":true},{"id":"sections","question":"Which sections to include?","type":"multiselect","options":["Personal intro","Industry news","Tips","Resources","Final CTA"],"required":true},{"id":"frequency","question":"How often do you send it?","type":"select","options":["Daily","Weekly","Bi-weekly","Monthly"],"required":true}]'::jsonb,
    prompt_templates = '{"curator":"You are a content curator. Find relevant news and trends for the target audience.","writer":"You are an email copywriter. Write compelling subject lines, personalize content, create urgency without being spammy."}'::jsonb
WHERE slug = 'newsletter';

-- =============================================================
-- AGENT PACKS — Blog Pack
-- =============================================================
UPDATE public.agent_packs SET
    description = 'Generate SEO-optimized blog articles',
    outcome = 'SEO articles published consistently.',
    agents_config = '[{"name":"researcher","role":"Research Specialist","goal":"Gather in-depth information on the topic","tools":["perplexity_search"]},{"name":"writer","role":"Content Writer","goal":"Write engaging and SEO-friendly content","tools":[]},{"name":"editor","role":"Editor","goal":"Refine and optimize the content","tools":[]}]'::jsonb,
    brief_questions = '[{"id":"tone","question":"What tone do you want for your blog posts?","type":"select","options":["Professional","Conversational","Technical","Inspirational"],"required":true},{"id":"length","question":"How long should the articles be?","type":"select","options":["Short (500-800 words)","Medium (800-1500 words)","Long (1500-2500 words)"],"required":true},{"id":"seo_focus","question":"Main keywords to include?","type":"text","placeholder":"keyword1, keyword2","required":false},{"id":"cta","question":"Primary call-to-action?","type":"text","placeholder":"e.g. Subscribe to the newsletter","required":false}]'::jsonb,
    prompt_templates = '{"researcher":"You are a research specialist. Find accurate and up-to-date information. Cite your sources.","writer":"You are an expert content writer. Write in an engaging way, use subheadings and bullet points. Optimize for SEO.","editor":"You are an editor. Fix errors, improve readability, ensure tone consistency."}'::jsonb
WHERE slug = 'blog';

-- =============================================================
-- AGENT PACKS — Social Pack
-- =============================================================
UPDATE public.agent_packs SET
    description = 'Multi-channel social media plan and posts',
    outcome = 'Multi-channel plan and posts published.'
WHERE slug = 'social';

-- =============================================================
-- AGENT PACKS — Podcast Pack
-- =============================================================
UPDATE public.agent_packs SET
    description = 'Audio episodes produced and distributed',
    outcome = 'Audio episodes produced and distributed.'
WHERE slug = 'podcast';

-- =============================================================
-- PROFILES — default language setting for new users
-- =============================================================
-- Note: existing users keep their current settings.
-- To update existing users' default language:
-- UPDATE public.profiles SET settings = jsonb_set(settings, '{language}', '"en"') WHERE settings->>'language' = 'it';
