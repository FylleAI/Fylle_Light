-- =============================================================
-- Fylle MVP — Migrate output status from Italian to English
-- =============================================================
-- Migration 008: Change output status values
-- da_approvare → pending_review
-- completato → completed
-- adattato → adapted
-- =============================================================

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE public.outputs DROP CONSTRAINT IF EXISTS outputs_status_check;

-- Step 2: Update existing data
UPDATE public.outputs SET status = 'pending_review' WHERE status = 'da_approvare';
UPDATE public.outputs SET status = 'completed' WHERE status = 'completato';
UPDATE public.outputs SET status = 'adapted' WHERE status = 'adattato';

-- Step 3: Add new CHECK constraint with English values
ALTER TABLE public.outputs ADD CONSTRAINT outputs_status_check
    CHECK (status IN ('pending_review', 'completed', 'adapted'));

-- Step 4: Update the default value
ALTER TABLE public.outputs ALTER COLUMN status SET DEFAULT 'pending_review';
