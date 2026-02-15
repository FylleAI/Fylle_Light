-- =============================================================
-- Fylle MVP — Add 'rejected' to output status
-- =============================================================
-- Migration 010: Add 'rejected' as valid output status
-- Needed for the feedback loop: when a user rejects content,
-- outputs.status should change to 'rejected' so the UI
-- can display the correct state.
-- =============================================================

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE public.outputs DROP CONSTRAINT IF EXISTS outputs_status_check;

-- Step 2: Add new CHECK constraint with 'rejected' included
ALTER TABLE public.outputs ADD CONSTRAINT outputs_status_check
    CHECK (status IN ('pending_review', 'completed', 'adapted', 'rejected'));
