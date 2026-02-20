"""Baseline: snapshot of existing schema (migrations 001-010).

This migration represents the current state of the database as of 2026-02-20.
All previous manual SQL migrations (supabase/migrations/001-010) are captured here.

The upgrade() is a no-op because the DB already has this schema.
Use 'alembic stamp head' to mark the DB as being at this revision.

Revision ID: 0001
Revises: None
Create Date: 2026-02-20
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ===========================================================================
# EXISTING SCHEMA DOCUMENTATION
#
# This baseline covers the following manual migrations:
#
# 001_schema.sql        — Core tables: profiles, content_types, contexts,
#                         cards, agent_packs, briefs, workflow_runs, outputs,
#                         archive, chat_messages, onboarding_sessions, run_logs
#                         + RLS policies, triggers, functions, extensions
#
# 002_seed.sql          — Seed data: content_types, agent_packs (4 packs)
#
# 003_storage.sql       — Supabase Storage buckets: outputs, previews, documents
#
# 004_functions.sql     — PostgreSQL functions: search_archive_by_embedding,
#                         get_archive_stats
#
# 005_translate_to_english.sql — Enum normalization (IT → EN)
#
# 006_documents.sql     — Tables: context_documents, brief_documents
#                         + vector indexes, RLS, triggers
#
# 007_context_packs.sql — Add context_id, user_id to agent_packs
#                         + new RLS policies, indexes
#
# 008_english_output_status.sql — Migrate output status values to English
#
# 009_context_items.sql — Table: context_items (hierarchical tree)
#                         + indexes, RLS, triggers
#
# 010_add_rejected_status.sql — Add 'rejected' to outputs status constraint
#
# Tables (14 total):
#   profiles, content_types, contexts, cards, agent_packs, briefs,
#   workflow_runs, outputs, archive, chat_messages, onboarding_sessions,
#   run_logs, context_documents, brief_documents, context_items
#
# Extensions: uuid-ossp, vector (pgvector)
#
# For full SQL details, see: supabase/migrations/
# ===========================================================================


def upgrade() -> None:
    """No-op: the database already has this schema.

    After creating this migration, run:
        cd backend && alembic stamp head

    This tells Alembic "the DB is already at revision 0001"
    without executing any SQL.
    """
    pass


def downgrade() -> None:
    """Cannot downgrade past the baseline.

    The baseline represents the initial state of the database.
    To recreate from scratch, use the SQL files in supabase/migrations/.
    """
    raise RuntimeError(
        "Cannot downgrade past baseline. "
        "To recreate the schema from scratch, use supabase/migrations/ SQL files."
    )
