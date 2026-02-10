-- =====================================================
-- Migration 007: Context-Specific Agent Packs
-- =====================================================
-- Purpose: Allow agent packs to be associated with specific contexts
-- This enables each client context to have its own agent packs
-- while keeping global template packs available to all users.

-- Add context_id to agent_packs (nullable for template packs)
ALTER TABLE public.agent_packs
ADD COLUMN context_id UUID REFERENCES public.contexts(id) ON DELETE CASCADE;

-- Add user_id for ownership (needed for RLS)
ALTER TABLE public.agent_packs
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add index for context filtering (partial index for efficiency)
CREATE INDEX idx_agent_packs_context ON public.agent_packs(context_id)
WHERE context_id IS NOT NULL;

-- Add index for user filtering (partial index for efficiency)
CREATE INDEX idx_agent_packs_user ON public.agent_packs(user_id)
WHERE user_id IS NOT NULL;

-- Update RLS: Remove old public read policy
DROP POLICY IF EXISTS "public_packs" ON public.agent_packs;

-- Add RLS: Users can see global packs (NULL context_id) + their own packs
CREATE POLICY "view_packs" ON public.agent_packs
FOR SELECT USING (
    context_id IS NULL  -- Global/template packs
    OR user_id = auth.uid()  -- User's own packs
);

-- Add RLS: Users can create/update/delete their own packs
CREATE POLICY "manage_own_packs" ON public.agent_packs
FOR ALL USING (user_id = auth.uid());

-- Note: Existing global packs (Newsletter, Blog, Social, Podcast)
-- will keep NULL context_id and NULL user_id, making them visible
-- as templates to all users but not editable.
