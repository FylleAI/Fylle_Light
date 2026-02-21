from typing import Callable
from uuid import UUID

import structlog

from .base import BaseRepository

logger = structlog.get_logger("cgs-mvp.archive_repo")


class ArchiveRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "archive")

    # ── Private helper: brief-first, context fallback ──

    @staticmethod
    def _brief_first_fallback(
        narrow_fn: Callable[[], list],
        wide_fn: Callable[[], list],
        brief_id: UUID | None,
    ) -> tuple[list, bool]:
        """Try brief-scoped query first; fall back to context-scoped if empty.

        Returns (results, is_brief_scoped).
        """
        if brief_id is None:
            return wide_fn(), False

        results = narrow_fn()
        if results:
            return results, True

        # Fallback to context-level
        logger.info(
            "brief_fallback | brief_id=%s returned 0 results, falling back to context",
            brief_id,
        )
        return wide_fn(), False

    # ── Public methods ──

    def get_references(
        self,
        context_id: UUID,
        brief_id: UUID | None = None,
        limit: int = 5,
    ) -> list:
        def _query(bid: UUID | None = None):
            q = (
                self.db.table("archive")
                .select("*, outputs(text_content)")
                .eq("context_id", str(context_id))
                .eq("is_reference", True)
            )
            if bid is not None:
                q = q.eq("brief_id", str(bid))
            return q.order("created_at", desc=True).limit(limit).execute().data

        results, scoped = self._brief_first_fallback(
            narrow_fn=lambda: _query(brief_id),
            wide_fn=lambda: _query(None),
            brief_id=brief_id,
        )
        return results

    def get_guardrails(
        self,
        context_id: UUID,
        brief_id: UUID | None = None,
        limit: int = 5,
    ) -> list:
        def _query(bid: UUID | None = None):
            q = (
                self.db.table("archive")
                .select("*, outputs(text_content)")
                .eq("context_id", str(context_id))
                .eq("review_status", "rejected")
            )
            if bid is not None:
                q = q.eq("brief_id", str(bid))
            return q.order("created_at", desc=True).limit(limit).execute().data

        results, scoped = self._brief_first_fallback(
            narrow_fn=lambda: _query(brief_id),
            wide_fn=lambda: _query(None),
            brief_id=brief_id,
        )
        return results

    def semantic_search(
        self,
        embedding: list,
        context_id: UUID,
        brief_id: UUID | None = None,
        limit: int = 5,
    ) -> list:
        def _rpc(bid: UUID | None = None):
            params = {
                "query_embedding": embedding,
                "match_context_id": str(context_id),
                "match_count": limit,
            }
            if bid is not None:
                params["match_brief_id"] = str(bid)
            return self.db.rpc("search_archive_by_embedding", params).execute().data

        results, scoped = self._brief_first_fallback(
            narrow_fn=lambda: _rpc(brief_id),
            wide_fn=lambda: _rpc(None),
            brief_id=brief_id,
        )
        return results
