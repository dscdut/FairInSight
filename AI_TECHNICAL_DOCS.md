# FairInsight V2: Advanced Legal AI Architecture

This document outlines the technical implementation of the AI core for FairInsight, focused on high-accuracy Retrieval-Augmented Generation (RAG) and adversarial defense for Vietnamese Law.

## 🚀 Key Architectural Pillars

### 1. Agentic Workflow (LangGraph)
We transitioned from a single-pass LLM call to a **Multi-Agent Orchestration** using LangGraph. The workflow consists of four specialized nodes:
- **Intake Agent**: Classifies user intent, extracts legal domains, and detects potential manipulation attempts.
- **Research Agent**: Performs hybrid search (pgvector + BM25) and utilizes a **Cross-Encoder re-ranker** (`ms-marco-MiniLM-L-6-v2`) to ensure only the top 3 most relevant legal chunks are used.
- **Analyst Agent**: Generates the legal answer using **Few-Shot Prompting** to enforce strict citation standards.
- **Reviewer Agent**: An adversarial node that checks the Analyst's draft for hallucinations or missing citations, forcing up to 2 retry loops if accuracy is insufficient.

### 2. High-Accuracy Retrieval
To achieve 85-95% legal accuracy, we implemented:
- **Hybrid Search**: Combines semantic vector search (via `multilingual-e5-large`) with traditional keyword matching (BM25).
- **Cross-Encoder Filtering**: Solves the "lost-in-the-middle" problem by re-scoring retrieved documents based on actual semantic query-document relevance, dropping irrelevant noise.
- **pgvector Integration**: Native PostgreSQL vector storage for efficient HNSW indexing.

### 3. Production LLM Infrastructure
- **OpenRouter Integration**: Utilizes `ministral-8b` for lightweight tasks (intake/routing) and `mistral-large-2411` for complex legal reasoning.
- **Cost Tracking**: Integrated monitoring of token usage and estimated spend per request.

### 4. Adversarial Defense (Anti-Manipulation)
The system is hardened against "incremental pressure" and "loophole hunting" tactics:
- **Pattern Detection**: Automatically identifies if a user is trying to separate law from ethics or seeking evasion guidance.
- **Hard Refusal**: Triggers a standard refusal template if manipulation confidence exceeds 0.75.
- **Escalation Logic**: Automatically flags complex or high-risk criminal cases for human lawyer review.

## 🛠 Data Ingestion
The system is populated using the `th1nhng0/vietnamese-legal-documents` dataset, processed via a streaming ETL script (`scripts/ingest_legal_dataset.py`) that chunks laws at the article level and generates embeddings.

## 📡 API Layer
Exposed via FastAPI (`/api/v1/chat/invoke`), returning structured responses including:
- `status`: success/escalated/error
- `is_manipulation_attempt`: Boolean flag for security monitoring
- `citations`: Verified legal references linked to source documents
