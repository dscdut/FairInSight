"""HybridRetriever — vector (bge-m3) + keyword (tsv) + facet filter, hợp nhất RRF.

Trả về EvidenceUnit đã leo từ chunk về unit thật (nguồn trích dẫn).
"""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.settings import settings
from src.repositories import chunk_repo, unit_repo
from src.repositories.chunk_repo import ChunkHit
from src.services import reranker
from src.services.embedding import embed_one


def _norm(s: Optional[str]) -> str:
    """Chuẩn hóa để so khớp tên luật trong câu hỏi: lower + gộp khoảng trắng."""
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


def _law_family(title: Optional[str]) -> str:
    """Lõi 'dòng luật' để gom các BẢN khác năm: bỏ năm/số hiệu, lower.

    'Bộ luật Lao động 2019' và 'Bộ Luật lao động 2012' → cùng 'bộ luật lao động'
    → biết là 2 bản của cùng 1 luật để ưu tiên bản hiện hành.
    """
    t = re.sub(r"\s+", " ", (title or "").lower()).strip()
    t = re.split(r"[,(]", t)[0]
    t = re.sub(r"\s+(số\s+)?\d.*$", "", t)  # bỏ năm/số đuôi
    return t.strip()


@dataclass
class EvidenceUnit:
    unit_id: str
    document_id: str
    document_title: str
    official_code: Optional[str]
    doc_level: int
    tier: str
    path_text: str
    content: str
    retrieval_method: str
    score: float
    unit_status: str
    article_no: Optional[str] = None
    clause_no: Optional[str] = None


def _rrf(rank: int, k: int = 60) -> float:
    return 1.0 / (k + rank)


def _fuse(vector_hits: list[ChunkHit], keyword_hits: list[ChunkHit]) -> list[ChunkHit]:
    """Reciprocal Rank Fusion: gộp 2 danh sách theo thứ hạng (chunk_id duy nhất)."""
    scores: dict[str, float] = {}
    best: dict[str, ChunkHit] = {}
    for hits in (vector_hits, keyword_hits):
        for rank, h in enumerate(hits, 1):
            scores[h.chunk_id] = scores.get(h.chunk_id, 0.0) + _rrf(rank)
            if h.chunk_id not in best:
                best[h.chunk_id] = h
    fused = sorted(best.values(), key=lambda h: scores[h.chunk_id], reverse=True)
    for h in fused:
        h.score = scores[h.chunk_id]
        h.method = "hybrid"
    return fused


async def retrieve(
    session: AsyncSession,
    query: str,
    *,
    top_k: int = 6,
    tiers: Optional[list[str]] = None,
    domains: Optional[list[str]] = None,
    province: Optional[str] = None,
    article_no: Optional[str] = None,
) -> list[EvidenceUnit]:
    """Tìm hybrid rồi leo chunk → unit, trả EvidenceUnit (đã dedupe theo unit).

    article_no: user hỏi 'Điều N <tên luật chữ>' (không có số hiệu để dùng
    CitationRetriever) → lọc chunk về Điều N để không lạc sang Điều khác / Điều 1.
    Nếu lọc xong RỖNG (không luật nào có Điều N, vd 'Điều 999') → bỏ filter, để
    hybrid xếp ngữ nghĩa bình thường (rồi composer tự báo 'không tìm thấy Điều N').
    """
    tiers = tiers or ["A", "B"]
    # Loại domain slug không có thật trong DB (LLM hay bịa slug lệch taxonomy).
    # Nếu lọc xong rỗng → bỏ filter domain thay vì để vector search ra 0 kết quả.
    if domains:
        valid = await chunk_repo.valid_domains(session)
        kept = [d for d in domains if d in valid]
        domains = kept or None
    # Khi rerank bật, lấy pool RỘNG (top_k*5) để cross-encoder có nhiều ứng viên chấm
    # lại — cái đúng đôi khi đứng hạng 2-3 ở RRF, pool hẹp sẽ cắt mất trước khi rerank
    # kịp nâng nó lên. Rerank chạy CPU nên thêm ứng viên gần như miễn phí. Tắt rerank
    # thì giữ top_k*2 (không có gì chấm lại, pool rộng vô ích).
    pool = top_k * 5 if settings.RERANK_ENABLED else top_k * 2
    # embed_one là sync (httpx) → chạy trong thread để không chặn event loop.
    emb = await asyncio.to_thread(embed_one, query)
    vhits = await chunk_repo.vector_search(
        session, emb, top_k=pool, tiers=tiers, domains=domains, province=province,
        article_no=article_no,
    )
    khits = await chunk_repo.keyword_search(
        session, query, top_k=pool, tiers=tiers, article_no=article_no
    )
    # Filter article_no quá hẹp → 0 hit (Điều không tồn tại): thử lại không lọc Điều.
    if article_no and not vhits and not khits:
        vhits = await chunk_repo.vector_search(
            session, emb, top_k=pool, tiers=tiers, domains=domains, province=province
        )
        khits = await chunk_repo.keyword_search(session, query, top_k=pool, tiers=tiers)
    fused = _fuse(vhits, khits)[:pool]

    # leo về unit thật, dedupe theo unit_id
    unit_ids = [h.source_unit_id for h in fused if h.source_unit_id]
    units = {u.id: u for u in await unit_repo.get_by_ids(session, unit_ids)}
    from src.schema.models import Document

    doc_ids = {u.document_id for u in units.values()}
    docs = {
        d.id: d
        for d in (await session.scalars(select(Document).where(Document.id.in_(doc_ids))))
    } if doc_ids else {}

    # FIX 1 (ngữ cảnh Điều cha): khoản/điểm con có content riêng nhưng MẤT tiêu đề Điều
    # (vd "không được sa thải..." thuộc Điều 137 'Bảo vệ thai sản'). Nạp tiêu đề Điều
    # cha (cùng article_no, unit_type='article') để đính trước content → LLM không trích
    # nhầm số Điều sang chủ đề khác.
    art_titles = await _parent_article_titles(session, list(units.values()))

    # FIX 2 (ưu tiên bản hiện hành): nếu evidence dính NHIỀU bản cùng dòng luật
    # (Lao động 2012 vs 2019), chỉ giữ bản effective_date MỚI NHẤT, loại bản cũ —
    # tránh trộn quy định hết hiệu lực vào câu trả lời.
    newest: dict[str, tuple] = {}  # family → (effective_date, document_id)
    for d in docs.values():
        fam = _law_family(d.title)
        if not fam:
            continue
        eff = d.effective_date
        cur = newest.get(fam)
        if cur is None or (eff and (cur[0] is None or eff > cur[0])):
            newest[fam] = (eff, d.id)
    superseded_docs = set()
    for d in docs.values():
        fam = _law_family(d.title)
        keep = newest.get(fam)
        if keep and keep[1] != d.id and keep[0] is not None:
            superseded_docs.add(d.id)  # bản cũ hơn cùng dòng luật → loại

    # Dựng candidate (chưa cắt top_k) — để reranker có đủ ứng viên chấm lại.
    candidates: list[EvidenceUnit] = []
    seen: set[str] = set()
    for h in fused:
        u = units.get(h.source_unit_id) if h.source_unit_id else None
        if not u or u.id in seen or u.document_id in superseded_docs:
            continue
        seen.add(u.id)
        doc = docs.get(u.document_id)
        # Nội dung căn cứ: ưu tiên content của unit. Nhưng unit cấp 'Điều' thường để
        # TRỐNG content (nội dung nằm ở khoản con + dồn vào chunk_text khi embed) →
        # ~45% Điều chỉ còn cái tiêu đề. Khi đó dùng chunk_text ĐÃ MATCH (chứa đủ
        # K1/K2/K3) để composer không bị bỏ đói nội dung. Xem [[fix-dieu-content-rong]].
        content = u.content or ""
        if len(content.strip()) < 50 and h.chunk_text:
            content = h.chunk_text.strip()
        content = content or u.title or ""
        # đính tiêu đề Điều cha nếu unit là khoản/điểm (content không tự nêu 'Điều N')
        if u.unit_type != "article" and u.article_no:
            at = art_titles.get((u.document_id, u.article_no))
            if at and at not in content:
                content = f"({at})\n{content}"
        candidates.append(EvidenceUnit(
            unit_id=u.id,
            document_id=u.document_id,
            document_title=doc.title if doc else "",
            official_code=doc.official_code if doc else None,
            doc_level=doc.doc_level if doc else 99,
            tier=doc.tier if doc else "C",
            path_text=u.path_text or "",
            content=content,
            retrieval_method=h.method,
            score=h.score,
            unit_status=u.unit_status,
            article_no=u.article_no,
            clause_no=u.clause_no,
        ))

    # Rerank: cross-encoder chấm lại (query, content) rồi sắp lại theo điểm liên quan
    # ngữ nghĩa. RRF chỉ hợp nhất thứ hạng → dễ ưu tiên Điều trùng keyword/số gần nhau;
    # cross-encoder đẩy Điều đúng chủ đề lên top. Chạy CPU, không tranh VRAM.
    print(f"\n[RETRIEVE] query={query!r} | pool={len(candidates)} ứng viên (RRF)", flush=True)
    for i, c in enumerate(candidates):
        print(f"  RRF#{i+1} {c.official_code} {c.path_text} (rrf={c.score:.4f})", flush=True)
    if settings.RERANK_ENABLED and candidates:
        try:
            rrf_order = {id(c): i + 1 for i, c in enumerate(candidates)}
            scores = await asyncio.to_thread(
                reranker.rerank, query, [c.content for c in candidates]
            )
            for c, s in zip(candidates, scores):
                c.score = s
                c.retrieval_method = "hybrid+rerank"
            candidates.sort(key=lambda c: c.score, reverse=True)
            print("[RERANK] sau khi cross-encoder chấm lại:", flush=True)
            for i, c in enumerate(candidates):
                print(f"  #{i+1} (was RRF#{rrf_order[id(c)]}) {c.official_code} "
                      f"{c.path_text} (rerank={c.score:.4f})", flush=True)
        except Exception as e:
            print(f"[RERANK] LỖI ({e}) → giữ thứ hạng RRF", flush=True)
            pass  # reranker lỗi (chưa tải model...) → giữ thứ hạng RRF, không chặn chat

    # Ưu tiên theo TÊN LUẬT: người dùng tra luật thường nêu tên ("Luật Đất đai",
    # "Bộ luật Dân sự"). Nếu lõi tên luật của candidate xuất hiện trong câu hỏi →
    # đẩy lên đầu (giữ thứ tự rerank trong cùng nhóm). Khi user KHÔNG nêu tên luật
    # nào (không candidate nào khớp) → không đổi gì.
    qn = _norm(query)
    matched = [c for c in candidates if (fam := _law_family(c.document_title)) and fam in qn]
    if matched and len(matched) < len(candidates):
        matched_ids = {id(c) for c in matched}
        rest = [c for c in candidates if id(c) not in matched_ids]
        candidates = matched + rest
        print(f"[LAW-BOOST] khớp tên luật trong câu hỏi → đẩy {len(matched)} ứng viên lên đầu", flush=True)

    final = candidates[:top_k]
    print(f"[RETRIEVE] >>> CHỌN top_k={top_k} đưa cho node sau:", flush=True)
    for i, c in enumerate(final):
        print(f"  [{i+1}] {c.official_code} {c.path_text} | {c.document_title[:50]}", flush=True)
    return final


async def _parent_article_titles(session: AsyncSession, units: list) -> dict:
    """Map (document_id, article_no) → tiêu đề Điều ('Điều 137. Bảo vệ thai sản').

    Để đính ngữ cảnh cho khoản/điểm con (chunk con mất tiêu đề Điều cha). Chỉ truy
    các Điều xuất hiện trong evidence (không quét cả văn bản)."""
    from src.schema.models import Unit

    pairs = {(u.document_id, u.article_no) for u in units if u.article_no}
    if not pairs:
        return {}
    doc_ids = {d for d, _ in pairs}
    arts = {a for _, a in pairs}
    rows = await session.scalars(
        select(Unit).where(
            Unit.unit_type == "article",
            Unit.document_id.in_(doc_ids),
            Unit.article_no.in_(arts),
        )
    )
    out: dict = {}
    for u in rows:
        key = (u.document_id, u.article_no)
        if key in pairs and u.title:
            title = u.title if u.title.lower().startswith("điều") else f"Điều {u.article_no}. {u.title}"
            out[key] = title
    return out
