-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Law Documents Table (Metadata)
CREATE TABLE IF NOT EXISTS law_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    issuer TEXT,
    effective_date DATE,
    expiry_date DATE,
    law_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Law Chunks Table (Vectorized content)
CREATE TABLE IF NOT EXISTS law_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES law_documents(id) ON DELETE CASCADE,
    code VARCHAR(100),  -- Denormalized for performance
    title TEXT,        -- Denormalized for performance
    content TEXT NOT NULL,
    law_status VARCHAR(50) DEFAULT 'active',
    effective_date DATE,
    embedding vector(1024), -- Optimized for E5-Large / BGE-M3
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Index for high-performance vector search
-- m=16, ef_construction=64 provides a good balance for 100K+ rows
CREATE INDEX IF NOT EXISTS idx_law_chunks_embedding_hnsw ON law_chunks 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Metadata filters for strict legal compliance (preventing "time travel" queries)
CREATE INDEX IF NOT EXISTS idx_law_chunks_status ON law_chunks (law_status);
CREATE INDEX IF NOT EXISTS idx_law_chunks_effective_date ON law_chunks (effective_date);

-- Full-text search index (Vietnamese content)
CREATE INDEX IF NOT EXISTS idx_law_chunks_content_fts ON law_chunks 
USING gin (to_tsvector('simple', content));
