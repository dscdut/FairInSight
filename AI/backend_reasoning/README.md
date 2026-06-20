# FairInSight — AI Backend (backend_reasoning)

Hệ AI pháp lý tiếng Việt: tra cứu + suy luận trên kho ~4.000 văn bản luật (Hiến pháp,
bộ luật, luật, nghị định, thông tư) đã được vector hóa. Đây là **dịch vụ AI** của
FairInSight, chạy độc lập cổng **8000**, giao tiếp với BE chính (Node) và FE qua HTTP.

## Chat hoạt động thế nào (cho người không chuyên)

Mỗi câu hỏi đi qua 3 bước:

```
[1] Kiểm duyệt & định tuyến  →  [2] Tra cứu / Suy luận  →  [3] Soạn câu trả lời + trích dẫn
```

- **[1] Kiểm duyệt & định tuyến:** AI đọc câu hỏi (kèm vài lượt chat trước) để: chặn nội
  dung phạm pháp (vd *xin cách điều chế ma túy* → từ chối; nhưng *hỏi tội ma túy phạt mấy
  năm* là hợp lệ → cho qua), rồi tự chọn **luồng** phù hợp.
- **[2] Tra cứu / Suy luận:** tìm các Điều/Khoản liên quan trong kho luật (tìm theo nghĩa
  + theo từ khóa, rồi chấm điểm lại để đẩy đúng chủ đề lên đầu), kiểm tra điều luật còn
  hiệu lực hay đã bị sửa/thay thế.
- **[3] Soạn câu trả lời:** viết câu trả lời **chỉ dựa trên** luật tìm được (không bịa),
  kèm phần **Căn cứ** trích dẫn số hiệu văn bản + số Điều.

### Hai luồng chat

| Luồng | Khi nào | Đầu ra |
|-------|---------|--------|
| **Lookup** (tra nhanh) | Hỏi 1 điều cụ thể (vd *Điều 36 Bộ luật Lao động quy định gì?*) | 1 đoạn ngắn gọn + dòng **Căn cứ** |
| **Deep** (suy luận sâu) | Tình huống phức tạp nhiều khía cạnh (vd *bị đuổi việc, nợ lương, đòi quyền lợi sao?*) | AI **mời gộp toàn bộ tình huống** vào 1 lần → phân tích 5 phần: vấn đề · phân tích pháp lý · áp dụng thực tế · hướng xử lý · lưu ý |

AI **tự quyết** chọn luồng. Với luồng deep, lượt đầu AI hỏi xác nhận; người dùng gửi lại
câu mô tả đầy đủ kèm `deep_confirmed=true` thì AI mới chạy phân tích sâu.

## API (2 endpoint, dưới `/api/v1`)

### `POST /api/v1/chat`
```jsonc
// Request
{
  "message": "tội mua bán ma túy phạt mấy năm?",  // bắt buộc
  "session_id": "sess-...",     // bỏ trống = phiên mới
  "user_id": "uuid",            // người dùng đăng nhập; bỏ trống = ẩn danh
  "deep_confirmed": false       // true khi đồng ý phân tích sâu
}
// Response
{
  "session_id": "sess-...",
  "answer": "...(markdown)...",
  "mode": "lookup | deep_reasoning_pending | deep_reasoning | out_of_scope | greeting",
  "confidence": 0.9,
  "risk": "low | medium | high | null",
  "citations": [{ "official_code", "article_no", "clause_no", "quoted_text" }],
  "warnings": []
}
```

### `POST /api/v1/ingest`
```jsonc
// Request — nạp 1 file vào kho luật (chạy nền)
{ "path": "D:/.../file.pdf", "do_embed": true, "allow_ocr": true }
// Response: 202-style { "accepted": true, ... }  ·  404 nếu file không tồn tại
```

## Stack

- FastAPI + Uvicorn · SQLAlchemy 2.0 async + asyncpg + **pgvector**
- LangGraph (điều phối node) · Ollama (chat + embedding) · bge-reranker-v2-m3 (rerank CPU)
- Alembic (migrations) · **uv** (quản lý dependency)

## Cấu trúc

```
backend_reasoning/
├── main.py              # entrypoint uvicorn (đọc PORT từ .env)
├── pyproject.toml       # dependency (uv)
├── .env                 # cấu hình (KHÔNG commit) — xem .env.example
└── src/
    ├── api/             # FastAPI: core (app/db) + v1 (chat, ingest)
    ├── data/            # migrations Alembic (+ raw SQL pgvector/tsv/HNSW)
    ├── schema/          # models (ORM), dto, enums
    ├── workflows/       # LangGraph: chat_graph + nodes (chat/deep) + states
    ├── services/        # llm, embedding, reranker, reasoning, extraction(OCR)
    ├── retrieval/       # hybrid retrieve (vector + keyword RRF + rerank)
    ├── repositories/    # truy vấn DB (chat_repo...)
    └── config/          # settings (đọc .env)
```

## Chạy

```bash
# 1. Cài dependency (lần đầu tải torch + reranker ~vài phút)
uv sync

# 2. Tạo .env từ mẫu, sửa PORT=8000 + trỏ DB POCFAIRINSIGHT + Ollama
cp .env.example .env

# 3. Cập nhật schema (chỉ thêm cột, KHÔNG đụng corpus)
uv run alembic upgrade head

# 4. Chạy (cổng 8000)
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

**Yêu cầu hạ tầng:**
- Postgres `POCFAIRINSIGHT` (đã có corpus + extension `vector`, `pg_trgm`, `unaccent`).
- Ollama: embedding `bge-m3` ở local `:11434`; chat `gemma4` qua tunnel Mac mini `:11500`
  (hoặc bỏ `OLLAMA_CHAT_BASE_URL` để dùng `qwen3:8b` local).
- Lần chat đầu tải model rerank `BAAI/bge-reranker-v2-m3` (~2.3GB) về `~/.cache/huggingface`.

**Log:** chạy `uvicorn` ở terminal sẽ thấy log `[RETRIEVE]` (pool ứng viên), `[RERANK]`
(điểm cross-encoder), `[LAW-BOOST]`, `top_k` đã chọn — tiện theo dõi RAG.
