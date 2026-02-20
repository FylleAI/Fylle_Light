"""
Document API endpoints for uploading, listing, and managing documents.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import get_current_user
from app.services.document_service import DocumentService

router = APIRouter()


# ==================== CONTEXT DOCUMENTS ====================


@router.post("/contexts/{context_id}")
async def upload_context_document(
    context_id: UUID,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    user_id: UUID = Depends(get_current_user),
):
    """
    Upload a document to a context.

    - **context_id**: UUID of the context
    - **file**: File to upload (PDF, DOCX, TXT, images)
    - **description**: Optional description
    """
    return await DocumentService().upload_context_document(context_id, user_id, file, description)


@router.get("/contexts/{context_id}")
async def list_context_documents(
    context_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    List all documents for a context.

    - **context_id**: UUID of the context
    """
    return DocumentService().list_context_documents(context_id, user_id)


@router.delete("/contexts/{doc_id}")
async def delete_context_document(
    doc_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    Delete a context document.

    - **doc_id**: UUID of the document
    """
    DocumentService().delete_context_document(doc_id, user_id)
    return {"deleted": True}


@router.get("/contexts/{doc_id}/download")
async def download_context_document(
    doc_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    Get a signed download URL for a context document.

    - **doc_id**: UUID of the document
    """
    return DocumentService().get_document_download_url(doc_id, user_id, "context")


# ==================== BRIEF DOCUMENTS ====================


@router.post("/briefs/{brief_id}")
async def upload_brief_document(
    brief_id: UUID,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    user_id: UUID = Depends(get_current_user),
):
    """
    Upload a document to a brief.

    - **brief_id**: UUID of the brief
    - **file**: File to upload (PDF, DOCX, TXT, images)
    - **description**: Optional description
    """
    return await DocumentService().upload_brief_document(brief_id, user_id, file, description)


@router.get("/briefs/{brief_id}")
async def list_brief_documents(
    brief_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    List all documents for a brief.

    - **brief_id**: UUID of the brief
    """
    return DocumentService().list_brief_documents(brief_id, user_id)


@router.delete("/briefs/{doc_id}")
async def delete_brief_document(
    doc_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    Delete a brief document.

    - **doc_id**: UUID of the document
    """
    DocumentService().delete_brief_document(doc_id, user_id)
    return {"deleted": True}


@router.get("/briefs/{doc_id}/download")
async def download_brief_document(
    doc_id: UUID,
    user_id: UUID = Depends(get_current_user),
):
    """
    Get a signed download URL for a brief document.

    - **doc_id**: UUID of the document
    """
    return DocumentService().get_document_download_url(doc_id, user_id, "brief")
