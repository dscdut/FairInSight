"""RelationJudge + Gate — tầng kiểm candidate trước khi ghi quan hệ (ask.txt B13).

Nguyên tắc: KHÔNG "regex thấy gì ghi relation luôn". Quan hệ regex sinh ra chỉ là
CANDIDATE. Trước khi thành quan hệ thật phải qua:
  1. LLM judge (chỉ câu MƠ HỒ / loại đổi hiệu lực) — accept/reject + sửa loại.
  2. Rule gate THỨ BẬC — VB cấp dưới không thể sửa đổi/thay/bãi VB cấp cao hơn.

Để POC không quá chậm: chỉ judge AMENDMENT (đổi hiệu lực, sai là nguy hiểm), KHÔNG
judge mọi reference (căn cứ/dẫn chiếu sai chỉ là nhiễu nhẹ, rule + gate đủ).
"""

from __future__ import annotations

from src.schema.enums.relation import AmendmentType

_JUDGE_SYSTEM = (
    "Bạn là trợ lý pháp lý kiểm tra quan hệ SỬA ĐỔI giữa hai văn bản luật Việt Nam. "
    "Chỉ trả JSON, không giải thích."
)

_JUDGE_PROMPT = """Câu bằng chứng trích từ văn bản nguồn:
"{evidence}"

Văn bản nguồn: {src_title}
Loại quan hệ máy đoán: {type_guess} (tới văn bản số hiệu {target_code}{art}).

Câu trên có THỰC SỰ tuyên bố văn bản nguồn {type_label} văn bản đích không?
Trả JSON: {{"accept": true/false, "type": "amend|replace|repeal|supplement", "reason": "ngắn"}}
- accept=false nếu câu chỉ DẪN CHIẾU/căn cứ chứ không sửa đổi, hoặc bằng chứng không rõ.
- type chọn đúng: amend=sửa một phần, replace=thay toàn bộ, repeal=bãi bỏ, supplement=bổ sung mới."""

_TYPE_LABEL = {
    AmendmentType.AMEND.value: "sửa đổi/bổ sung",
    AmendmentType.REPLACE.value: "thay thế",
    AmendmentType.REPEAL.value: "bãi bỏ",
    AmendmentType.SUPPLEMENT.value: "bổ sung điều/khoản mới cho",
}
_VALID_TYPES = set(_TYPE_LABEL)


def judge_amendments(drafts: list, src_title: str) -> tuple[list, int]:
    """Lọc amendment candidate qua LLM. Trả (drafts_giữ_lại, n_rejected).

    references KHÔNG đụng tới (đã lọc sẵn ở caller — chỉ truyền amendment vào đây).
    Lỗi LLM (JSON rỗng) → GIỮ candidate (fail-open, không mất quan hệ vì model lỗi).
    """
    from src.services import llm

    kept: list = []
    rejected = 0
    for d in drafts:
        art = f", Điều {d.target_article}" if d.target_article else ""
        prompt = _JUDGE_PROMPT.format(
            evidence=d.evidence_text[:400], src_title=src_title,
            type_guess=d.rel_type, target_code=d.target_code, art=art,
            type_label=_TYPE_LABEL.get(d.rel_type, "sửa đổi"),
        )
        try:
            res = llm.complete_json_sync(prompt, system=_JUDGE_SYSTEM)
        except Exception:  # noqa: BLE001 — model lỗi → fail-open
            kept.append(d)
            continue
        if not res:  # JSON rỗng → fail-open, giữ
            kept.append(d)
            continue
        if not res.get("accept", True):
            rejected += 1
            continue
        # LLM sửa loại nếu lệch (vd regex đoán amend nhưng thực ra replace)
        new_type = res.get("type")
        if new_type in _VALID_TYPES:
            d.rel_type = new_type
        d.confidence = min(0.95, (d.confidence or 0.8) + 0.1)  # qua judge → tin hơn
        kept.append(d)
    return kept, rejected


def gate_hierarchy(src_level: int, tgt_level: int, tgt_type: str | None = None,
                   src_issuer: str | None = None) -> bool:
    """Rule gate THỨ BẬC: nguồn có được phép tác động hiệu lực lên đích không?

    doc_level: số NHỎ = cấp CAO (1=Hiến pháp ... 10=tham khảo). VB cấp dưới (số lớn)
    KHÔNG thể sửa/thay/bãi VB cấp trên (số nhỏ). Cho phép cùng cấp hoặc nguồn cao hơn.
    Trả True = hợp lệ (được ghi), False = phi lý (chặn, đẩy review).

    NGOẠI LỆ HIẾN PHÁP: chỉ QUỐC HỘI mới sửa được Hiến pháp (quyền lập hiến). VB sửa Hiến
    pháp (Nghị quyết/Luật của QH) có doc_level > Hiến pháp nhưng VẪN hợp hiến. Nên đích là
    Hiến pháp → cho phép nếu NGUỒN do Quốc hội ban hành (issuer chứa 'Quốc hội'), bất kể
    doc_level (nghị quyết QH bị gán level 5 như nghị quyết địa phương). Không phải QH → chặn.
    """
    if src_level is None or tgt_level is None:
        return True  # thiếu thông tin → không chặn (fail-open)
    if tgt_type == "constitution":
        return bool(src_issuer and "quốc hội" in src_issuer.lower())
    return src_level <= tgt_level
