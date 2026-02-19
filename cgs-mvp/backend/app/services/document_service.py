"""
Document service for handling file uploads to contexts and briefs.
Manages validation, storage, and database operations.
"""

import structlog
from uuid import UUID
from typing import Optional, List, Dict, Any
from fastapi import UploadFile

from app.config.supabase import get_supabase_admin
from app.config.settings import get_settings
from app.db.repositories.document_repo import (
    ContextDocumentRepository,
    BriefDocumentRepository,
)
from app.infrastructure.storage.supabase_storage import StorageService
from app.exceptions import NotFoundException, ValidationException

logger = structlog.get_logger("cgs-mvp.documents")

# Allowed MIME types for document uploads
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/msword",  # .doc
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
}


class DocumentService:
    """Service for managing document uploads and retrieval."""

    def __init__(self):
        self.db = get_supabase_admin()
        self.settings = get_settings()
        self.storage = StorageService()

    def _validate_file(self, file: UploadFile) -> int:
        """
        Validate file type and size.

        Args:
            file: The uploaded file to validate

        Returns:
            int: File size in bytes

        Raises:
            ValidationException: If file type or size is invalid
        """
        # Validate MIME type
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise ValidationException(
                f"File type '{file.content_type}' not allowed. "
                f"Supported types: PDF, DOCX, DOC, TXT, PNG, JPEG, WEBP"
            )

        # Check file size
        file.file.seek(0, 2)  # Seek to end
        size = file.file.tell()
        file.file.seek(0)  # Reset to beginning

        max_size = self.settings.max_upload_size_mb * 1024 * 1024
        if size > max_size:
            raise ValidationException(
                f"File too large ({size / 1024 / 1024:.1f}MB). "
                f"Maximum allowed: {self.settings.max_upload_size_mb}MB"
            )

        return size

    # ==================== CONTEXT DOCUMENTS ====================

    async def upload_context_document(
        self,
        context_id: UUID,
        user_id: UUID,
        file: UploadFile,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload a document to a context.

        Args:
            context_id: ID of the context
            user_id: ID of the user uploading
            file: The file to upload
            description: Optional description

        Returns:
            Dict containing the created document record

        Raises:
            NotFoundException: If context not found or not owned by user
            ValidationException: If file validation fails
        """
        # Validate file
        size = self._validate_file(file)

        # Verify context ownership
        context = (
            self.db.table("contexts")
            .select("id")
            .eq("id", str(context_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not context.data:
            raise NotFoundException("Context not found or access denied")

        # Upload to storage
        file_data = await file.read()
        storage_path = f"{user_id}/contexts/{context_id}/{file.filename}"

        path = await self.storage.upload_file(
            user_id=user_id,
            file_data=file_data,
            file_name=storage_path,
            content_type=file.content_type,
            bucket="documents",
        )

        # Create database record
        doc = ContextDocumentRepository(self.db).create(
            {
                "context_id": str(context_id),
                "user_id": str(user_id),
                "file_name": file.filename,
                "file_path": path,
                "file_size_bytes": size,
                "mime_type": file.content_type,
                "description": description,
            }
        )

        logger.info("Context document uploaded", doc_id=doc["id"], context_id=str(context_id))
        return doc

    def list_context_documents(
        self, context_id: UUID, user_id: UUID
    ) -> List[Dict[str, Any]]:
        """
        List all documents for a context.

        Args:
            context_id: ID of the context
            user_id: ID of the user

        Returns:
            List of document records

        Raises:
            NotFoundException: If context not found or not owned by user
        """
        # Verify ownership
        context = (
            self.db.table("contexts")
            .select("id")
            .eq("id", str(context_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not context.data:
            raise NotFoundException("Context not found or access denied")

        return ContextDocumentRepository(self.db).list_by_context(context_id)

    def delete_context_document(self, doc_id: UUID, user_id: UUID):
        """
        Delete a context document and its file.

        Args:
            doc_id: ID of the document
            user_id: ID of the user

        Raises:
            NotFoundException: If document not found or not owned by user
        """
        # Get document
        doc = (
            self.db.table("context_documents")
            .select("*")
            .eq("id", str(doc_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not doc.data:
            raise NotFoundException("Document not found or access denied")

        # Delete from storage
        self.storage.delete_file(doc.data["file_path"], bucket="documents")

        # Delete from database
        ContextDocumentRepository(self.db).delete(doc_id)
        logger.info("Context document deleted", doc_id=str(doc_id))

    # ==================== BRIEF DOCUMENTS ====================

    async def upload_brief_document(
        self,
        brief_id: UUID,
        user_id: UUID,
        file: UploadFile,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload a document to a brief.

        Args:
            brief_id: ID of the brief
            user_id: ID of the user uploading
            file: The file to upload
            description: Optional description

        Returns:
            Dict containing the created document record

        Raises:
            NotFoundException: If brief not found or not owned by user
            ValidationException: If file validation fails
        """
        # Validate file
        size = self._validate_file(file)

        # Verify brief ownership
        brief = (
            self.db.table("briefs")
            .select("id")
            .eq("id", str(brief_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not brief.data:
            raise NotFoundException("Brief not found or access denied")

        # Upload to storage
        file_data = await file.read()
        storage_path = f"{user_id}/briefs/{brief_id}/{file.filename}"

        path = await self.storage.upload_file(
            user_id=user_id,
            file_data=file_data,
            file_name=storage_path,
            content_type=file.content_type,
            bucket="documents",
        )

        # Create database record
        doc = BriefDocumentRepository(self.db).create(
            {
                "brief_id": str(brief_id),
                "user_id": str(user_id),
                "file_name": file.filename,
                "file_path": path,
                "file_size_bytes": size,
                "mime_type": file.content_type,
                "description": description,
            }
        )

        logger.info("Brief document uploaded", doc_id=doc["id"], brief_id=str(brief_id))
        return doc

    def list_brief_documents(
        self, brief_id: UUID, user_id: UUID
    ) -> List[Dict[str, Any]]:
        """
        List all documents for a brief.

        Args:
            brief_id: ID of the brief
            user_id: ID of the user

        Returns:
            List of document records

        Raises:
            NotFoundException: If brief not found or not owned by user
        """
        # Verify ownership
        brief = (
            self.db.table("briefs")
            .select("id")
            .eq("id", str(brief_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not brief.data:
            raise NotFoundException("Brief not found or access denied")

        return BriefDocumentRepository(self.db).list_by_brief(brief_id)

    def delete_brief_document(self, doc_id: UUID, user_id: UUID):
        """
        Delete a brief document and its file.

        Args:
            doc_id: ID of the document
            user_id: ID of the user

        Raises:
            NotFoundException: If document not found or not owned by user
        """
        # Get document
        doc = (
            self.db.table("brief_documents")
            .select("*")
            .eq("id", str(doc_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )
        if not doc.data:
            raise NotFoundException("Document not found or access denied")

        # Delete from storage
        self.storage.delete_file(doc.data["file_path"], bucket="documents")

        # Delete from database
        BriefDocumentRepository(self.db).delete(doc_id)
        logger.info("Brief document deleted", doc_id=str(doc_id))

    # ==================== DOWNLOAD URLS ====================

    def get_document_download_url(
        self, doc_id: UUID, user_id: UUID, doc_type: str
    ) -> Dict[str, str]:
        """
        Get a signed URL for downloading a document.

        Args:
            doc_id: ID of the document
            user_id: ID of the user
            doc_type: Type of document ('context' or 'brief')

        Returns:
            Dict containing the download URL

        Raises:
            NotFoundException: If document not found or not owned by user
        """
        table = "context_documents" if doc_type == "context" else "brief_documents"

        doc = (
            self.db.table(table)
            .select("file_path")
            .eq("id", str(doc_id))
            .eq("user_id", str(user_id))
            .single()
            .execute()
        )

        if not doc.data:
            raise NotFoundException("Document not found or access denied")

        url = self.storage.get_signed_url(doc.data["file_path"], bucket="documents")
        return {"download_url": url}
