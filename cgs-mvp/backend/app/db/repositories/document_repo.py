"""
Document repositories for context and brief documents.
Simple CRUD operations following the existing repository pattern.
"""

from uuid import UUID
from typing import List, Dict, Any
from .base import BaseRepository


class ContextDocumentRepository(BaseRepository):
    """Repository for context documents."""

    def __init__(self, db):
        super().__init__(db, "context_documents")

    def list_by_context(self, context_id: UUID) -> List[Dict[str, Any]]:
        """Get all documents for a specific context."""
        return (
            self.db.table(self.table)
            .select("*")
            .eq("context_id", str(context_id))
            .order("created_at", desc=True)
            .execute()
            .data
        )


class BriefDocumentRepository(BaseRepository):
    """Repository for brief documents."""

    def __init__(self, db):
        super().__init__(db, "brief_documents")

    def list_by_brief(self, brief_id: UUID) -> List[Dict[str, Any]]:
        """Get all documents for a specific brief."""
        return (
            self.db.table(self.table)
            .select("*")
            .eq("brief_id", str(brief_id))
            .order("created_at", desc=True)
            .execute()
            .data
        )
