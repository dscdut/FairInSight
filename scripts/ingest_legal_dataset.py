# scripts/ingest_legal_dataset.py
"""
scripts/ingest_legal_dataset.py

* Downloads the HuggingFace dataset:
  https://huggingface.co/datasets/th1nhng0/vietnamese-legal-documents
* Normalises each document, splits it into article‑level chunks.
* Uses the same embedder class the app already uses (FairInsightEmbedder).
* Inserts documents + chunks into PostgreSQL, creating the vector column
  for pgvector‑based hybrid search.
"""

import os
import json
import logging
import asyncio
from pathlib import Path
from typing import List, Dict

import asyncpg
from tqdm.auto import tqdm
from datasets import load_dataset, Dataset

# ----------------------------------------------------------------------
# 1️⃣  Settings – adjust to your environment
# ----------------------------------------------------------------------
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://fairinsight_user:password@localhost:5432/fairinsight",
)

# The embedder used by the app (same model, same dimensions)
EMBEDDING_MODEL = "intfloat/multilingual-e5-large"
EMBEDDING_DIM = 1024

# ----------------------------------------------------------------------
# 2️⃣  Helper: async DB connection pool
# ----------------------------------------------------------------------
async def get_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(dsn=DB_URL, min_size=1, max_size=5)

# ----------------------------------------------------------------------
# 3️⃣  Embedder (mirrors app.rag.embedder.FairInsightEmbedder)
# ----------------------------------------------------------------------
class SimpleEmbedder:
    """Thin wrapper around SentenceTransformer for async usage."""

    def __init__(self):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(EMBEDDING_MODEL)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        # SentenceTransformer is sync, so we run it in a thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.model.encode, texts, True)

# ----------------------------------------------------------------------
# 4️⃣  Normalise a single HuggingFace record into our internal schema
# ----------------------------------------------------------------------
def normalise_record(record: dict) -> Dict:
    """
    Expected fields in the source record (checked on a few samples):
        - law_id
        - title
        - law_number
        - effective_date
        - expiry_date
        - status
        - domains (list of strings)
        - sections   (list of dicts, each with an `article` and `content`)
    """
    return {
        "law_id": record.get("law_id"),
        "title": record.get("title"),
        "law_number": record.get("law_number"),
        "effective_date": record.get("effective_date"),
        "expiry_date": record.get("expiry_date"),
        "status": record.get("status", "active"),
        "domains": json.dumps(record.get("domains", [])),  # stored as JSONB
        "sections": record.get("sections", []),  # keep raw for chunking
    }

# ----------------------------------------------------------------------
# 5️⃣  Chunking logic – one row per article/section
# ----------------------------------------------------------------------
def create_chunks(document: Dict) -> List[Dict]:
    """Turn each `section` (article) into a separate DB row.
    The `content` field is the raw article text.
    """
    chunks = []
    for sec in document["sections"]:
        article = sec.get("article") or "N/A"
        content = sec.get("content") or ""
        chunks.append(
            {
                "law_id": document["law_id"],
                "article": article,
                "title": document["title"],
                "content": content,
                "law_number": document["law_number"],
                "status": document["status"],
                "effective_date": document["effective_date"],
                "expiry_date": document["expiry_date"],
                "domains": document["domains"],
            }
        )
    return chunks

# ----------------------------------------------------------------------
# 6️⃣  Bulk insertion helpers
# ----------------------------------------------------------------------
INSERT_DOC_SQL = """
INSERT INTO law_documents
(id, title, law_number, status, effective_date, expiry_date, domains)
VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
ON CONFLICT (id) DO NOTHING;
"""

INSERT_CHUNK_SQL = """
INSERT INTO law_chunks
(law_id, article, title, content, law_status_label,
 effective_date, expiry_date, law_domains,
 embedding, tsv)
VALUES
($1, $2, $3, $4,
 COALESCE($5, 'Còn hiệu lực'), $6, $7,
 $8::text[],
 $9::vector({dim}), to_tsvector('simple', $4))
ON CONFLICT DO NOTHING;
""".format(dim=EMBEDDING_DIM)

# ----------------------------------------------------------------------
# 7️⃣  Main ETL routine
# ----------------------------------------------------------------------
async def ingest():
    logging.basicConfig(level=logging.INFO)
    log = logging.getLogger("ingest_legal_dataset")

    # 7.1 Load dataset (streaming mode – never loads whole set into RAM)
    log.info("Downloading HuggingFace dataset...")
    ds: Dataset = load_dataset(
        "th1nhng0/vietnamese-legal-documents",
        split="train",
        streaming=True,
    )

    embedder = SimpleEmbedder()
    pool = await get_pool()

    async with pool.acquire() as conn:
        # Ensure pgvector extension is present (idempotent)
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 7.2 Process records in batches
    batch_size = 256
    docs_batch: List[Dict] = []
    chunks_batch: List[Dict] = []

    async for raw in ds:
        doc = normalise_record(raw)
        docs_batch.append(
            (
                doc["law_id"],
                doc["title"],
                doc["law_number"],
                doc["status"],
                doc["effective_date"],
                doc["expiry_date"],
                doc["domains"],
            )
        )
        # create article chunks for this document
        chunks = create_chunks(doc)
        chunks_batch.extend(chunks)

        # When we hit the batch size, insert and reset
        if len(docs_batch) >= batch_size:
            # 1️⃣ Insert documents
            async with pool.acquire() as conn:
                await conn.executemany(INSERT_DOC_SQL, docs_batch)

            # 2️⃣ Embed chunk contents
            texts = [c["content"] for c in chunks_batch]
            embeddings = await embedder.embed(texts)

            # 3️⃣ Insert chunks with embeddings
            async with pool.acquire() as conn:
                await conn.executemany(
                    INSERT_CHUNK_SQL,
                    [
                        (
                            c["law_id"],
                            c["article"],
                            c["title"],
                            c["content"],
                            c["status"],
                            c["effective_date"],
                            c["expiry_date"],
                            c["domains"],
                            json.dumps(emb.tolist()),
                        )
                        for c, emb in zip(chunks_batch, embeddings)
                    ],
                )
            # Reset batches
            docs_batch.clear()
            chunks_batch.clear()
            log.info(
                "Inserted a batch of %d documents + %d chunks", batch_size, batch_size * 5
            )

    # Insert any remainder left after the loop finishes
    if docs_batch:
        async with pool.acquire() as conn:
            await conn.executemany(INSERT_DOC_SQL, docs_batch)

        texts = [c["content"] for c in chunks_batch]
        embeddings = await embedder.embed(texts)

        async with pool.acquire() as conn:
            await conn.executemany(
                INSERT_CHUNK_SQL,
                [
                    (
                        c["law_id"],
                        c["article"],
                        c["title"],
                        c["content"],
                        c["status"],
                        c["effective_date"],
                        c["expiry_date"],
                        c["domains"],
                        json.dumps(emb.tolist()),
                    )
                    for c, emb in zip(chunks_batch, embeddings)
                ],
            )
        log.info("Final batch inserted (remaining %d docs).", len(docs_batch))

    log.info("✅ All legal documents successfully ingested!")


# ----------------------------------------------------------------------
# 8️⃣  Entry‑point
# ----------------------------------------------------------------------
if __name__ == "__main__":
    asyncio.run(ingest())
