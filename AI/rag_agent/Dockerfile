# FairInSight AI — backend_reasoning (RAG + reasoning legal workflow)
# Reranker (bge-reranker-v2-m3) + Embed (bge-m3) ĐÓNG GÓI SẴN trong image (CPU) →
# container tự chủ embed+rerank, KHÔNG cần Ollama ngoài (EMBED_LOCAL=true).
# Chat LLM gọi RA NGOÀI qua env (9router HTTPS, hoặc Ollama tunnel). Xem .env.example.

FROM python:3.12-slim

# --- hệ thống: build tool + lib cho lxml/pymupdf/torch ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# uv (trình quản gói đang dùng — pyproject + uv.lock)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

# --- cài deps trước (cache layer) — chỉ copy file khai báo, dùng uv.lock cố định ---
COPY pyproject.toml uv.lock README.md ./
# tạo venv + sync đúng lockfile (không cài dev). Gồm sentence-transformers (reranker).
RUN uv venv && uv sync --frozen --no-dev --no-install-project

# --- PRE-DOWNLOAD model vào image (không tải lúc chạy lần đầu), đều CPU ---
ENV HF_HOME=/app/.hf_cache
# Reranker (cross-encoder) — chấm lại sau hybrid RRF.
RUN python -c "from sentence_transformers import CrossEncoder; CrossEncoder('BAAI/bge-reranker-v2-m3', device='cpu')"
# Embed bge-m3 (SentenceTransformer) — đường EMBED_LOCAL=true. Vector 1024d normalize,
# đã verify khớp Ollama bge-m3 (cosine 0.99998) nên không phải re-embed KB cũ.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-m3', device='cpu')"

# --- copy mã nguồn + cài chính project (package src) ---
COPY . .
RUN uv sync --frozen --no-dev

EXPOSE 8000

# chạy uvicorn production (không reload). PORT cố định 8000 cho AI.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
