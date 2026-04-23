"""RAG utilities for embeddings and legal search."""

from .embedder import Embedder, get_embedder
from .search import SearchResult, close_pool, get_pool, hybrid_search, search_by_article

__all__ = [
    "Embedder",
    "SearchResult",
    "close_pool",
    "get_embedder",
    "get_pool",
    "hybrid_search",
    "search_by_article",
]
