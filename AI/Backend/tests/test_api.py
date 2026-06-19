from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app, settings
from app.services.auth_service import get_current_user
from app.db import models

# Mock authentication dependency globally for tests
dummy_user = models.User(id=1, username="testuser", password_hash="mocked_password")
app.dependency_overrides[get_current_user] = lambda: dummy_user

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"ok", "degraded"}
    assert data["qdrant"] in {"connected", "disconnected"}
    assert "chunks_indexed" in data


def test_query() -> None:
    payload = {
        "question": "Nguoi lao dong co quyen don phuong cham dut hop dong trong truong hop nao?",
        "top_k": 3,
        "legal_domain": "lao_dong",
    }
    mock_result = {
        "answer": "Theo Bộ luật Lao động 2019...",
        "citations": [
            {
                "article_ref": "Điều 35",
                "doc_title": "Bộ luật Lao động 2019",
                "content": "Người lao động có quyền đơn phương chấm dứt hợp đồng...",
                "score": 0.95,
            }
        ],
    }
    with patch("app.api.routers.query.run_query", new=AsyncMock(return_value=mock_result)):
        response = client.post("/api/v1/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "citations" in data


def test_import() -> None:
    files = {"file": ("law.pdf", b"Dieu 1 Noi dung luat\nDieu 2 Dieu khoan", "application/pdf")}
    data = {"doc_type": "luat", "legal_domain": "dan_su"}
    mock_result = {
        "status": "success",
        "chunks_created": 5,
        "doc_id": "test-doc-id",
        "summary": "test summary",
    }
    with patch("app.api.routers.documents.import_document_to_graph", new=AsyncMock(return_value=mock_result)):
        response = client.post("/api/v1/import", files=files, data=data)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["chunks_created"] >= 1


def test_simple_chat() -> None:
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value="demo answer")):
        response = client.post("/api/v1/chat/simple", json={"prompt": "Hello"})
    assert response.status_code == 200
    body = response.json()
    assert body["answer"] == "demo answer"
    assert isinstance(body["latency_ms"], int)


def test_simple_chat_without_context_still_calls_llm_for_analysis_query() -> None:
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value="demo answer")) as mock_generate:
        response = client.post("/api/v1/chat/simple", json={"prompt": "Tom tat rui ro phap ly trong hop dong"})

    assert response.status_code == 200
    assert response.json()["answer"] == "demo answer"
    mock_generate.assert_awaited_once()
    called_kwargs = mock_generate.await_args.kwargs
    assert "extra_system_prompt" in called_kwargs
    assert "khong duoc tu choi" in called_kwargs["extra_system_prompt"].lower()
    assert "nguon internet" in called_kwargs["extra_system_prompt"].lower()


def test_simple_chat_keeps_user_context_if_provided() -> None:
    user_prompt = "[CONTEXT]\nDieu 1 ...\n[/CONTEXT]\n\n[QUESTION]\nHoi\n[/QUESTION]"
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value="demo answer")) as mock_generate:
        response = client.post("/api/v1/chat/simple", json={"prompt": user_prompt})

    assert response.status_code == 200
    called_prompt = mock_generate.await_args.args[0]
    assert called_prompt == user_prompt
    called_kwargs = mock_generate.await_args.kwargs
    assert called_kwargs.get("extra_system_prompt") is None


def test_simple_chat_can_call_llm_without_context_for_general_prompt() -> None:
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value="Xin chao, minh co the ho tro gi?")) as mock_generate:
        response = client.post("/api/v1/chat/simple", json={"prompt": "Xin chao"})

    assert response.status_code == 200
    assert response.json()["answer"] == "Xin chao, minh co the ho tro gi?"
    mock_generate.assert_awaited_once()
    called_kwargs = mock_generate.await_args.kwargs
    assert called_kwargs.get("extra_system_prompt") is not None


def test_simple_chat_weather_query_calls_llm() -> None:
    reply = "Toi la GovDoc Intellisense, toi chu yeu ho tro phap ly, va hom nay troi dep."
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value=reply)) as mock_generate:
        response = client.post("/api/v1/chat/simple", json={"prompt": "Hom nay troi the nao?"})

    assert response.status_code == 200
    assert response.json()["answer"] == reply
    mock_generate.assert_awaited_once()


def test_simple_chat_converts_low_context_template_to_internet_basis() -> None:
    low_context_answer = (
        "[TOM TAT] Van ban nay khong cung cap thong tin ve cac nghia vu cu the. "
        "[CAN CU] [LUU Y] Khong du context de tra loi cau hoi."
    )
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value=low_context_answer)):
        response = client.post("/api/v1/chat/simple", json={"prompt": "Tom tat nghia vu"})

    assert response.status_code == 200
    answer = response.json()["answer"].lower()
    assert "[can cu]" in answer
    assert "nguon internet" in answer


def test_simple_chat_converts_context_missing_phrase_to_internet_basis() -> None:
    low_context_answer = (
        "[TOM TAT] Khong co du lieu. [CAN CU] Khong co thong tin trong [CONTEXT]. [LUU Y] Can bo sung van ban."
    )
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value=low_context_answer)):
        response = client.post("/api/v1/chat/simple", json={"prompt": "Luat hinh su ra doi nam may"})

    assert response.status_code == 200
    answer = response.json()["answer"].lower()
    assert "nguon internet" in answer


def test_simple_chat_keeps_normal_answer_unchanged() -> None:
    normal_answer = "Dieu 35 Bo luat Lao dong 2019 quy dinh dieu kien don phuong cham dut hop dong."
    with patch("app.services.chat_service.router.generate", new=AsyncMock(return_value=normal_answer)):
        response = client.post("/api/v1/chat/simple", json={"prompt": "Don phuong cham dut hop dong"})

    assert response.status_code == 200
    assert response.json()["answer"] == normal_answer


def test_cloudinary_upload_requires_pdf() -> None:
    files = {"file": ("notes.txt", b"not-a-pdf", "text/plain")}
    response = client.post("/api/v1/cloudinary/upload", files=files)
    assert response.status_code == 400


def test_cloudinary_upload_requires_pdf_mime() -> None:
    files = {"file": ("law.pdf", b"%PDF-1.4\n%%EOF", "application/octet-stream")}
    response = client.post("/api/v1/cloudinary/upload", files=files)
    assert response.status_code == 415


def test_cloudinary_upload_rejects_path_traversal_filename() -> None:
    files = {"file": ("../law.pdf", b"%PDF-1.4\n%%EOF", "application/pdf")}
    response = client.post("/api/v1/cloudinary/upload", files=files)
    assert response.status_code == 400


def test_cloudinary_upload_rejects_invalid_signature() -> None:
    files = {"file": ("law.pdf", b"not-pdf-content", "application/pdf")}
    response = client.post("/api/v1/cloudinary/upload", files=files)
    assert response.status_code == 400


def test_cloudinary_upload_respects_size_limit() -> None:
    old_size = settings.upload_max_file_size_mb
    settings.upload_max_file_size_mb = 1
    try:
        payload = b"%PDF-1.7\n" + (b"x" * (1024 * 1024 + 1)) + b"\n%%EOF"
        files = {"file": ("law.pdf", payload, "application/pdf")}
        response = client.post("/api/v1/cloudinary/upload", files=files)
        assert response.status_code == 413
    finally:
        settings.upload_max_file_size_mb = old_size
