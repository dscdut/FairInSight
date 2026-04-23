"""RAG components for FairInsight legal retrieval."""

from .embedder import FairInsightEmbedder
from .hybrid_searcher import HybridSearcher

__all__ = ["FairInsightEmbedder", "HybridSearcher"]
