from app.llm import router
from app.utils.settings import get_settings

settings = get_settings()

LOW_CONTEXT_MARKERS = (
    "khong du context",
    "không đủ context",
    "khong tim thay dieu khoan phu hop",
    "không tìm thấy điều khoản phù hợp",
    "can cung cap van ban",
    "cần cung cấp văn bản",
    "khong co thong tin trong [context]",
    "không có thông tin trong [context]",
)


def _topic_suggestion_reply() -> str:
    return (
        "Minh chua co van ban/context cu the de ket luan chinh xac. "
        "Ban co the gui them [CONTEXT] hoac hoi tiep theo mot trong cac chu de nay: "
        "1) Nghia vu thanh toan trong hop dong mua ban, "
        "2) Dieu kien don phuong cham dut hop dong lao dong, "
        "3) Muc phat cham dong bao hiem xa hoi, "
        "4) Dieu kien boi thuong thiet hai ngoai hop dong, "
        "5) Thu tuc va thoi han khieu nai hanh chinh."
    )


def _internet_basis_fallback_reply() -> str:
    return (
        "[TOM TAT] Minh se tra loi dua tren kien thuc phap ly pho bien de ban tham khao nhanh. "
        "[CAN CU] Nguon Internet. "
        "[LUU Y] Noi dung chi de tham khao, ban nen doi chieu van ban quy pham chinh thuc truoc khi ap dung."
    )


ANALYSIS_KEYWORDS = (
    "rui ro",
    "rủi ro",
    "tom tat",
    "tóm tắt",
    "nghia vu",
    "nghĩa vụ",
    "dieu khoan",
    "điều khoản",
    "can cu",
    "căn cứ",
    "van ban",
    "văn bản",
)


def _has_explicit_context(prompt: str) -> bool:
    return "[CONTEXT]" in (prompt or "").upper()


def _should_ask_for_context(prompt: str) -> bool:
    normalized = (prompt or "").lower()
    return any(keyword in normalized for keyword in ANALYSIS_KEYWORDS)


def _normalize_low_context_answer(answer: str) -> str:
    normalized = (answer or "").strip()
    lowered = normalized.lower()

    has_marker = any(marker in lowered for marker in LOW_CONTEXT_MARKERS)
    has_template_tags = "[tóm tắt]" in lowered or "[tom tat]" in lowered or "[căn cứ]" in lowered or "[can cu]" in lowered

    if has_marker or has_template_tags:
        if "nguon internet" in lowered or "nguồn internet" in lowered:
            return normalized
        return _internet_basis_fallback_reply()

    return normalized


def _enrich_prompt_without_context(prompt: str) -> str:
    return (
        f"{prompt}\n\n"
        "Neu cau hoi khong co [CONTEXT], hay tra loi bang kien thuc chung dang tin cay."
    )


def _no_context_system_override() -> str:
    return (
        "Neu user khong cung cap [CONTEXT], ban van phai tra loi truc tiep bang kien thuc chung dang tin cay, "
        "khong duoc tu choi voi ly do thieu context. "
        "Trong phan [CAN CU], ghi ro: Nguon Internet. "
        "Khong duoc noi rang khong co thong tin trong [CONTEXT]."
    )


def _build_prompt_with_context(prompt: str) -> str:
    cleaned_prompt = prompt.strip()
    if not cleaned_prompt:
        return cleaned_prompt

    return cleaned_prompt


async def generate_simple_reply(prompt: str) -> str:
    cleaned_prompt = prompt.strip()
    if not cleaned_prompt:
        return "Ban muon minh ho tro chu de phap ly nao?"

    enriched_prompt = _build_prompt_with_context(cleaned_prompt)
    extra_system_prompt: str | None = None
    if not _has_explicit_context(cleaned_prompt):
        enriched_prompt = _enrich_prompt_without_context(enriched_prompt)
        extra_system_prompt = _no_context_system_override()

    raw_answer = await router.generate(enriched_prompt, extra_system_prompt=extra_system_prompt)
    return _normalize_low_context_answer(raw_answer)
