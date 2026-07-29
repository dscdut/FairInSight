"""IngestState — state machine của ingest graph (sơ đồ 12 node xem README mục B).

Mỗi node [1]..[12] đọc/ghi state này. Các object trung gian (meta/units/chunks/relations)
là dict/list thuần để LangGraph serialize được và để debug/log từng công đoạn.
"""

from __future__ import annotations

from typing import Optional, TypedDict


class IngestState(TypedDict, total=False):
    # input
    path: str
    raw_text: Optional[str]             # nguồn JSON: text sẵn (bỏ qua extract PDF/OCR)
    source_url: Optional[str]
    domain_hint: Optional[str]          # domain seed từ URL crawl (JSON)
    meta_overrides: Optional[dict]      # {title,official_code,issuer,doc_type} admin → tier đúng
    do_embed: bool
    allow_ocr: bool
    max_pages: Optional[int]

    # định danh DB
    source_file_id: Optional[str]
    document_id: Optional[str]
    checksum: Optional[str]            # sha256 nội dung/file — để cleanup mồ côi khi lỗi

    # sản phẩm trung gian từng công đoạn
    extract_method: Optional[str]      # digital | ocr | hybrid | skip_scan
    raw_text: Optional[str]
    normalized_text: Optional[str]
    marked_text: Optional[str]         # [6] text @@ART/@@CL/@@PT của bản cây step4 giữ (None nếu cắt smart/regex)
    needs_review: bool                 # [6] cổng chặn: cây còn 'error' sau khi cạn cách sửa
    dfs_spans: list[dict]              # [6] toạ độ lỗi DFS (cho repair khu trú / review UI)
    meta: Optional[dict]               # DocMeta dạng dict
    unit_drafts: list[dict]            # UnitDraft dạng dict (temp_id, parent_temp_id...)
    chunk_drafts: list[dict]
    embeddings: list                   # vector cho từng chunk_draft (None nếu không embed)
    relation_drafts: list[dict]
    internal_ref_drafts: list[dict]    # tham chiếu nội bộ (Điều→Điều trong cùng VB)
    cross_ref_drafts: list[dict]       # tham chiếu RA NGOÀI bằng TÊN luật (unit→luật khác)
    tag_suggestion: Optional[object]   # TagSuggestion (domain+topics) — chỉ Tier A

    # tier điều khiển gating (A/B mới chunk+embed; C dừng sau metadata)
    tier: Optional[str]

    # kết quả + trace
    status: str                        # completed | failed | skipped_duplicate
    error: Optional[str]
    counts: dict                       # n_units, n_articles, n_chunks, n_embedded, n_ref...
    steps: list[dict]
    warnings: list[str]
