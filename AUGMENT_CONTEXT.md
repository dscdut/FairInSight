# AUGMENT_CONTEXT.md — FairInsight V2 Complete Project Context

> **Purpose**: This single file gives Augment (or any AI coding assistant) everything it needs to understand, set up, and implement the entire FairInsight V2 Legal AI platform from scratch. Read this file FIRST before touching any code.

---

## 1. PROJECT OVERVIEW

**FairInsight** is a Vietnamese Legal AI platform that provides zero-hallucination legal consultation. It is a multi-agent system built on LangGraph that retrieves Vietnamese law from a pgvector-backed database and generates grounded, cited legal analysis via Mistral LLMs through OpenRouter.

**Origin**: This project is a ground-up refactor of `https://github.com/kietoichoiDXD/legal-ai-agent.git` — a monolithic Anthropic-based chatbot. We are replacing its entire stack while keeping its database schema insights and PDF parser.

**Team**: PM (Quỳnh), Backend (Ánh), Frontend (Sơn), BA (Phúc), AI (Toàn).

**Language**: Backend is 100% Python. All legal content is Vietnamese. All system prompts are Vietnamese. This file is in English for AI assistant consumption.

---

## 2. TECH STACK (FINAL — DO NOT DEVIATE)

| Layer | Technology | Why |
|-------|-----------|-----|
| **Language** | Python 3.13 | Latest async features, pattern matching |
| **Agent Framework** | LangGraph 0.2.60 | StateGraph with conditional edges, self-correction loops |
| **LLM (Routing/Intake/Review)** | mistralai/ministral-8b via OpenRouter | Fast, cheap ($0.0003/query) for intent classification, NER, review grading |
| **LLM (Reasoning/Analysis)** | mistralai/mistral-large-2411 via OpenRouter | Deep legal reasoning for analyst responses ($0.006/query) |
| **Embedding** | intfloat/multilingual-e5-large (1024-dim, local) | Vietnamese-capable, no API cost |
| **Re-ranker** | itdainb/PhoRanker (CrossEncoder, local) | Vietnamese-specific re-ranking, +10-15% retrieval accuracy |
| **Vector DB** | PostgreSQL 15+ with pgvector (HNSW) | 99% recall, metadata pre-filtering in SQL WHERE |
| **Cache/Session** | Redis 7+ with hiredis | Session memory (TTL=3600), semantic cache, incognito wipe |
| **DB Driver** | asyncpg (NOT psycopg2) | Fully async, connection pooling |
| **HTTP Client** | httpx (NOT requests) | Async, streaming support for OpenRouter |
| **Config** | pydantic-settings v2 | Typed env vars, validation, .env file support |
| **Logging** | structlog | Structured JSON logging, no print() statements |
| **Testing** | pytest + pytest-asyncio (auto mode) | Async-first testing |
| **Linting** | ruff (replaces black + flake8 + isort) | Single fast tool |
| **Frontend** | Next.js 14 (SEPARATE REPO) | Fully decoupled — backend is pure REST/WebSocket API |

### BANNED TECHNOLOGIES (DO NOT USE)
- `anthropic` SDK — removed entirely, we use OpenRouter
- `psycopg2` / `psycopg2-binary` — replaced by asyncpg
- `requests` — replaced by httpx
- `black` / `flake8` — replaced by ruff
- `print()` — replaced by structlog
- Supabase client — replaced by direct asyncpg
- Fernet encryption — removed
- Static HTML serving — frontend is decoupled

---

## 3. ARCHITECTURE

### 3.1 LangGraph Agent Topology (with Self-Correction Loop)

```
START
  │
  ▼
┌───────────────┐
│ SECURITY_GATE │  NLP middleware — detect "lách luật", jailbreak, adversarial intent
└──────┬────────┘
       │ (is_adversarial? → skip to ESCALATION)
       ▼
┌─────────┐
│ INTAKE  │  ministral-8b (OpenRouter) — intent + NER + domain + query expansion
└────┬────┘
     │ (confidence > 0.5?)
     ▼
┌──────────┐
│ RESEARCH │  Hybrid RAG: pgvector HNSW + BM25 → top-15 → CrossEncoder → top-3
│          │  + Temporal filter: effective_date <= CURRENT_DATE (prevents time-travel)
└────┬─────┘
     │
     ▼
┌───────────────┐
│ DYNAMIC_ROUTER│  confidence == 0 → ESCALATION
│               │  confidence >= 0.85 → FAST_ANALYST (skip review)
│               │  0 < conf < 0.85 → STANDARD_ANALYST (with review loop)
└────┬──────────┘
     │
     ▼
┌──────────┐ ◄──────┐
│ ANALYST  │        │ retry with structured feedback from Reviewer
└────┬─────┘        │
     │              │
     ▼              │
┌──────────┐        │
│ REVIEWER │ ───────┘  grade=FAIL AND retry_count < 2
└────┬─────┘           (uses ministral-8b for LLM-grading + regex checks)
     │ (grade=PASS OR retries exhausted)
     ▼
┌──────────────┐
│ ORCHESTRATOR │  format response, privacy gating, escalation to lawyer
└────┬─────────┘
     │
     ▼
    END

Side path:
  ESCALATION_NODE ← triggered by Security_Gate, zero-confidence, or max retries
  → Generates case_summary + "Please contact a real lawyer" message
```

### 3.2 Key Design Decisions

1. **Metadata pre-filter at SQL level**: WHERE clause runs BEFORE vector scan. Never filter 100K chunks in application code.
2. **HNSW over ivfflat**: 99% recall vs 90%. Supports online inserts without re-training.
3. **Cross-Encoder re-ranking**: PhoRanker scores (query, chunk) pairs with full attention. Retrieve 20, re-rank to 3.
4. **Deterministic Reviewer (not LLM-as-judge)**: 4 regex checks in <1ms, 99% reliable. LLM-as-judge hallucinates 5% of the time.
5. **Two-tier LLM**: ministral-8b for cheap routing, mistral-large for expensive reasoning.
6. **Incognito mode**: TTL=0 in Redis, skip DB writes entirely. Privacy-first.
7. **Self-correction loop max_retries=2**: Most hallucinations clear on retry 1. 3+ retries means the context genuinely doesn't support the query.

### 3.3 Retrieval Pipeline Detail

```
User Query (Vietnamese)
  │
  ▼
embed_query("query: " + query)              # intfloat/multilingual-e5-large, 1024-dim
  │
  ▼
SQL: search_law_chunks_fairinsight(          # PostgreSQL function
  p_query_embedding => $1::vector,
  p_query_text => $2,                        # for BM25 tsvector
  p_status => 'active',                      # metadata pre-filter
  p_domains => ARRAY['lao_dong'],            # domain pre-filter
  p_incident_date => '2024-01-15',           # inter-temporal filter
  p_semantic_weight => 0.65,                 # hybrid fusion weights
  p_keyword_weight => 0.35,
  p_limit => 20                              # broad recall
)
  │
  ▼
rerank_contexts(                             # CrossEncoder: itdainb/PhoRanker
  query=query,
  candidates=top_20,
  top_n=3                                    # precision cut
)
  │
  ▼
Top-3 RetrievedContext objects               # with rerank_score, law_code, article, content
```

### 3.4 Critical Temporal Filter (Anti-Hallucination)

The SQL CTE MUST enforce: `law_status = 'Còn hiệu lực' AND effective_date <= CURRENT_DATE`.
This mathematically prevents time-travel hallucinations (citing future laws like the AI pháp luật system did with "Luật số 88/2025/QH15 có hiệu lực từ 01/07/2025").

---

## 3A. BUSINESS CONTEXT (From Google Drive Use Cases)

**Source**: Google Drive folder `FairInsight/2. BA Docs/` — `Use Case Specifications.docx` and `UserStory.docx`

### Core Use Cases That Drive AI Architecture

**UC-14: Phân tích vụ việc pháp lý (Legal Case Analysis)** — PRIORITY: EXTREMELY HIGH (MVP Core)
- User fills a structured "Legal Consultation Form" with: title, domain, role (plaintiff/defendant), timeline, request, evidence
- System AI classifies domain, runs RAG pipeline, generates 3-part minimum response: legal basis (Điều luật), risk assessment, recommended actions
- System ALSO queries `SELECT * FROM Lawyers WHERE Domain_ID = X AND Rating >= 4.0 LIMIT 3` for lawyer suggestions
- Business rule BR-17.3: Form must be ≥70% filled before AI activation
- Business rule BR-17.4: Response MUST include: (1) Cơ sở pháp lý, (2) Nhận định rủi ro, (3) Khuyến nghị hành động
- NFR: AI must respond within 15 seconds
- Alt flow: If confidence too low → display "Nội dung không mang yếu tố pháp lý rõ ràng"
- Alt flow: After analysis → user can "Chat tiếp với AI" (UC-18) with full context injected

**UC-19: Chat AI pháp luật (Legal AI Chat)** — PRIORITY: HIGH (Core Feature)
- Real-time streaming chat with typing effect (SSE/WebSocket)
- RAG pipeline: embed query → vector DB search → top-K chunks → prompt assembly → LLM stream
- Context window: max 5 recent Q&A pairs per session (token optimization)
- Business rule BR-23.1: EVERY response must include disclaimer: "Thông tin chỉ mang tính chất tham khảo"
- Business rule BR-23.2: Max question length 2000 chars
- Business rule BR-23.3: Only last 5 Q&A pairs sent as context to LLM
- Exception: NLP middleware detects prompt injection → HTTP 400 "Vi phạm tiêu chuẩn cộng đồng"
- Exception: LLM timeout/rate limit → HTTP 503 + refund AI_Credit
- NFR: Response time <5 seconds for short questions

**UC-20: Chọn lĩnh vực pháp luật (Domain Selection/Filtering)** — PRIORITY: HIGH
- User selects legal domain BEFORE chatting: Dân sự, Hình sự, Hôn nhân, Đất đai, Lao động, Doanh nghiệp
- If "Tất cả" selected → AI auto-classifies using routing model (ministral-8b)
- Domain selection updates System Prompt and narrows RAG search scope
- Business rule BR-24.3: When switching domains mid-chat, CLEAR old domain context from LLM prompt to prevent hallucination contamination

**UC-24: Gửi yêu cầu liên hệ luật sư (Lawyer Contact Request)** — PRIORITY: HIGH
- This is the ESCALATION endpoint — when AI cannot handle a case, user is guided here
- Creates `Consulting_Requests` record with Status='Pending'
- Notification sent to matched lawyer
- Business rule BR-29.1: Max 3 requests per lawyer per 24h (anti-spam)
- Business rule BR-29.2: Pending requests auto-expire after 48h

### BPMN Flow (From Google Drive AI Docs)

The team's BPMN diagram shows a 14-step AI pipeline:
1. Intake & Context Injection (System Time + Chat History)
2. Classification (intent + domain)
3. Safety Gate (risk screening)
4. Case Framing (extract: subjects, behaviors, timestamps)
5. Missing Facts Check (ask user to clarify if needed)
6. RAG Agent Subgraph (retrieve legal data)
7. Sufficiency Check (enough laws found?)
8. Legal Expansion (refine query, follow graph relationships)
9. Reasoning Router (civil/criminal/temporal analysis paths)
10. Citation Verification (anti-hallucination check)
11. Risk & Confidence scoring
12. Lawyer referral (if risk high / confidence low)
13. Final Answer Generation (format: Basis → Analysis → Advice)
14. Log & Token Usage tracking

### User Types & Permissions
- **User (normal)**: Can use AI chat, legal analysis, document drafting, view lawyers
- **Lawyer**: Can receive consultation requests, chat with clients, manage cases
- **Admin**: Can manage users, laws, templates, reports, permissions (RBAC)

### Dataset: th1nhng0/vietnamese-legal-documents (HuggingFace)
- **153,000 documents** from vbpl.vn (official Vietnamese government legal portal)
- 3 subsets: `metadata` (153K), `relationships` (citation graph), `content` (149K HTML)
- License: CC BY 4.0
- Load: `load_dataset("th1nhng0/vietnamese-legal-documents", "content", split="data")`
- ETL: HTML → BeautifulSoup text extraction → Article-level chunking → multilingual-e5-large embeddings → pgvector HNSW index

---

## 4. DIRECTORY STRUCTURE

```
fairinsight-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                              # FastAPI app factory, lifespan
│   ├── core/
│   │   ├── config.py                        # ✅ Pydantic Settings v2 (DB, Redis, LLM, RAG, Auth)
│   │   └── security.py                      # TODO: JWT verification, RBAC middleware
│   ├── agents/
│   │   ├── state.py                         # ✅ LegalAIState TypedDict + frozen dataclasses
│   │   ├── orchestrator.py                  # ✅ LangGraph StateGraph builder + self-correction loop
│   │   ├── escalation_logic.py              # ✅ Human-in-the-loop escalation decisions
│   │   └── nodes/
│   │       ├── intake_agent.py              # ✅ ministral-8b intent classification (OpenRouter)
│   │       ├── research_agent.py            # ✅ Hybrid RAG retrieval node
│   │       ├── analyst_agent.py             # ✅ Mistral-Large reasoning + retry support
│   │       ├── reviewer_agent.py            # ✅ Deterministic hallucination checker (4 regex checks)
│   │       └── orchestrator_agent.py        # ✅ Final formatting, privacy, escalation
│   ├── prompts/
│   │   ├── intake_prompt.py                 # ✅ ministral-8b system prompt (JSON output)
│   │   ├── research_prompt.py               # ✅ Query optimization prompt
│   │   ├── analyst_prompt.py                # ✅ Few-shot legal reasoning prompt + retry injection
│   │   └── defense_guardrails.py            # ✅ Anti-manipulation detection (6 patterns)
│   ├── rag/
│   │   ├── hybrid_search.py                 # ✅ pgvector + BM25 + Redis cache
│   │   └── reranker.py                      # ✅ CrossEncoder PhoRanker re-ranking
│   ├── llm/
│   │   └── openrouter_client.py             # ✅ Async httpx client for OpenRouter
│   ├── db/
│   │   ├── postgres.py                      # TODO: asyncpg pool, get_pool(), health check
│   │   └── repositories/                    # TODO: chat_sessions, law_chunks, escalation_tickets
│   ├── memory/
│   │   ├── redis_store.py                   # TODO: get_redis(), session encode/decode, incognito wipe
│   │   └── incognito.py                     # TODO: TTL=0 wipe logic
│   └── api/
│       └── v1/
│           ├── endpoints/
│           │   ├── chat.py                  # TODO: POST /v1/chat/ask + WebSocket /v1/chat/stream
│           │   └── health.py               # TODO: GET /v1/health (DB, Redis, LLM, Embedding, Reranker)
│           └── schemas/
│               └── chat.py                  # TODO: Pydantic request/response models
├── db/
│   └── migrations/
│       └── 001_fairinsight_schema.sql       # ✅ Full schema (law_documents, law_chunks, chat_sessions, etc.)
├── scripts/
│   └── etl_pipeline.py                      # ✅ Dataset download + HTML extraction + semantic chunking
├── tests/
│   ├── unit/                                # TODO
│   ├── integration/                         # TODO
│   └── conftest.py                          # TODO
├── pyproject.toml                           # ✅ All deps pinned
├── requirements.txt                         # ✅ Flat pinned list for Docker
├── .env.example                             # TODO
├── Dockerfile                               # TODO
├── docker-compose.yml                       # TODO
└── AUGMENT_CONTEXT.md                       # THIS FILE
```

**Legend**: ✅ = Written and ready, TODO = Needs implementation.

---

## 5. ENVIRONMENT VARIABLES

Create a `.env` file in the project root:

```bash
# ─── App ───
APP_NAME=FairInsight
APP_ENV=development
APP_DEBUG=true
APP_LOG_LEVEL=INFO

# ─── PostgreSQL ───
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fairinsight
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_POOL_MIN_SIZE=5
DB_POOL_MAX_SIZE=20
DB_EMBEDDING_DIM=1024

# ─── Redis ───
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_SESSION_TTL=3600
REDIS_INCOGNITO_TTL=0
REDIS_CACHE_TTL=3600

# ─── LLM (OpenRouter) ───
LLM_OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE
LLM_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
LLM_ROUTER_MODEL=mistralai/ministral-8b
LLM_ANALYST_MODEL=mistralai/mistral-large-2411
LLM_TEMPERATURE_ROUTER=0.0
LLM_TEMPERATURE_ANALYST=0.1

# ─── RAG ───
RAG_EMBEDDING_MODEL=intfloat/multilingual-e5-large
RAG_SEMANTIC_WEIGHT=0.65
RAG_KEYWORD_WEIGHT=0.35
RAG_CANDIDATE_COUNT=20
RAG_FINAL_CONTEXT_COUNT=3
RAG_HNSW_EF_SEARCH=40
RERANKER_MODEL=itdainb/PhoRanker

# ─── Auth ───
AUTH_JWT_SECRET=your_jwt_secret_here
AUTH_JWT_ALGORITHM=HS256
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### OpenRouter API Key Setup
1. Go to https://openrouter.ai/keys
2. Create a key
3. **Important**: Edit the key and add allowed hosts: `http://localhost:8000`, `https://fairinsight.ai`
4. Set `LLM_OPENROUTER_API_KEY` in `.env`

---

## 6. SETUP INSTRUCTIONS (Step by Step)

### 6.1 Prerequisites
```bash
# Python 3.13+
python3 --version  # Must be 3.13+

# Docker (for PostgreSQL + Redis)
docker --version

# GPU (optional, for faster embedding + re-ranking)
nvidia-smi  # Should show GPU if available
```

### 6.2 Project Setup
```bash
# Clone repo
git clone <your-repo-url>
cd fairinsight-backend

# Create virtual environment
python3.13 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"
# OR
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your credentials
```

### 6.3 Infrastructure
```bash
# Start PostgreSQL + Redis via Docker
docker compose up -d postgres redis

# OR manually:
docker run -d --name fairinsight-postgres \
  -e POSTGRES_DB=fairinsight \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  pgvector/pgvector:pg16

docker run -d --name fairinsight-redis \
  -p 6379:6379 \
  redis:7-alpine

# Run database migrations
psql -h localhost -U postgres -d fairinsight -f db/migrations/001_fairinsight_schema.sql

# Verify pgvector
psql -h localhost -U postgres -d fairinsight -c "SELECT extversion FROM pg_extension WHERE extname='vector';"
# Should return: 0.7.0 or higher
```

### 6.4 Data Pipeline
```bash
# Download Vietnamese legal datasets from HuggingFace
python scripts/etl_pipeline.py download

# Extract text from HTML content
python scripts/etl_pipeline.py extract

# Create article-level chunks
python scripts/etl_pipeline.py chunk

# Generate embeddings and load into PostgreSQL
python scripts/etl_pipeline.py embed-and-load

# Verify
psql -h localhost -U postgres -d fairinsight -c "SELECT COUNT(*) FROM law_chunks;"
# Should return 100K+ rows
```

### 6.5 Verify OpenRouter Connection
```bash
# Quick test with curl
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $LLM_OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistralai/ministral-8b","messages":[{"role":"user","content":"Hi"}],"max_tokens":50}'
# Should return JSON with choices[0].message.content

# If you get "Host not in allowlist" → go to https://openrouter.ai/keys → Edit key → Add allowed hosts
```

### 6.6 Run the Application
```bash
# Development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Test health endpoint
curl http://localhost:8000/v1/health

# Test chat endpoint
curl -X POST http://localhost:8000/v1/chat/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Công ty quỵt lương 3 tháng, làm sao?", "company_id": "default"}'
```

---

## 7. KEY FILES REFERENCE

### 7.1 State Definition (`app/agents/state.py`)

The `LegalAIState` TypedDict is the single source of truth passed through the LangGraph. Every agent reads from it and returns a dict of updates that LangGraph merges back.

Key types:
- `LegalDomain` enum: lao_dong, dan_su, hinh_su, doanh_nghiep, thuong_mai, dat_dai, thue, bhxh, other
- `IntentType` enum: legal_question, contract_review, document_draft, compliance_check, inter_temporal, unknown
- `RetrievedContext` frozen dataclass: law_id, law_chunk_id, law_number, article, clause, content, law_status, effective_date, semantic_score, keyword_score, combined_score, rerank_score
- `Citation` frozen dataclass: law_number, article, clause, point, is_correct

State sections: INPUT → INTAKE_OUTPUT → RESEARCH_OUTPUT → ANALYST_OUTPUT → REVIEWER_OUTPUT → ORCHESTRATOR_OUTPUT → METADATA

### 7.2 Orchestrator (`app/agents/orchestrator.py`)

This is the LangGraph graph builder. It defines:
- 5 nodes: intake, research, analyst, reviewer, orchestrator
- 4 conditional edges (quality gates)
- 1 self-correction loop: analyst → reviewer → (retry or continue)
- MAX_ANALYST_RETRIES = 2

Entry point: `build_compiled_workflow()` returns a compiled graph. Call `graph.ainvoke(state)` for batch or `graph.astream(state)` for streaming.

### 7.3 Analyst Prompt (`app/prompts/analyst_prompt.py`)

Contains:
- `ANALYST_SYSTEM_PROMPT_BASE`: Full system prompt with 4 absolute rules, 6-part response structure, and 2 few-shot examples (normal case + empty context case)
- `ANALYST_RETRY_PROMPT_ADDITION`: Injected when Reviewer rejects a draft. Contains structured feedback from the Reviewer.
- `build_analyst_system_prompt(retrieved_contexts, retry_feedback)`: Builder function that formats contexts and optionally appends retry feedback.

### 7.4 Reviewer Agent (`app/agents/nodes/reviewer_agent.py`)

Deterministic (no LLM) hallucination checker. 4 checks:
1. **Citation presence**: regex for `Điều \d+` pattern
2. **Law code presence**: regex for BLLĐ, BLDS, Luật, Nghị định, Thông tư
3. **Grounding check**: set intersection — every cited Điều must exist in retrieved_contexts
4. **Substantive length**: draft must be >= 150 characters

If any check fails → returns `review_passed=False` with structured Vietnamese feedback for the Analyst retry.

### 7.5 Schema (`db/migrations/001_fairinsight_schema.sql`)

Key tables:
- `law_documents`: law_code, title, issuer, effective_date, expiry_date, law_status, domains
- `law_chunks`: chunk of legal text with `embedding vector(1024)`, article, clause, law_status (denormalized), tsvector for BM25
- `chat_sessions`: session_id, company_id, user_id, incognito flag
- `chat_messages`: message history per session
- `llm_usage`: token/cost tracking per LLM call

Key indexes:
- HNSW on `law_chunks.embedding` (m=16, ef_construction=64)
- Composite on `(law_status, effective_date)` for metadata pre-filter
- tsvector index on `law_chunks.tsv` for BM25 keyword search

Key function: `search_law_chunks_fairinsight()` — the single SQL function that does metadata pre-filter + hybrid search in one call.

---

## 8. ANTI-HALLUCINATION ARCHITECTURE (3 Layers)

### Layer 1: Retrieval Accuracy
- Metadata pre-filter at SQL level (only active laws)
- Hybrid search: 65% semantic + 35% keyword
- Cross-Encoder re-ranking (PhoRanker) → top-3 precision chunks
- **Result**: LLM only sees the 3 most relevant, verified legal texts

### Layer 2: Prompt Engineering
- Few-shot examples showing exact citation format: "Theo Điều X, Khoản Y của [Tên Luật]"
- Absolute rule: "TUYỆT ĐỐI KHÔNG dùng kiến thức riêng về luật Việt Nam"
- Empty context protocol: "If no context, say so and recommend a lawyer"
- **Result**: LLM is constrained to only use retrieved context

### Layer 3: Self-Correction Loop
- Reviewer checks every cited Điều against retrieved_contexts (set membership)
- If hallucination detected → structured feedback → Analyst rewrites
- Max 2 retries → graceful degradation with low-confidence warning
- **Result**: Hallucinated citations are caught and removed before user sees them

### Layer 4: Anti-Manipulation Defense
- 6 manipulation patterns detected: evasion_seeking, detection_dependency, loophole_hunting, authority_challenge, incremental_pressure, morality_separation
- Vietnamese keyword matching on user queries
- Escalation to human lawyer after 3+ manipulation attempts
- **Result**: AI cannot be "led" into providing legal evasion advice

---

## 9. DATASETS

### Primary (for RAG knowledge base):
- **th1nhng0/vietnamese-legal-documents** on HuggingFace
  - 153,000 documents from vbpl.vn (official government portal)
  - 3 subsets: metadata, relationships (citation graph), content (HTML)
  - License: CC BY 4.0 (commercial use OK)
  - Load: `load_dataset("th1nhng0/vietnamese-legal-documents", "content")`

### For Fine-tuning (optional):
- **luanngo/Vietnamese-Legal-Chat-Dataset**: 5K QA pairs in ShareGPT format
- **VLSP2025-LegalSML/legal-pretrain**: 10K+ laws for domain pre-training

### For Evaluation:
- **nqdhocai/vietnamese-legal-qa**: 2K+ MCQ for accuracy benchmarking

---

## 10. API ENDPOINTS (TO IMPLEMENT)

### REST
```
POST   /v1/chat/ask          # Synchronous legal query → full response
GET    /v1/health             # Health check (DB, Redis, LLM, Embedding, Reranker)
GET    /v1/chat/sessions      # List user's sessions
DELETE /v1/chat/sessions/:id  # Delete session (incognito wipe)
```

### WebSocket
```
WS     /v1/chat/stream        # Streaming legal query → chunked response
```

### Request Schema (POST /v1/chat/ask):
```json
{
  "query": "Công ty quỵt lương 3 tháng, làm sao?",
  "company_id": "default",
  "session_id": "optional-uuid",
  "incognito_mode": false,
  "incident_date": "2024-01-15"
}
```

### Response Schema:
```json
{
  "session_id": "uuid",
  "response": "### 1. Trả lời trực tiếp\n...",
  "confidence": "high",
  "sources": [
    {"law_code": "BLLĐ 2019", "article": "Điều 97", "relevance": 0.92}
  ],
  "escalated": false,
  "latency_ms": 1850,
  "cost_usd": 0.007
}
```

---

## 11. IMPLEMENTATION PRIORITIES (TODO LIST)

### Priority 1 — Infrastructure (must exist before agents can run)
```
[ ] app/db/postgres.py          — asyncpg pool, get_pool(), connection lifecycle
[ ] app/memory/redis_store.py   — get_redis(), session CRUD, incognito wipe
[ ] .env.example                — template with all env vars documented
[ ] docker-compose.yml          — postgres (pgvector), redis, app services
```

### Priority 2 — API Layer (expose agents to frontend)
```
[ ] app/main.py                 — FastAPI app factory, lifespan (init pool, redis, compile graph)
[ ] app/api/v1/schemas/chat.py  — Pydantic request/response models
[ ] app/api/v1/endpoints/chat.py — POST /v1/chat/ask, WS /v1/chat/stream
[ ] app/api/v1/endpoints/health.py — comprehensive health check
[ ] app/core/security.py        — JWT middleware, extract user_id/company_id
```

### Priority 3 — Testing
```
[ ] tests/conftest.py           — fixtures: mock DB pool, mock Redis, mock OpenRouter
[ ] tests/unit/test_reviewer.py — test all 4 deterministic checks
[ ] tests/unit/test_reranker.py — test PhoRanker scoring
[ ] tests/unit/test_defense.py  — test manipulation pattern detection
[ ] tests/integration/test_e2e.py — full pipeline: query → response
```

### Priority 4 — Deployment
```
[ ] Dockerfile                  — multi-stage build, slim image
[ ] docker-compose.yml          — full stack (app, postgres, redis)
[ ] scripts/seed_test_data.py   — seed 100 law chunks for dev/test
```

---

## 12. CODING STANDARDS

### Python Style
- Python 3.13, use `from __future__ import annotations` in every file
- Type hints everywhere: `def func(query: str, limit: int = 10) -> list[dict]:`
- Use `str | None` not `Optional[str]`
- Async-first: all I/O functions must be `async def`
- No bare `except:` — always catch specific exceptions
- Use `structlog` for logging, never `print()`

### Import Order (enforced by ruff)
1. stdlib
2. third-party
3. local (`app.*`)

### Naming
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- State fields: `snake_case` (TypedDict keys)

### Error Handling Pattern
```python
try:
    result = await some_async_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}", exc_info=True)
    state = add_error(state, "agent_name", str(e))
    return {"errors": state["errors"], "fallback_field": default_value}
```

### Agent Node Pattern
Every LangGraph node follows this exact signature:
```python
async def node_name(state: LegalAIState) -> dict:
    """One-line description."""
    # 1. Read from state
    query = state["query"]
    # 2. Do work
    result = await do_something(query)
    # 3. Return state updates (dict, not full state)
    return {"field_to_update": result, "latency_ms": elapsed}
```

---

## 13. RED FLAGS (NEVER DO THESE)

1. **Never import `anthropic`** — we use OpenRouter/Mistral exclusively
2. **Never use `psycopg2`** — we use asyncpg
3. **Never use `print()`** — we use structlog
4. **Never filter retrieved contexts in application code** — always pre-filter in SQL WHERE
5. **Never hardcode model names** — always read from `settings.llm.*`
6. **Never log PII in production** — hash queries, null user_id in incognito
7. **Never skip the Reviewer node** — every Analyst response MUST be reviewed
8. **Never serve static files** — frontend is a separate Next.js app
9. **Never use `requests`** — use httpx (async)
10. **Never trust cited Điều numbers from LLM** — always verify against retrieved_contexts

---

## 14. PERFORMANCE TARGETS

| Metric | Target | How |
|--------|--------|-----|
| Cold query latency | < 2000ms | Intake 100ms + Research 500ms + Analyst 1000ms + Orchestrator 100ms |
| Cached query latency | < 500ms | Redis semantic cache hit |
| Retrieval recall | > 99% | HNSW with m=16, ef_construction=64 |
| Retrieval precision (top-3) | > 85% | PhoRanker cross-encoder re-ranking |
| Hallucination rate | < 2% | 3-layer anti-hallucination architecture |
| Overall legal accuracy | 85-90% | Cross-encoder +12%, Reviewer +7%, Few-shot +4% |
| Cost per query | < $0.07 | Router $0.0003 + Analyst $0.006 + retries |
| Monthly cost (1K queries/day) | < $100 | With 35% cache hit rate |

---

## 15. TESTING STRATEGY

### Unit Tests
```python
# test_reviewer.py — test all 4 checks
def test_reviewer_catches_hallucinated_dieu():
    draft = "Theo Điều 999 BLLĐ 2019..."  # Điều 999 doesn't exist
    contexts = [mock_context(article="Điều 97")]
    result = _review_draft(draft, contexts)
    assert not result.passed
    assert "999" in result.ungrounded_citations

def test_reviewer_passes_valid_draft():
    draft = "Theo Điều 97, Khoản 1 của Bộ luật Lao động 2019..."
    contexts = [mock_context(article="Điều 97", law_code="BLLĐ 2019")]
    result = _review_draft(draft, contexts)
    assert result.passed
```

### Integration Tests
```python
# test_e2e.py — full pipeline
async def test_full_workflow():
    state = create_initial_state(query="Công ty quỵt lương 3 tháng")
    graph = await build_compiled_workflow()
    result = await graph.ainvoke(state)
    assert result["final_response"]
    assert "Điều" in result["final_response"]  # Must cite law
    assert result["confidence_level"] in ["high", "medium"]
```

### Adversarial Tests
```python
# test_defense.py — manipulation resistance
def test_detects_evasion_seeking():
    score = detect_manipulation_pattern(
        "Nếu không bị phát hiện thì không vi phạm đúng không?",
        conversation_history=[]
    )
    assert score.has_pattern
    assert score.pattern_type == ManipulationPattern.DETECTION_DEPENDENCY
```

---

## 16. QUICK REFERENCE: FILE → RESPONSIBILITY MAP

| File | What It Does | Depends On |
|------|-------------|-----------|
| `orchestrator.py` | Builds LangGraph, defines edges/loop | All node files |
| `intake_agent.py` | Intent + NER via ministral-8b (OpenRouter) | `intake_prompt.py`, `openrouter_client.py` |
| `research_agent.py` | Calls `hybrid_search()`, returns top-3 | `hybrid_search.py` |
| `analyst_agent.py` | Calls Mistral-Large with few-shot prompt | `analyst_prompt.py`, `openrouter_client.py` |
| `reviewer_agent.py` | 4 regex checks on Analyst draft | State only (no external deps) |
| `orchestrator_agent.py` | Format response, privacy, escalation | `escalation_logic.py` |
| `hybrid_search.py` | pgvector + BM25 + Redis cache → top-20 | `postgres.py`, `redis_store.py` |
| `reranker.py` | CrossEncoder PhoRanker → top-3 | sentence-transformers |
| `openrouter_client.py` | httpx async client for OpenRouter API | httpx |
| `defense_guardrails.py` | Detect 6 manipulation patterns | State only |
| `escalation_logic.py` | Decide when to involve human lawyer | State only |
| `config.py` | All env vars via Pydantic Settings | pydantic-settings |

---

## 17. DOCKER INFRASTRUCTURE (Complete Stack)

### 17.1 docker-compose.yml (Development + Staging)

```yaml
# docker-compose.yml — FairInsight Full Stack
# Usage: docker compose up -d
# All services run locally for development; GCP equivalents noted.

version: "3.9"

services:
  # ════════════════════════════════════════════════════════════
  # APP: FastAPI + LangGraph (→ Cloud Run in production)
  # ════════════════════════════════════════════════════════════
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: fairinsight-api
    ports:
      - "8000:8000"
    env_file: .env
    environment:
      - APP_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=fairinsight
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD:-fairinsight_dev}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./app:/app/app          # Hot reload in dev
      - model-cache:/root/.cache  # Persist downloaded HF models
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ════════════════════════════════════════════════════════════
  # POSTGRES: pgvector for legal embeddings (→ Cloud SQL in prod)
  # ════════════════════════════════════════════════════════════
  postgres:
    image: pgvector/pgvector:pg16
    container_name: fairinsight-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: fairinsight
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-fairinsight_dev}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/migrations:/docker-entrypoint-initdb.d  # Auto-run migrations on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d fairinsight"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    # Performance tuning for legal corpus (100K+ chunks)
    command: >
      postgres
        -c shared_buffers=256MB
        -c effective_cache_size=768MB
        -c work_mem=16MB
        -c maintenance_work_mem=128MB
        -c max_connections=100
        -c random_page_cost=1.1

  # ════════════════════════════════════════════════════════════
  # REDIS: Session + RAG cache (→ Memorystore in prod)
  # ════════════════════════════════════════════════════════════
  redis:
    image: redis:7-alpine
    container_name: fairinsight-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    command: >
      redis-server
        --maxmemory 256mb
        --maxmemory-policy allkeys-lru
        --appendonly yes

  # ════════════════════════════════════════════════════════════
  # PGADMIN: Database management UI (dev only)
  # ════════════════════════════════════════════════════════════
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: fairinsight-pgadmin
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@fairinsight.ai
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - postgres
    profiles: ["dev"]  # Only starts with: docker compose --profile dev up

volumes:
  pgdata:
    driver: local
  redisdata:
    driver: local
  model-cache:
    driver: local
```

### 17.2 Dockerfile (Multi-stage, Cloud Run compatible)

```dockerfile
# ══════════════════════════════════════════════════════════════
# Stage 1: Builder — install Python dependencies
# ══════════════════════════════════════════════════════════════
FROM python:3.13-slim AS builder

WORKDIR /build

# System deps for asyncpg and sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ══════════════════════════════════════════════════════════════
# Stage 2: Runtime — slim production image
# ══════════════════════════════════════════════════════════════
FROM python:3.13-slim

WORKDIR /app

# Runtime system deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8080

# Health check for Docker / Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/v1/health || exit 1

# Uvicorn with 2 workers (Cloud Run provides horizontal scaling)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2", "--log-level", "info"]
```

### 17.3 PostgreSQL Schema (pgvector + HNSW)

The migration `db/migrations/001_fairinsight_schema.sql` runs automatically on first `docker compose up`. Key tables:

```sql
-- Core legal data
CREATE EXTENSION IF NOT EXISTS vector;

-- Law documents (parent)
CREATE TABLE law_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_code VARCHAR(100) UNIQUE NOT NULL,     -- "52/2014/QH13"
    title TEXT NOT NULL,                        -- "Luật Hôn nhân và Gia đình"
    issuer VARCHAR(255),                        -- "Quốc hội"
    law_status VARCHAR(50) DEFAULT 'active',    -- 'active', 'amended', 'expired', 'repealed'
    effective_date DATE,
    expiry_date DATE,
    domains TEXT[] DEFAULT '{}',                -- '{hon_nhan, dan_su}'
    source VARCHAR(100) DEFAULT 'vbpl.vn',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Law chunks (child — vectorized, indexed)
CREATE TABLE law_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_id UUID REFERENCES law_documents(id),
    chunk_id VARCHAR(64) UNIQUE NOT NULL,       -- content hash for dedup
    article VARCHAR(50),                         -- "Điều 5"
    clause VARCHAR(50),                          -- "Khoản 2"
    content TEXT NOT NULL,
    embedding vector(1024),                      -- intfloat/multilingual-e5-large
    -- Denormalized from law_documents (pre-filter without JOIN)
    law_code VARCHAR(100),
    law_status VARCHAR(50),
    effective_date DATE,
    expiry_date DATE,
    domains TEXT[] DEFAULT '{}',
    -- BM25 full-text search
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index: 99% recall, cosine distance
CREATE INDEX idx_law_chunks_hnsw ON law_chunks
    USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);

-- Metadata pre-filter indexes (run BEFORE vector scan)
CREATE INDEX idx_law_chunks_status_date ON law_chunks (law_status, effective_date);
CREATE INDEX idx_law_chunks_domains ON law_chunks USING gin (domains);
CREATE INDEX idx_law_chunks_tsv ON law_chunks USING gin (tsv);

-- Chat & session tables
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    company_id VARCHAR(100) NOT NULL,
    domain_id VARCHAR(50),              -- current legal domain filter
    incognito BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,          -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',        -- citations, confidence, tokens used
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalation tickets (Human-in-the-Loop)
CREATE TABLE escalation_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id),
    user_id UUID,
    reason VARCHAR(50) NOT NULL,        -- 'manipulation', 'low_confidence', 'criminal_case'
    case_summary TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'assigned', 'resolved'
    assigned_lawyer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM usage tracking
CREATE TABLE llm_usage (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    model VARCHAR(100) NOT NULL,
    routing_tier VARCHAR(20),           -- 'router' or 'analyst'
    input_tokens INT,
    output_tokens INT,
    cost_usd NUMERIC(10, 6),
    latency_ms INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 18. COMPLETE AGENT DESIGN SPECIFICATION

This section defines every LangGraph node in detail: inputs, outputs, LLM model used, prompt strategy, error handling, and the exact Python function signature.

### 18.1 Agent Overview Table

| # | Agent Node | LLM Model | Cost/call | Latency | Purpose |
|---|-----------|-----------|-----------|---------|---------|
| 0 | **Security Gate** | None (NLP rules) | $0 | <5ms | Block adversarial/jailbreak queries |
| 1 | **Intake Agent** | ministral-8b | $0.0003 | ~200ms | Intent classify + NER + domain + query expansion |
| 2 | **Research Agent** | None (retrieval) | $0 | ~500ms | Hybrid RAG search + cross-encoder re-rank |
| 3 | **Dynamic Router** | None (logic) | $0 | <1ms | Route based on confidence score |
| 4 | **Analyst Agent** | mistral-large-2411 | $0.006 | ~1200ms | Generate grounded legal analysis |
| 5 | **Reviewer Agent** | ministral-8b | $0.0003 | ~300ms | Grade draft for hallucinations + citation check |
| 6 | **Orchestrator** | None (formatting) | $0 | <50ms | Format response + privacy + disclaimers |
| 7 | **Escalation Node** | ministral-8b | $0.0003 | ~200ms | Generate case summary for lawyer handoff |

### 18.2 Node 0: Security Gate

```python
# app/core/security_guardrails.py

PURPOSE: Pre-computation filter. Runs BEFORE any LLM call.
         Detects adversarial intent and routes to Escalation.

INPUT (from state):
  - query: str                    # raw user message

OUTPUT (state updates):
  - is_adversarial: bool          # True → skip to Escalation
  - security_flags: list[str]     # which patterns matched
  - sanitized_query: str          # cleaned query (XSS stripped)

DETECTION PATTERNS (Vietnamese):
  evasion_keywords = [
      "lách luật", "không bị phát hiện", "trốn thuế",
      "cách trốn", "làm sao để không bị bắt",
      "qua mặt", "quá thời hiệu", "miễn là không bị",
  ]
  jailbreak_patterns = [
      "ignore previous instructions", "bỏ qua system prompt",
      "pretend you are", "giả vờ", "DAN mode",
  ]
  political_patterns = [
      "chống đối", "lật đổ", "phản động",
  ]

LOGIC:
  if any pattern matches → is_adversarial = True
  if is_adversarial → graph routes directly to escalation_node
  else → pass sanitized_query to intake_agent

SIGNATURE:
  async def security_gate_node(state: LegalAIState) -> dict
```

### 18.3 Node 1: Intake Agent (Query Understanding)

```python
# app/agents/nodes/intake_agent.py

PURPOSE: Parse user's natural language into structured search parameters.
         Uses ministral-8b for speed ($0.0003, ~200ms).

MODEL: mistralai/ministral-8b via OpenRouter

INPUT (from state):
  - query: str                    # user's raw question
  - session_domain: str | None    # if user pre-selected a domain (UC-20)

OUTPUT (state updates):
  - intent: IntentType            # legal_question | contract_review | document_draft | ...
  - intent_confidence: float      # 0.0–1.0
  - primary_domain: LegalDomain   # lao_dong | dan_su | hinh_su | ...
  - secondary_domains: list       # other relevant domains
  - extracted_entities: list[ExtractedEntity]
  - search_query: str             # EXPANDED query optimized for RAG
  - search_keywords: list[str]    # formal legal terms for BM25
  - search_filters: dict          # {status: "active", domains: [...], incident_date: ...}
  - intake_latency_ms: int

PROMPT STRATEGY:
  System prompt forces JSON output:
  {
    "intent": "legal_question",
    "intent_confidence": 0.92,
    "primary_domain": "lao_dong",
    "entities": [{"type": "ORGANIZATION", "value": "Công ty ABC"}],
    "search_query": "quyền đơn phương chấm dứt hợp đồng lao động khi bị nợ lương",
    "search_keywords": ["chấm dứt hợp đồng", "nợ lương", "Điều 35 BLLĐ"]
  }

  Key transformation: informal → formal Vietnamese legal terminology
    "quỵt lương" → "không thanh toán lương đúng hạn"
    "đuổi việc" → "đơn phương chấm dứt hợp đồng lao động"

QUALITY GATE (conditional edge after this node):
  if intent_confidence < 0.5 → skip to orchestrator (graceful "please rephrase")
  else → continue to research_agent

SIGNATURE:
  async def intake_node(state: LegalAIState) -> dict
```

### 18.4 Node 2: Research Agent (Active Retrieval)

```python
# app/agents/nodes/research_agent.py

PURPOSE: Execute hybrid RAG search, cross-encoder re-rank, compute confidence.
         NO LLM call — pure retrieval. Cost: $0.

INPUT (from state):
  - search_query: str             # from Intake (expanded)
  - search_keywords: list[str]    # for BM25
  - search_filters: dict          # metadata pre-filter conditions
  - company_id: str               # RBAC tenant filter

OUTPUT (state updates):
  - retrieved_contexts: list[RetrievedContext]  # top-3 after re-rank
  - total_candidates: int         # how many chunks before re-rank
  - agentic_confidence_score: float  # 0.0–1.0 based on re-rank scores
  - retrieval_cache_hit: bool
  - retrieval_latency_ms: int

PIPELINE:
  Step 1: Check Redis semantic cache → if hit, return immediately
  Step 2: Embed query via intfloat/multilingual-e5-large (local, ~100ms)
  Step 3: SQL hybrid search with MANDATORY pre-filter:
          WHERE law_status IN ('active','amended')
          AND effective_date <= CURRENT_DATE
          AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
  Step 4: Retrieve top-15 candidates (pgvector HNSW + BM25 fusion)
  Step 5: Cross-encoder re-rank via itdainb/PhoRanker → keep top-3
  Step 6: Compute agentic_confidence_score:
          if no results → 0.0
          elif top_rerank_score > 0.85 → 0.9 (high confidence)
          elif top_rerank_score > 0.5 → 0.6 (medium)
          else → 0.3 (low)
  Step 7: Cache results in Redis (TTL=3600s)

SIGNATURE:
  async def research_node(state: LegalAIState) -> dict
```

### 18.5 Node 3: Dynamic Router (Conditional Edge)

```python
# Defined inline in app/agents/orchestrator.py as a routing function

PURPOSE: Route based on agentic_confidence_score from Research Agent.
         NOT a node — it's a conditional edge function.

LOGIC:
  def route_after_research(state: LegalAIState) -> str:
      score = state.get("agentic_confidence_score", 0.0)

      if score == 0.0:
          # No laws found → cannot analyze → escalate
          return "escalation"

      if score >= 0.85:
          # Very high confidence → fast path, skip reviewer
          return "fast_analyst"

      # Medium/low confidence → standard path with review loop
      return "analyst"

EDGES:
  "escalation"    → escalation_node
  "fast_analyst"  → analyst_node → orchestrator_node (no reviewer)
  "analyst"       → analyst_node → reviewer_node → (retry or orchestrator)
```

### 18.6 Node 4: Analyst Agent (Legal Reasoning)

```python
# app/agents/nodes/analyst_agent.py

PURPOSE: Generate grounded legal analysis based ONLY on retrieved contexts.
         Uses mistral-large-2411 for deep reasoning ($0.006, ~1200ms).

MODEL: mistralai/mistral-large-2411 via OpenRouter

INPUT (from state):
  - query: str                         # original user question
  - retrieved_contexts: list[RetrievedContext]  # top-3 from re-ranker
  - review_feedback: str | None        # from Reviewer on retry
  - analyst_retry_count: int           # 0=first, 1=retry, 2=last chance

OUTPUT (state updates):
  - initial_reasoning: str             # draft response (Vietnamese markdown)
  - analyst_latency_ms: int
  - model_used: str
  - review_passed: False               # reset for Reviewer
  - review_feedback: ""                # reset for Reviewer

PROMPT STRUCTURE (see app/prompts/analyst_prompt.py):
  ┌──────────────────────────────────────────────────────┐
  │ SYSTEM PROMPT                                         │
  │                                                       │
  │ 4 ABSOLUTE RULES:                                     │
  │  1. ONLY use retrieved_contexts (no own knowledge)    │
  │  2. Every claim MUST cite "Điều X, Khoản Y"          │
  │  3. NEVER fabricate articles                          │
  │  4. NEVER help evade law                              │
  │                                                       │
  │ 6-PART RESPONSE STRUCTURE:                            │
  │  1. Trả lời trực tiếp                                │
  │  2. Cơ sở pháp lý                                    │
  │  3. Phân tích                                         │
  │  4. Rủi ro pháp lý                                    │
  │  5. Hành động đề xuất                                 │
  │  6. Tuyên bố miễn trừ                                 │
  │                                                       │
  │ 2 FEW-SHOT EXAMPLES:                                  │
  │  Example 1: Normal case (wage dispute)                │
  │  Example 2: Empty context (graceful "I don't know")   │
  │                                                       │
  │ <retrieved_contexts>                                   │
  │   [1] BLLĐ 2019 — Điều 97: ...                       │
  │   [2] BLLĐ 2019 — Điều 35, Khoản 2: ...             │
  │   [3] NĐ 145/2020 — Điều 12: ...                     │
  │ </retrieved_contexts>                                  │
  │                                                       │
  │ (If retry) ⚠️ REVIEWER FEEDBACK:                      │
  │   - HALLUCINATION: Điều 999 not in context            │
  │   - Available articles: Điều 97, Điều 35, Điều 12    │
  └──────────────────────────────────────────────────────┘

RETRY BEHAVIOR:
  On retry_count > 0:
    - Temperature reduced: 0.5 → 0.3 (more deterministic)
    - Reviewer feedback injected into system prompt
    - Available articles explicitly listed

SIGNATURE:
  async def analyst_node(state: LegalAIState) -> dict
```

### 18.7 Node 5: Reviewer Agent (Self-Correction Gate)

```python
# app/agents/nodes/reviewer_agent.py

PURPOSE: Verify Analyst's draft for hallucinations and missing citations.
         Uses HYBRID approach: deterministic regex + LLM grading.

MODEL: ministral-8b via OpenRouter (for semantic grading, $0.0003)
       + Regex checks (for structural verification, $0, <1ms)

INPUT (from state):
  - initial_reasoning: str              # Analyst's draft
  - retrieved_contexts: list[RetrievedContext]  # ground truth
  - analyst_retry_count: int

OUTPUT (state updates):
  - review_passed: bool                 # True = proceed, False = retry
  - review_feedback: str                # structured feedback for Analyst
  - analyst_retry_count: int            # incremented if failed
  - corrected_reasoning: str            # = draft if passed

4-STEP VERIFICATION:

  Check 1 — Citation Presence (regex):
    Pattern: r"Điều\s+(\d+[a-z]?)"
    FAIL if zero matches → "Không tìm thấy trích dẫn 'Điều X'"

  Check 2 — Law Code Presence (regex):
    Pattern: BLLĐ | BLDS | BLHS | Luật | Nghị định | Thông tư
    FAIL if zero matches → "Không tìm thấy tên văn bản luật"

  Check 3 — Citation Grounding (set membership):
    Extract all Điều numbers from draft
    Extract all Điều numbers from retrieved_contexts
    ungrounded = draft_articles - context_articles
    FAIL if ungrounded not empty → "HALLUCINATION: Điều {X} không có trong ngữ cảnh"

  Check 4 — Substantive Length:
    FAIL if len(draft) < 150 chars → "Câu trả lời quá ngắn"

  Check 5 — LLM Semantic Grade (ministral-8b):
    Prompt: "Given the context and draft, does the draft accurately represent the law?
             Grade: PASS or FAIL. If FAIL, explain why."
    Only runs if checks 1-4 pass (avoids wasting LLM on obviously bad drafts)

ROUTING LOGIC (conditional edge after this node):
  if review_passed → orchestrator_node
  elif analyst_retry_count >= 2 → orchestrator_node (graceful degradation)
  else → analyst_node (retry with feedback)

SIGNATURE:
  async def reviewer_node(state: LegalAIState) -> dict
```

### 18.8 Node 6: Orchestrator Agent (Final Output)

```python
# app/agents/nodes/orchestrator_agent.py

PURPOSE: Format final response, apply privacy controls, attach disclaimer.
         NO LLM call. Cost: $0, latency: <50ms.

INPUT (from state):
  - corrected_reasoning: str | initial_reasoning: str
  - retrieved_contexts: list[RetrievedContext]
  - confidence_score: float
  - incognito_mode: bool
  - analyst_retry_count: int
  - review_passed: bool
  - errors: list[dict]

OUTPUT (state updates):
  - final_response: str            # user-facing Vietnamese markdown
  - confidence_level: ConfidenceLevel  # HIGH / MEDIUM / LOW
  - should_log_to_db: bool         # False if incognito
  - should_wipe_redis: bool        # True if incognito
  - audit_entry: dict | None
  - total_latency_ms: int

RESPONSE ASSEMBLY:
  1. Pick best available response:
     - corrected_reasoning (review-passed) → confidence HIGH
     - initial_reasoning with review failed + max retries → prepend LOW CONFIDENCE warning
     - No reasoning at all (upstream failed) → degraded "cannot analyze" message

  2. Append source citations:
     "**Nguồn tham khảo:**
      - BLLĐ 2019 — Điều 97 (relevance: 0.92)
      - BLLĐ 2019 — Điều 35 (relevance: 0.87)"

  3. Append mandatory disclaimer (BR-23.1):
     "⚖️ Nội dung này mang tính chất tham khảo pháp luật,
      không thay thế tư vấn pháp lý chính thức."

  4. Privacy gating:
     if incognito → should_log_to_db = False, should_wipe_redis = True

SIGNATURE:
  async def orchestrator_node(state: LegalAIState) -> dict
```

### 18.9 Node 7: Escalation Node (Human-in-the-Loop)

```python
# app/agents/nodes/escalation_node.py

PURPOSE: Generate structured case summary and direct user to real lawyer.
         Triggered by: Security Gate, zero-confidence, max retries, criminal cases.

MODEL: ministral-8b via OpenRouter (for case summary generation, $0.0003)

INPUT (from state):
  - query: str
  - is_adversarial: bool
  - agentic_confidence_score: float
  - primary_domain: LegalDomain
  - extracted_entities: list[ExtractedEntity]
  - errors: list[dict]

OUTPUT (state updates):
  - final_response: str                # escalation message to user
  - should_escalate_to_lawyer: True
  - escalation_reason: str
  - case_summary: str                  # structured summary for lawyer
  - escalation_ticket_id: str          # UUID of created ticket

ESCALATION TRIGGERS & MESSAGES:

  Trigger: is_adversarial = True
  Response: "Hệ thống nhận thấy yêu cầu của bạn không phù hợp với mục đích
             tư vấn pháp lý. Nếu bạn cần hỗ trợ, vui lòng liên hệ luật sư."

  Trigger: agentic_confidence_score == 0.0
  Response: "Dữ liệu pháp luật hiện tại không đủ để phân tích vấn đề của bạn.
             Chúng tôi khuyên bạn nên liên hệ luật sư chuyên môn."

  Trigger: analyst_retry_count >= 2 AND review_passed == False
  Response: "Hệ thống không thể xác minh câu trả lời. Vấn đề này cần được
             luật sư thực thụ phân tích."

  Trigger: primary_domain == "hinh_su" (criminal law)
  Response: "⚠️ Vấn đề hình sự cần luật sư ngay lập tức."

CASE SUMMARY GENERATION (via ministral-8b):
  Prompt: "Summarize this legal query into a structured case brief for a lawyer:
           Query: {query}
           Domain: {domain}
           Entities: {entities}
           Output JSON: {title, domain, key_facts, legal_issues, urgency_level}"

DB ACTION:
  INSERT INTO escalation_tickets (session_id, reason, case_summary, status)
  VALUES ($1, $2, $3, 'pending');

SIGNATURE:
  async def escalation_node(state: LegalAIState) -> dict
```

### 18.10 Complete LangGraph Wiring (orchestrator.py)

```python
# app/agents/orchestrator.py — The Complete Graph

from langgraph.graph import END, START, StateGraph

MAX_ANALYST_RETRIES = 2

def build_legal_ai_graph() -> StateGraph:
    graph = StateGraph(LegalAIState)

    # ─── Register all 7 nodes ───
    graph.add_node("security_gate",   security_gate_node)
    graph.add_node("intake",          intake_node)
    graph.add_node("research",        research_node)
    graph.add_node("analyst",         analyst_node)
    graph.add_node("reviewer",        reviewer_node)
    graph.add_node("orchestrator",    orchestrator_node)
    graph.add_node("escalation",      escalation_node)

    # ─── Edge: START → Security Gate ───
    graph.add_edge(START, "security_gate")

    # ─── Edge: Security Gate → Intake or Escalation ───
    graph.add_conditional_edges("security_gate", route_after_security, {
        "intake": "intake",
        "escalation": "escalation",
    })

    # ─── Edge: Intake → Research or Orchestrator ───
    graph.add_conditional_edges("intake", route_after_intake, {
        "research": "research",
        "orchestrator": "orchestrator",  # low confidence fallback
    })

    # ─── Edge: Research → Dynamic Router ───
    graph.add_conditional_edges("research", route_after_research, {
        "analyst": "analyst",            # standard path (0 < conf < 0.85)
        "fast_analyst": "analyst",       # high confidence (≥0.85) — same node, diff post-route
        "escalation": "escalation",      # zero confidence
    })

    # ─── Edge: Analyst → Reviewer (standard path) ───
    # For fast_analyst path, we skip reviewer:
    graph.add_conditional_edges("analyst", route_after_analyst, {
        "reviewer": "reviewer",          # standard path → review
        "orchestrator": "orchestrator",  # fast path → skip review
    })

    # ─── Edge: Reviewer → Analyst (retry) or Orchestrator (done) ───
    graph.add_conditional_edges("reviewer", route_after_reviewer, {
        "analyst": "analyst",            # retry with feedback
        "orchestrator": "orchestrator",  # passed or max retries
    })

    # ─── Edge: Orchestrator → END ───
    graph.add_edge("orchestrator", END)

    # ─── Edge: Escalation → END ───
    graph.add_edge("escalation", END)

    return graph

# ─── Routing Functions ───

def route_after_security(state):
    return "escalation" if state.get("is_adversarial") else "intake"

def route_after_intake(state):
    return "research" if state.get("intent_confidence", 0) >= 0.5 else "orchestrator"

def route_after_research(state):
    score = state.get("agentic_confidence_score", 0.0)
    if score == 0.0:
        return "escalation"
    if score >= 0.85:
        return "fast_analyst"
    return "analyst"

def route_after_analyst(state):
    # If came from fast_analyst path (high confidence), skip reviewer
    if state.get("agentic_confidence_score", 0) >= 0.85:
        return "orchestrator"
    return "reviewer"

def route_after_reviewer(state):
    if state.get("review_passed"):
        return "orchestrator"
    if state.get("analyst_retry_count", 0) >= MAX_ANALYST_RETRIES:
        return "orchestrator"  # graceful degradation
    return "analyst"  # retry
```

### 18.11 State Fields Summary

All fields in `LegalAIState` TypedDict, grouped by which agent writes them:

```
SECURITY_GATE writes:   is_adversarial, security_flags, sanitized_query
INTAKE writes:          intent, intent_confidence, primary_domain, secondary_domains,
                        extracted_entities, search_query, search_keywords, search_filters
RESEARCH writes:        retrieved_contexts, total_candidates, agentic_confidence_score,
                        retrieval_cache_hit, retrieval_latency_ms
ANALYST writes:         initial_reasoning, analyst_latency_ms, model_used,
                        review_passed (reset), review_feedback (reset)
REVIEWER writes:        review_passed, review_feedback, analyst_retry_count,
                        corrected_reasoning, review_violations, ungrounded_citations
ORCHESTRATOR writes:    final_response, confidence_level, should_log_to_db,
                        should_wipe_redis, audit_entry, total_latency_ms
ESCALATION writes:      final_response, should_escalate_to_lawyer, escalation_reason,
                        case_summary, escalation_ticket_id
```

---

## 18. COMMIT MESSAGE CONVENTION

```
feat(agent): add reviewer self-correction loop
fix(rag): metadata pre-filter not excluding expired laws
refactor(llm): migrate from anthropic to openrouter
docs(context): update AUGMENT_CONTEXT.md with deployment section
test(reviewer): add hallucination detection unit tests
chore(deps): bump langgraph to 0.2.60
```

---

*This file is the single source of truth for FairInsight V2. When in doubt, refer here. When this file conflicts with code comments, this file wins.*
