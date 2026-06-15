# GovDoc Backend (FastAPI + Qdrant)

This folder contains the backend RAG service for GovDoc Intellisense.

## Structure

```text
app/
  main.py
  api/
    routers/
      health.py
      llm.py
      query.py
      chat.py
      documents.py
      cloudinary.py
  services/
    health_service.py
    llm_service.py
    query_service.py
    chat_service.py
    import_service.py
    cloudinary_service.py
  graphs/
    state.py
    import_graph.py
    query_graph.py
  nodes/
    scan.py
    chunk.py
    embed.py
    store.py
    rewrite.py
    search.py
    rerank.py
    generate.py
  db/
    connection.py
  llm/
    router.py
    prompts.py
  utils/
    logger.py
    settings.py
    text_utils.py
    validators.py

tests/
feature_engineering/
```

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### GET `/api/v1/health`
Returns backend and Qdrant health status.

### GET `/api/v1/llm/credentials`
Checks OpenRouter/Groq credentials.

Query params:
- `provider=all|openrouter|groq`

### POST `/api/v1/query`
Runs legal query flow and returns answer + citations.

Request example:

```json
{
  "question": "What are employee unilateral termination rights?",
  "top_k": 5,
  "legal_domain": "lao_dong",
  "is_active_only": true
}
```

### POST `/api/v1/import`
Imports a document into the retrieval index.

Form fields:
- `file` (required)
- `doc_type` (optional, default `luat`)
- `legal_domain` (optional)

### POST `/api/v1/cloudinary/upload`
Securely uploads a PDF to Cloudinary using backend-side signature.

Form fields:
- `file` (required, PDF)

Response includes:
- `secure_url`
- `pages`
- `original_filename`
- `public_id`
- `preview_image_url` (first-page image for fast preview)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |
| `GROQ_API_KEY` | No | Groq fallback API key |
| `GROQ_MODEL` | No | Default: `llama-3.3-70b-versatile` |
| `OPENROUTER_MODEL` | No | Default: `google/gemini-2.5-flash-lite` |
| `LLM_MAX_TOKENS` | No | Default: `1024` |
| `LLM_SYSTEM_PROMPT` | No | Default system instruction prepended to each LLM request |
| `LLM_DEFAULT_CONTEXT` | No | Default legal context used when user does not send `[CONTEXT]` |
| `QDRANT_URL` | Yes | Example: `http://127.0.0.1:6333` |
| `QDRANT_API_KEY` | No | Qdrant API key |
| `QDRANT_COLLECTION` | No | Default: `law_chunks` |
| `EMBED_MODEL` | No | Default: `BAAI/bge-m3` |
| `EMBED_DIM` | No | Default: `1024` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret (backend only) |
| `UPLOAD_MAX_FILE_SIZE_MB` | No | Default: `15` |
| `LOG_LEVEL` | No | Default: `INFO` |

## Run Locally

```bash
# Start Qdrant first
cd ../Data
docker compose up -d

# Start backend
cd ../Backend
/Users/anhnon/my_virtualenvs/govdoc/bin/python -m uvicorn app.main:app --reload --port 8000
```

Swagger docs:
- `http://localhost:8000/docs`

## Run Tests

```bash
/Users/anhnon/my_virtualenvs/govdoc/bin/python -m pytest tests -v
```

## Sync Runtime Requirements

Runtime Docker dependencies are generated from `pyproject.toml`.

```bash
cd Backend
make sync-runtime-requirements
```

To verify sync state (useful in CI):

```bash
cd Backend
make check-runtime-requirements
```
