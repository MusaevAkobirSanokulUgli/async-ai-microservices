from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import JSONResponse

from app.models.schemas import (
    DocumentListResponse,
    DocumentRecord,
    DocumentUploadRequest,
    ProcessingResult,
    ProcessingStatus,
    ProgressResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("", status_code=202, summary="Upload and process a document")
async def upload_document(
    body: DocumentUploadRequest,
    background_tasks: BackgroundTasks,
    request: Request,
):
    doc_id = str(uuid4())
    processor = request.app.state.processor
    storage = request.app.state.storage

    now = datetime.now(timezone.utc).isoformat()
    record = DocumentRecord(
        id=doc_id,
        filename=body.filename,
        status=ProcessingStatus.PENDING,
        content_length=len(body.content),
        metadata=body.metadata,
        created_at=now,
        updated_at=now,
    )
    await storage.save(doc_id, record.model_dump())

    background_tasks.add_task(
        _process_and_store, doc_id, body.content, body.metadata, processor, storage
    )

    return {
        "document_id": doc_id,
        "status": "accepted",
        "message": "Document queued for processing.",
    }


async def _process_and_store(
    doc_id: str, content: str, metadata: dict, processor, storage
) -> None:
    try:
        result_dict = await processor.process(doc_id, content, metadata)
        result = ProcessingResult(**result_dict, entities=result_dict.get("entities", []))

        existing = await storage.get(doc_id) or {}
        existing.update(
            {
                "status": ProcessingStatus.COMPLETED,
                "result": result.model_dump(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await storage.save(doc_id, existing)
    except Exception as exc:
        logger.error("Background processing failed for %s: %s", doc_id, exc)
        existing = await storage.get(doc_id) or {}
        existing.update(
            {
                "status": ProcessingStatus.FAILED,
                "result": {"document_id": doc_id, "status": "failed", "error": str(exc)},
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        await storage.save(doc_id, existing)


@router.get("", response_model=DocumentListResponse, summary="List all documents")
async def list_documents(request: Request, skip: int = 0, limit: int = 20):
    storage = request.app.state.storage
    docs = await storage.list(skip=skip, limit=limit)
    total = await storage.count()
    return DocumentListResponse(
        documents=[DocumentRecord(**d) for d in docs],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{document_id}", summary="Get document details")
async def get_document(document_id: str, request: Request):
    storage = request.app.state.storage
    doc = await storage.get(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.get("/{document_id}/progress", response_model=ProgressResponse, summary="Get processing progress")
async def get_progress(document_id: str, request: Request):
    processor = request.app.state.processor
    progress = processor.get_progress(document_id)
    if progress is None:
        raise HTTPException(status_code=404, detail="No progress info for this document.")
    return ProgressResponse(
        document_id=document_id,
        status=progress["status"],
        progress=progress["progress"],
    )


@router.delete("/{document_id}", status_code=204, summary="Delete a document")
async def delete_document(document_id: str, request: Request):
    storage = request.app.state.storage
    deleted = await storage.delete(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
