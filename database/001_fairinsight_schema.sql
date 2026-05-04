-- ============================================================
-- FairInsight Phase 1 Schema Migration
-- Purpose:
-- 1) Upgrade pgvector columns with fixed dimensions
-- 2) Add metadata pre-filter columns on law_chunks
-- 3) Replace ivfflat indexes with HNSW indexes
-- 4) Add pre-filter-first hybrid search function
-- 5) Remove deprecated OAuth/Fernet metadata artifacts
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- 1) VECTOR DIMENSION FIX
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'law_chunks'
          AND column_name = 'embedding'
    ) THEN
        EXECUTE '
            ALTER TABLE law_chunks
            ALTER COLUMN embedding TYPE vector(1024)
            USING CASE
                WHEN embedding IS NULL THEN NULL
                WHEN vector_dims(embedding) = 1024 THEN embedding::vector(1024)
                ELSE NULL
            END
        ';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'company_chunks'
          AND column_name = 'embedding'
    ) THEN
        EXECUTE '
            ALTER TABLE company_chunks
            ALTER COLUMN embedding TYPE vector(1024)
            USING CASE
                WHEN embedding IS NULL THEN NULL
                WHEN vector_dims(embedding) = 1024 THEN embedding::vector(1024)
                ELSE NULL
            END
        ';
    END IF;
END $$;

-- ============================================================
-- 2) DENORMALIZED METADATA FOR PRE-FILTERED RAG
-- ============================================================

ALTER TABLE law_chunks
    ADD COLUMN IF NOT EXISTS law_status_label TEXT,
    ADD COLUMN IF NOT EXISTS effective_date DATE,
    ADD COLUMN IF NOT EXISTS expiry_date DATE,
    ADD COLUMN IF NOT EXISTS law_domains TEXT[];

UPDATE law_chunks AS lc
SET
    law_status_label = CASE
        WHEN ld.status::text = 'active' THEN 'Còn hiệu lực'
        WHEN ld.status::text IN ('expired', 'repealed') THEN 'Hết hiệu lực'
        ELSE INITCAP(ld.status::text)
    END,
    effective_date = ld.effective_date,
    expiry_date = ld.expiry_date,
    law_domains = ld.domains
FROM law_documents AS ld
WHERE lc.law_id = ld.id;

CREATE OR REPLACE FUNCTION sync_law_chunk_metadata_from_documents()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE law_chunks
    SET
        law_status_label = CASE
            WHEN NEW.status::text = 'active' THEN 'Còn hiệu lực'
            WHEN NEW.status::text IN ('expired', 'repealed') THEN 'Hết hiệu lực'
            ELSE INITCAP(NEW.status::text)
        END,
        effective_date = NEW.effective_date,
        expiry_date = NEW.expiry_date,
        law_domains = NEW.domains
    WHERE law_id = NEW.id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_law_chunk_metadata_from_documents ON law_documents;

CREATE TRIGGER trg_sync_law_chunk_metadata_from_documents
AFTER INSERT OR UPDATE OF status, effective_date, expiry_date, domains
ON law_documents
FOR EACH ROW
EXECUTE FUNCTION sync_law_chunk_metadata_from_documents();

-- ============================================================
-- 3) TSV MAINTENANCE FOR law_chunks
-- ============================================================

CREATE OR REPLACE FUNCTION law_chunks_tsv_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.tsv := to_tsvector('simple', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_law_chunks_tsv ON law_chunks;

CREATE TRIGGER trg_law_chunks_tsv
BEFORE INSERT OR UPDATE OF title, content
ON law_chunks
FOR EACH ROW
EXECUTE FUNCTION law_chunks_tsv_trigger_fn();

UPDATE law_chunks
SET tsv = to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, ''))
WHERE tsv IS NULL;

-- ============================================================
-- 4) INDEX UPGRADE (IVFFLAT -> HNSW + METADATA INDEXES)
-- ============================================================

DROP INDEX IF EXISTS idx_law_chunks_embedding;
DROP INDEX IF EXISTS idx_company_chunks_embedding;

CREATE INDEX IF NOT EXISTS idx_law_chunks_embedding_hnsw
    ON law_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_company_chunks_embedding_hnsw
    ON company_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_law_chunks_status_effective_expiry
    ON law_chunks (law_status_label, effective_date, expiry_date);

CREATE INDEX IF NOT EXISTS idx_law_chunks_active_window
    ON law_chunks (effective_date, expiry_date)
    WHERE law_status_label = 'Còn hiệu lực';

CREATE INDEX IF NOT EXISTS idx_law_chunks_law_domains
    ON law_chunks
    USING gin (law_domains);

CREATE INDEX IF NOT EXISTS idx_law_chunks_tsv
    ON law_chunks
    USING gin (tsv);

-- ============================================================
-- 5) FAIRINSIGHT PRE-FILTER-FIRST HYBRID SEARCH FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION search_law_chunks_fairinsight(
    query_text TEXT,
    query_embedding vector(1024),
    domain_filters TEXT[] DEFAULT NULL,
    top_k INTEGER DEFAULT 10,
    keyword_weight DOUBLE PRECISION DEFAULT 0.35,
    vector_weight DOUBLE PRECISION DEFAULT 0.65,
    reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    chunk_id UUID,
    law_id UUID,
    article TEXT,
    title TEXT,
    content TEXT,
    law_status_label TEXT,
    effective_date DATE,
    expiry_date DATE,
    law_domains TEXT[],
    keyword_score DOUBLE PRECISION,
    vector_score DOUBLE PRECISION,
    score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
WITH prefiltered AS (
    SELECT
        lc.id,
        lc.law_id,
        lc.article,
        lc.title,
        lc.content,
        lc.tsv,
        lc.embedding,
        lc.law_status_label,
        lc.effective_date,
        lc.expiry_date,
        lc.law_domains
    FROM law_chunks AS lc
    WHERE lc.law_status_label = 'Còn hiệu lực'
      AND (lc.effective_date IS NULL OR lc.effective_date <= reference_date)
      AND (lc.expiry_date IS NULL OR lc.expiry_date >= reference_date)
      AND (
          domain_filters IS NULL
          OR cardinality(domain_filters) = 0
          OR lc.law_domains && domain_filters
      )
),
keyword_ranked AS (
    SELECT
        p.id,
        ts_rank_cd(p.tsv, plainto_tsquery('simple', query_text)) AS keyword_score
    FROM prefiltered AS p
    WHERE p.tsv @@ plainto_tsquery('simple', query_text)
),
vector_ranked AS (
    SELECT
        p.id,
        (1 - (p.embedding <=> query_embedding)) AS vector_score
    FROM prefiltered AS p
    WHERE p.embedding IS NOT NULL
    ORDER BY p.embedding <=> query_embedding
    LIMIT GREATEST(top_k * 5, 50)
),
fused AS (
    SELECT
        p.id,
        p.law_id,
        p.article,
        p.title,
        p.content,
        p.law_status_label,
        p.effective_date,
        p.expiry_date,
        p.law_domains,
        COALESCE(k.keyword_score, 0.0) AS keyword_score,
        COALESCE(v.vector_score, 0.0) AS vector_score,
        (COALESCE(k.keyword_score, 0.0) * keyword_weight)
        + (COALESCE(v.vector_score, 0.0) * vector_weight) AS score
    FROM prefiltered AS p
    LEFT JOIN keyword_ranked AS k
        ON p.id = k.id
    LEFT JOIN vector_ranked AS v
        ON p.id = v.id
    WHERE k.id IS NOT NULL OR v.id IS NOT NULL
)
SELECT
    f.id AS chunk_id,
    f.law_id,
    f.article,
    f.title,
    f.content,
    f.law_status_label,
    f.effective_date,
    f.expiry_date,
    f.law_domains,
    f.keyword_score,
    f.vector_score,
    f.score
FROM fused AS f
ORDER BY f.score DESC
LIMIT top_k;
$$;

-- ============================================================
-- 6) MATERIALIZED VIEW FOR ACTIVE LAW LOOKUPS (INTAKE STAGE)
-- ============================================================

DROP MATERIALIZED VIEW IF EXISTS mv_active_laws;

CREATE MATERIALIZED VIEW mv_active_laws AS
SELECT
    ld.id,
    ld.title,
    ld.law_number,
    ld.law_type,
    ld.domains,
    ld.effective_date,
    ld.expiry_date,
    ld.status,
    ld.updated_at
FROM law_documents AS ld
WHERE ld.status::text = 'active'
  AND (ld.effective_date IS NULL OR ld.effective_date <= CURRENT_DATE)
  AND (ld.expiry_date IS NULL OR ld.expiry_date >= CURRENT_DATE);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_active_laws_id
    ON mv_active_laws (id);

CREATE INDEX IF NOT EXISTS idx_mv_active_laws_domains
    ON mv_active_laws
    USING gin (domains);

-- ============================================================
-- 7) CLEANUP DEPRECATED ARTIFACTS (OAuth + Fernet metadata)
-- ============================================================

DROP TABLE IF EXISTS oauth_states;

UPDATE companies
SET metadata = metadata - 'llm_provider'
WHERE metadata ? 'llm_provider';

-- ============================================================
-- END
-- ============================================================
