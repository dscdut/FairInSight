"""
Embed crawled law articles into PostgreSQL (pgvector) using asyncpg.
Run after crawl_laws.py.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

load_dotenv()

import asyncpg

from src.rag.embedder import get_embedder

DATA_DIR = Path(__file__).parent.parent / "data" / "laws"


def _env_int(name: str, fallback: int) -> int:
    value = os.getenv(name)
    if not value:
        return fallback
    try:
        return int(value)
    except ValueError:
        return fallback


def _db_config() -> dict[str, Any]:
    ssl_mode = os.getenv("DB_SSL_MODE", "prefer").lower()
    use_ssl = ssl_mode in {"require", "verify-ca", "verify-full"}

    return {
        "host": os.getenv("DB_HOST") or os.getenv("SUPABASE_DB_HOST", "localhost"),
        "port": _env_int("DB_PORT", _env_int("SUPABASE_DB_PORT", 5432)),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD") or os.getenv("SUPABASE_DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "postgres"),
        "ssl": use_ssl,
    }


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{float(value):.8f}" for value in values) + "]"


async def process_law_file(pool: asyncpg.Pool, filepath: Path) -> None:
    """Process a single law JSON file and insert into PostgreSQL."""
    with open(filepath, "r", encoding="utf-8") as f:
        law_data = json.load(f)

    embedder = get_embedder()

    print(f"\n📜 Processing: {law_data['name']}")

    # 1. Insert law document
    async with pool.acquire() as conn:
        law_id = await conn.fetchval(
            """
            INSERT INTO law_documents (
                title,
                law_number,
                law_type,
                issuer,
                domains,
                status,
                full_text,
                article_count,
                word_count,
                source_url,
                source_site
            )
            VALUES (
                $1,
                $2,
                $3::law_type,
                $4,
                $5::text[],
                'active'::law_status,
                $6,
                $7,
                $8,
                $9,
                'thuvienphapluat'
            )
            RETURNING id
            """,
            law_data["name"],
            law_data["number"],
            law_data.get("type", "luat"),
            law_data.get("issuer", "Unknown"),
            law_data.get("domains", []),
            law_data.get("full_text", ""),
            int(law_data.get("article_count", 0)),
            int(law_data.get("word_count", 0)),
            law_data.get("url", ""),
        )

    print(f"  ✅ Law document inserted: {law_id}")

    # 2. Chunk and embed articles
    articles = law_data.get("articles", [])
    if not articles:
        print("  ⚠️ No articles found")
        return

    # Prepare chunks
    chunks = []
    for art in articles:
        content = art["content"]
        if not content.strip():
            continue

        # Parent context for better retrieval
        parent_ctx = f"{law_data['name']} ({law_data['number']})"
        if art.get("chapter"):
            parent_ctx += f" > {art['chapter']}"

        chunks.append({
            "law_id": law_id,
            "chapter": art.get("chapter", ""),
            "section": art.get("section", ""),
            "article": art["article"],
            "title": art.get("title", ""),
            "content": content,
            "parent_context": parent_ctx,
            "domains": law_data.get("domains", []),
            "law_status_label": "Còn hiệu lực",
            "effective_date": law_data.get("effective_date"),
            "expiry_date": law_data.get("expiry_date"),
        })

    print(f"  📋 {len(chunks)} chunks to embed")

    # 3. Embed in batches
    batch_size = 20
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]

        embeddings = await embedder.embed_batch(texts)

        async with pool.acquire() as conn:
            await conn.executemany(
                """
                INSERT INTO law_chunks (
                    law_id,
                    chapter,
                    section,
                    article,
                    title,
                    content,
                    parent_context,
                    domains,
                    law_domains,
                    law_status_label,
                    effective_date,
                    expiry_date,
                    embedding,
                    tsv
                )
                VALUES (
                    $1::uuid,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8::text[],
                    $9::text[],
                    $10,
                    $11::date,
                    $12::date,
                    $13::vector(1024),
                    to_tsvector('simple', coalesce($5, '') || ' ' || coalesce($6, ''))
                )
                """,
                [
                    (
                        str(chunk["law_id"]),
                        chunk["chapter"],
                        chunk["section"],
                        chunk["article"],
                        chunk["title"],
                        chunk["content"],
                        chunk["parent_context"],
                        chunk["domains"],
                        chunk["domains"],
                        chunk["law_status_label"],
                        chunk["effective_date"],
                        chunk["expiry_date"],
                        _vector_literal(embedding),
                    )
                    for chunk, embedding in zip(batch, embeddings)
                ],
            )

        print(f"  ✅ Embedded batch {i//batch_size + 1}/{(len(chunks) + batch_size - 1)//batch_size}")

    print(f"  🎉 Done: {len(chunks)} chunks embedded")


async def main() -> None:
    """Process all crawled law files."""
    print("🏛️ Legal AI — Law Embedding Pipeline")

    json_files = list(DATA_DIR.glob("*.json"))
    if not json_files:
        print("❌ No law files found. Run crawl_laws.py first.")
        return

    print(f"Found {len(json_files)} law files")

    pool = await asyncpg.create_pool(**_db_config(), min_size=1, max_size=4)
    try:
        for filepath in json_files:
            try:
                await process_law_file(pool, filepath)
            except Exception as e:
                print(f"  ❌ Error processing {filepath.name}: {e}")
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
