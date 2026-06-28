"""ChunkBuilder — biến units thành chunk RAG (chunk_text có breadcrumb).

Chiến lược v2 (chunk-theo-ĐIỀU, giữ ngữ nghĩa):
- 1 ĐIỀU = 1 chunk, gộp tiêu đề Điều + intro + toàn bộ Khoản/Điểm con. Header mang
  breadcrumb Chương/Mục để mỗi chunk tự đủ ngữ cảnh (không còn khoản lẻ mất tiêu đề Điều).
- Điều quá dài (> _MAX_CHARS) → chia tiếp theo NHÓM KHOẢN, MỖI mảnh lặp lại tiêu đề Điều cha
  ("(tiếp N)") để không mất ngữ cảnh. Khoản đơn vẫn > ngưỡng → đứng riêng (cắt cứng cuối).
- Block (văn bản không có Điều) → 1 chunk như cũ.
Chỉ chạy cho Tier A/B (Tier C không vào vector). source_unit = chính ĐIỀU (article).
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from src.schema.enums.document import Tier
from src.schema.enums.unit import UnitType
from src.ingest.unit_tree import UnitDraft

_MIN_CHARS = 15
# Ngưỡng 1 chunk: ~1500 token (len//4) — an toàn dưới context bge-m3 8192.
_MAX_CHARS = 6000
# Tier được phép chunk + embedding (C = cá biệt, chỉ metadata).
_CHUNK_TIERS = {Tier.A.value, Tier.B.value}


@dataclass
class ChunkDraft:
    source_unit_temp_id: str
    chunk_index: int
    chunk_text: str
    content_hash: str
    token_count: int


def _hash(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def _children_of(parent_id: str, by_parent: dict[str, list[UnitDraft]]) -> list[UnitDraft]:
    """Trả mọi hậu duệ (Khoản, Điểm...) của 1 unit theo thứ tự order_index."""
    out: list[UnitDraft] = []
    for child in by_parent.get(parent_id, []):
        out.append(child)
        out.extend(_children_of(child.temp_id, by_parent))
    return out


def _clause_label(u: UnitDraft) -> str:
    """Tiền tố hiển thị cho 1 đơn vị con khi gộp vào nội dung Điều."""
    if u.unit_type == UnitType.CLAUSE.value:
        return f"{u.clause_no}. " if u.clause_no else ""
    if u.unit_type == UnitType.POINT.value:
        return f"{u.point_label}) " if u.point_label else ""
    return ""


def _article_segments(art: UnitDraft, by_parent: dict[str, list[UnitDraft]]) -> tuple[str, list[str]]:
    """Trả (tiêu_đề_Điều, danh_sách_đoạn) — mỗi đoạn = 1 Khoản (gộp Điểm con) hoặc intro.

    Corpus để nội dung thật ở Khoản/Điểm con; article.content thường chỉ là tiêu đề/đoạn mở.
    """
    title = art.title or (f"Điều {art.article_no}" if art.article_no else "")
    segments: list[str] = []

    intro = (art.content or "").strip()
    # bỏ intro nếu trùng tiêu đề (article.content hay = art_title)
    if intro and intro not in title:
        segments.append(intro)

    children = _children_of(art.temp_id, by_parent)
    # gộp theo Khoản: mỗi Khoản 1 đoạn, kèm các Điểm con của nó
    cur_clause_text: list[str] = []

    def flush_clause():
        if cur_clause_text:
            segments.append("\n".join(cur_clause_text).strip())
            cur_clause_text.clear()

    for c in children:
        body = (c.content or "").strip()
        if not body:
            continue
        label = _clause_label(c)
        if c.unit_type == UnitType.CLAUSE.value:
            flush_clause()
            cur_clause_text.append(f"{label}{body}")
        elif c.unit_type == UnitType.POINT.value:
            cur_clause_text.append(f"{label}{body}")
        else:
            cur_clause_text.append(body)
    flush_clause()

    # Điều không có khoản con (chỉ intro) → 1 đoạn là chính content
    if not segments and intro:
        segments.append(intro)
    return title, segments


def _emit(chunks: list[ChunkDraft], idx: int, temp_id: str, text: str) -> int:
    chunks.append(
        ChunkDraft(
            source_unit_temp_id=temp_id,
            chunk_index=idx,
            chunk_text=text,
            content_hash=_hash(text),
            token_count=max(1, len(text) // 4),
        )
    )
    return idx + 1


def build_chunks(units: list[UnitDraft], doc_prefix: str) -> list[ChunkDraft]:
    """doc_prefix vd 'Luật Đất đai (31/2024/QH15)' để gắn đầu mỗi chunk_text.

    Chunk theo ĐIỀU (gộp con). Block → 1 chunk. Bỏ qua Phần/Chương/Mục/Khoản/Điểm
    (chúng đã được gộp vào chunk Điều cha; riêng lẻ không vào vector).
    """
    by_parent: dict[str, list[UnitDraft]] = {}
    for u in units:
        if u.parent_temp_id:
            by_parent.setdefault(u.parent_temp_id, []).append(u)

    chunks: list[ChunkDraft] = []
    idx = 0
    for u in units:
        # BLOCK (văn bản không Điều) → 1 chunk như cũ
        if u.unit_type == UnitType.BLOCK.value:
            body = (u.content or u.title or "").strip()
            if len(body) < _MIN_CHARS:
                continue
            crumb = u.path_text or ""
            text = f"{doc_prefix} | {crumb}: {body}" if crumb else f"{doc_prefix}: {body}"
            idx = _emit(chunks, idx, u.temp_id, text)
            continue

        if u.unit_type != UnitType.ARTICLE.value:
            continue  # Khoản/Điểm/Chương... gộp vào Điều cha, không chunk riêng

        title, segments = _article_segments(u, by_parent)
        # breadcrumb Chương/Mục: lấy path_text của Điều bỏ phần "> Điều N" cuối
        crumb = u.path_text or ""
        crumb = crumb.rsplit(" > ", 1)[0] if " > Điều" in f" {crumb}" else crumb
        header = f"{doc_prefix} | {crumb}" if crumb else doc_prefix

        full = "\n".join([title] + segments).strip()
        if len(full) < _MIN_CHARS:
            continue

        # vừa ngưỡng → 1 chunk trọn Điều
        if len(header) + len(full) <= _MAX_CHARS:
            idx = _emit(chunks, idx, u.temp_id, f"{header}\n{full}")
            continue

        # Điều dài → chia nhóm khoản, lặp tiêu đề Điều
        part: list[str] = []
        plen = len(header) + len(title)
        pno = 1

        def flush_part():
            nonlocal idx, pno, part, plen
            if not part:
                return
            tag = title if pno == 1 else f"{title} (tiếp {pno})"
            text = f"{header}\n{tag}\n" + "\n".join(part)
            idx = _emit(chunks, idx, u.temp_id, text)
            pno += 1
            part = []
            plen = len(header) + len(title)

        for seg in segments:
            if plen + len(seg) > _MAX_CHARS and part:
                flush_part()
            part.append(seg)
            plen += len(seg)
        flush_part()

    return chunks


def build_chunks_for_doc(meta, unit_drafts: list[UnitDraft]) -> list[ChunkDraft]:
    """Service-level: tự quyết gating tier + tự dựng prefix breadcrumb từ meta.

    Tier C → trả [] (không chunk/embed). Node chỉ cần gọi hàm này, không tự if/build.
    """
    if meta.tier not in _CHUNK_TIERS:
        return []
    prefix = meta.title + (f" ({meta.official_code})" if meta.official_code else "")
    return build_chunks(unit_drafts, prefix)
