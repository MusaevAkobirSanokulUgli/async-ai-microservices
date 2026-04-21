from __future__ import annotations

import asyncio
import pytest

from app.services.processor import DocumentProcessor
from app.services.storage import DocumentStorage


# ── Processor unit tests

@pytest.mark.asyncio
async def test_process_simple_document():
    processor = DocumentProcessor(max_concurrent=1)
    result = await processor.process(
        "test-id-1",
        "Hello world. This is a test document. It has three sentences.",
    )
    assert result["status"] == "completed"
    assert result["word_count"] > 0
    assert "checksum" in result
    assert len(result["checksum"]) == 64


@pytest.mark.asyncio
async def test_process_extracts_emails():
    processor = DocumentProcessor()
    result = await processor.process(
        "test-id-email",
        "Contact support@example.com or admin@test.org for help.",
    )
    email_entities = [e for e in result["entities"] if e["type"] == "email"]
    values = [e["value"] for e in email_entities]
    assert "support@example.com" in values
    assert "admin@test.org" in values


@pytest.mark.asyncio
async def test_process_extracts_urls():
    processor = DocumentProcessor()
    result = await processor.process(
        "test-id-url",
        "Visit https://example.com and http://test.org for details.",
    )
    url_entities = [e for e in result["entities"] if e["type"] == "url"]
    assert len(url_entities) >= 1


@pytest.mark.asyncio
async def test_process_extracts_dates():
    processor = DocumentProcessor()
    result = await processor.process(
        "test-id-date",
        "The event was held on 2024-03-15 and 2024-04-20.",
    )
    date_entities = [e for e in result["entities"] if e["type"] == "date"]
    values = [e["value"] for e in date_entities]
    assert "2024-03-15" in values


@pytest.mark.asyncio
async def test_process_empty_document_raises():
    processor = DocumentProcessor()
    with pytest.raises(ValueError, match="empty"):
        await processor.process("test-empty", "   ")


@pytest.mark.asyncio
async def test_process_cleans_whitespace():
    processor = DocumentProcessor()
    messy = "Hello  world.\r\n\n\n\nNewline test."
    result = await processor.process("test-clean", messy)
    assert result["status"] == "completed"
    assert "  " not in result.get("checksum", "")  # cleaned text has single spaces


@pytest.mark.asyncio
async def test_progress_tracking():
    processor = DocumentProcessor()
    doc_id = "test-progress"
    # Before processing
    assert processor.get_progress(doc_id) is None
    # After processing
    await processor.process(doc_id, "Some content to process here.")
    progress = processor.get_progress(doc_id)
    assert progress is not None
    assert progress["status"] == "completed"
    assert progress["progress"] == 100


@pytest.mark.asyncio
async def test_concurrent_processing():
    """Ensure semaphore allows concurrent processing without deadlock."""
    processor = DocumentProcessor(max_concurrent=3)
    tasks = [
        processor.process(f"concurrent-{i}", f"Document number {i} with some content.")
        for i in range(5)
    ]
    results = await asyncio.gather(*tasks)
    assert all(r["status"] == "completed" for r in results)


# ── Storage unit tests

@pytest.mark.asyncio
async def test_storage_save_and_get():
    storage = DocumentStorage()
    await storage.initialize()
    data = {"id": "doc1", "content": "test"}
    saved = await storage.save("doc1", data)
    assert saved["_id"] == "doc1"
    retrieved = await storage.get("doc1")
    assert retrieved is not None
    assert retrieved["id"] == "doc1"


@pytest.mark.asyncio
async def test_storage_delete():
    storage = DocumentStorage()
    await storage.initialize()
    await storage.save("del-test", {"id": "del-test"})
    deleted = await storage.delete("del-test")
    assert deleted is True
    assert await storage.get("del-test") is None


@pytest.mark.asyncio
async def test_storage_count():
    storage = DocumentStorage()
    await storage.initialize()
    for i in range(3):
        await storage.save(f"count-{i}", {"id": f"count-{i}"})
    assert await storage.count() == 3


@pytest.mark.asyncio
async def test_storage_list_pagination():
    storage = DocumentStorage()
    await storage.initialize()
    for i in range(5):
        await storage.save(f"list-{i}", {"id": f"list-{i}"})
    page1 = await storage.list(skip=0, limit=3)
    page2 = await storage.list(skip=3, limit=3)
    assert len(page1) == 3
    assert len(page2) == 2


# ── HTTP endpoint tests

@pytest.mark.asyncio
async def test_health_endpoint(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["storage_backend"] == "in-memory"


@pytest.mark.asyncio
async def test_upload_document_accepted(client):
    resp = await client.post(
        "/api/v1/documents",
        json={"content": "This is a test document.", "filename": "test.txt"},
    )
    assert resp.status_code == 202
    body = resp.json()
    assert "document_id" in body
    assert body["status"] == "accepted"


@pytest.mark.asyncio
async def test_list_documents(client):
    resp = await client.get("/api/v1/documents")
    assert resp.status_code == 200
    body = resp.json()
    assert "documents" in body
    assert "total" in body


@pytest.mark.asyncio
async def test_get_nonexistent_document(client):
    resp = await client.get("/api/v1/documents/nonexistent-id")
    assert resp.status_code == 404
