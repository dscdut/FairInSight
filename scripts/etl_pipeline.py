import asyncio
import os
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any

import asyncpg
from datasets import load_dataset
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import structlog
from tqdm import tqdm

# Load environment variables
load_dotenv()

# Setup logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)
logger = structlog.get_logger()

# Constants
DATASET_NAME = "th1nhng0/vietnamese-legal-documents"
# intfloat/multilingual-e5-large is 1024 dims and highly effective for Vietnamese
MODEL_NAME = "intfloat/multilingual-e5-large"
BATCH_SIZE = 16  # Adjust based on GPU/Memory
DB_POOL_SIZE = 10

class ETLPipeline:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        if not self.db_url:
            # Construct from individual vars if DATABASE_URL is missing
            user = os.getenv("DB_USER", "postgres")
            password = os.getenv("DB_PASSWORD", "postgres")
            host = os.getenv("DB_HOST", "localhost")
            port = os.getenv("DB_PORT", "5432")
            db = os.getenv("DB_NAME", "postgres")
            self.db_url = f"postgresql://{user}:{password}@{host}:{port}/{db}"
        
        logger.info("Initializing SentenceTransformer", model=MODEL_NAME)
        self.model = SentenceTransformer(MODEL_NAME)
        self.pool = None

    async def connect_db(self):
        logger.info("Connecting to PostgreSQL", url=self.db_url)
        self.pool = await asyncpg.create_pool(self.db_url, min_size=1, max_size=DB_POOL_SIZE)

    def clean_text(self, text: str) -> str:
        if not text:
            return ""
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        # Remove excessive whitespaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def chunk_by_article(self, text: str) -> List[str]:
        """
        Splits legal text into chunks based on 'Điều' (Article) markers.
        Example: 'Điều 1. Phạm vi điều chỉnh...'
        """
        # Pattern to find 'Điều X' at the start of a line or after a space
        # We use a lookahead to keep the 'Điều' part in the split result or just split and rejoin
        pattern = r'(?i)(?=Điều\s+\d+[:.])'
        chunks = re.split(pattern, text)
        
        # Filter out very small chunks and clean
        final_chunks = []
        for c in chunks:
            cleaned = self.clean_text(c)
            if len(cleaned) > 50:  # Minimum length for a meaningful article
                final_chunks.append(cleaned)
        
        return final_chunks

    def parse_date(self, date_str: str) -> datetime:
        if not date_str:
            return None
        try:
            # Common formats in Vietnamese legal docs: dd/mm/yyyy
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except Exception:
            try:
                return datetime.fromisoformat(date_str).date()
            except Exception:
                return None

    async def ingest_batch(self, batch: List[Dict[str, Any]]):
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                for item in batch:
                    # 1. Upsert into law_documents
                    doc_id = await conn.fetchval("""
                        INSERT INTO law_documents (code, title, effective_date, law_status)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (code) DO UPDATE 
                        SET title = EXCLUDED.title, 
                            effective_date = EXCLUDED.effective_date, 
                            law_status = EXCLUDED.law_status
                        RETURNING id
                    """, item['code'], item['title'], item['effective_date'], item['law_status'])

                    # 2. Batch insert chunks
                    # We'll do this outside the loop if we want true batching, 
                    # but for now, we'll collect all chunks for this batch
                    chunk_data = []
                    for content, embedding in zip(item['chunks'], item['embeddings']):
                        chunk_data.append((
                            doc_id,
                            item['code'],
                            item['title'],
                            content,
                            item['law_status'],
                            item['effective_date'],
                            embedding.tolist()
                        ))
                    
                    if chunk_data:
                        await conn.executemany("""
                            INSERT INTO law_chunks (document_id, code, title, content, law_status, effective_date, embedding)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        """, chunk_data)

    async def run(self, limit: int = 1000):
        await self.connect_db()
        
        logger.info("Loading dataset from Hugging Face", dataset=DATASET_NAME)
        # Using stream=True to handle large datasets efficiently
        dataset = load_dataset(DATASET_NAME, split='train', streaming=True)
        
        logger.info("Starting ETL process", limit=limit)
        
        current_batch = []
        count = 0
        
        pbar = tqdm(total=limit, desc="Ingesting Documents")
        
        for record in dataset:
            if count >= limit:
                break
            
            # Extract basic info (names might vary, assuming 'id', 'title', 'content', 'meta')
            # Based on th1nhng0 dataset structure: 'id', 'title', 'content', 'metadata'
            doc_code = record.get('id', str(uuid.uuid4()))
            doc_title = record.get('title', 'Unknown Title')
            raw_content = record.get('content', '')
            
            # Metadata parsing
            meta = record.get('metadata', {}) or {}
            raw_date = meta.get('ngay_ban_hanh') or meta.get('effective_date')
            eff_date = self.parse_date(raw_date)
            status = meta.get('tinh_trang_hieu_luc', 'active')
            
            # Chunking
            chunks = self.chunk_by_article(raw_content)
            if not chunks:
                # Fallback to whole content if no "Điều" markers found
                chunks = [self.clean_text(raw_content)]
                
            # Embedding - E5 models require 'passage: ' prefix for asymmetric search
            # For BGE-M3 or others, check their documentation. E5-large needs 'passage: '
            prefixed_chunks = [f"passage: {c}" for c in chunks]
            embeddings = self.model.encode(prefixed_chunks, convert_to_numpy=True)
            
            current_batch.append({
                'code': doc_code,
                'title': doc_title,
                'content': raw_content,
                'effective_date': eff_date,
                'law_status': status,
                'chunks': chunks,
                'embeddings': embeddings
            })
            
            if len(current_batch) >= BATCH_SIZE:
                await self.ingest_batch(current_batch)
                current_batch = []
            
            count += 1
            pbar.update(1)
            
        # Final batch
        if current_batch:
            await self.ingest_batch(current_batch)
            
        pbar.close()
        logger.info("ETL Pipeline completed successfully", total_docs=count)
        await self.pool.close()

if __name__ == "__main__":
    pipeline = ETLPipeline()
    asyncio.run(pipeline.run(limit=100)) # Default to 100 for a quick test
