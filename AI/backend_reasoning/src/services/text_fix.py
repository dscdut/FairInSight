"""TextFixService — sửa lỗi OCR text luật VN bằng LLM (POC OCR→LLM đã chốt).

Toàn bộ business logic fix nằm ở đây (node llm_fix chỉ gọi fix_text). Luồng:
  cắt theo Điều → Điều dài tách theo Khoản → mỗi mảnh gọi LLM (gemma4/qwen3) sửa
  dấu + chính tả OCR (CẤM thêm/bớt, CẤM chuẩn hóa số) → ghép lại → NFC.

Prompt + cách cắt bê NGUYÊN từ POC (poc_ocr_llm/prompts.py + run_poc.py):
  - 2 nguồn: [EASYOCR ưu tiên] + [PYMUPDF tham khảo]. Khi ingest, EasyOCR text là
    normalized_text; PyMuPDF ref lấy lại từ PDF (rỗng nếu scan thuần).
"""

from __future__ import annotations

import re
import unicodedata
from typing import Optional

from src.services import llm

# ===========================================================================
# PROMPT (bê NGUYÊN từ poc_ocr_llm/prompts.py — FIX_SYSTEM + _FIX2_RULES)
# ===========================================================================

FIX_SYSTEM = (
    "Ban la chuyen vien ra soat van ban phap luat Viet Nam. Nhiem vu DUY NHAT "
    "cua ban la SUA LOI OCR: phuc hoi dau tieng Viet, sua chinh ta, tach lai "
    "dong/cau bi dinh — de tra ve dung text goc cua dieu luat. "
    "Ban KHONG phai nguoi viet luat: TUYET DOI khong them y, khong dien giai, "
    "khong tom tat, khong bo bot bat ky cau/so/khoan/diem nao. "
    "KHONG suy luan dai dong: in thang text da sua, KHONG giai thich qua trinh."
)

_FIX2_RULES = """NHIEM VU: Duoi day la HAI ban doc cua CUNG MOT doan van ban luat Viet Nam:
- [EASYOCR] = ban OCR chinh (uu tien tin theo ban nay).
- [PYMUPDF] = text-layer trich tu PDF (co the rong; dung lam THAM KHAO de doi chieu).
Hay tra ve DUNG text luat goc, dua tren ca hai.

QUY TAC BAT BUOC:
1. UU TIEN [EASYOCR]. Dung [PYMUPDF] de DOI CHIEU/bo sung khi [EASYOCR] mo ho hoac
   sai — nhat la SO, KY HIEU, NGAY. Neu 2 ban khac nhau o 1 con so -> chon ban hop ly
   hon theo ngu canh phap luat; neu khong chac -> giu ban [EASYOCR].
2. CHI sua: dau tieng Viet, loi chinh ta OCR, xuong dong lai cho dung cau truc.
   KHONG doi tu ngu, KHONG dien giai, KHONG them, KHONG bot.
3. CAC CON SO LA BAT KHA XAM PHAM. KHONG "chuan hoa" so:
   - So La Ma (vd "XIII") giu CHINH XAC; neu 1 ban OCR loi (vd "XTII") va ban kia ro
     hon -> dung ban ro; van khong chac -> giu nguyen, KHONG doan bua.
   - So Dieu/Khoan/Diem, nam, ngay, so hieu van ban: giu chinh xac tung chu so.
4. Neu ca hai ban deu qua sai 1 cho khong the doan chac -> giu nguyen, KHONG bia.
5. DINH DANG chuan luat Viet Nam (Điều/Khoản/Điểm moi cap mot dong).
6. CHI in text luat da sua. KHONG loi mo dau, KHONG giai thich, KHONG markdown.

--- [EASYOCR] ---
{easy}
--- [PYMUPDF] ---
{mupdf}
--- Da sua ---
"""


def build_fix2_prompt(easy_text: str, mupdf_text: str) -> str:
    """Prompt 2 nguon: EasyOCR (chinh) + PyMuPDF (tham khao)."""
    return _FIX2_RULES.format(
        easy=easy_text.strip() or "(rong)",
        mupdf=mupdf_text.strip() or "(khong co text-layer)",
    )


# ===========================================================================
# CẮT ĐOẠN (bê từ poc_ocr_llm/run_poc.py — split_into_articles + split_large_chunk)
# ===========================================================================

# Cắt theo "Điều N". OCR trả ký tự tổ hợp (NFD) → PHẢI normalize NFC trước regex.
# OCR hay nhầm DẤU trong chữ "Điều" (vd đọc "Điều"→"Đỉều" i-hỏi, "Điêu"...) → liệt kê
# 4 biến thể cố định là KHÔNG đủ, mất ranh giới Điều → cắt cụt. Dùng class biến thể
# dấu cho i (iìíỉĩị) + e/ê (eèéẻẽẹêềếểễệ); đầu [ĐÐ] (U+0110/U+00D0) + ASCII "Dieu".
_ARTICLE_SPLIT = re.compile(
    r"(?im)^\s*(?:[ĐÐ][iìíỉĩị][eèéẻẽẹêềếểễệ]u|Dieu)\s+\d+"
)
# Một Điều quá DÀI (hiếm) tách theo Khoản ("1. ", "2. " đầu dòng) để không tràn batch.
_CLAUSE_SPLIT = re.compile(r"(?m)^\s*(?=\d+\.\s)")

# GỘP BATCH theo ký tự: context gemma 8192 token = input+output, mà fix OCR thì
# output≈input → input chỉ ~3500 token (~8750 ký tự), chừa nửa kia cho output. Gộp
# nhiều Điều tới gần ngưỡng → 1 lần gọi/batch thay vì 1 lần/Điều → ít overhead mạng
# (qua tunnel Mac mini), nhanh ~6-7x. (POC poc_ocr_llm/test_batch_fix.py đã verify.)
_CHARS_PER_TOKEN = 2.5
_BATCH_CHARS = int(3500 * _CHARS_PER_TOKEN)  # ~8750 ký tự input/batch


def _split_articles(text: str) -> list[str]:
    """Cắt text thành các đoạn bắt đầu 'Điều N'. Không thấy → cắt theo đoạn rỗng.

    GIỮ phần đầu trước Điều thứ nhất (header: số hiệu, tên, căn cứ) làm đoạn riêng —
    KHÔNG vứt. Nếu OCR nhầm dấu chữ "Điều" của Điều 1 (vd "Đỉều 1") thì ranh giới đầu
    nhảy xuống Điều 2; vứt text[:idxs[0]] sẽ mất luôn header + Điều 1 (mất data thầm lặng).
    """
    text = unicodedata.normalize("NFC", text)
    idxs = [m.start() for m in _ARTICLE_SPLIT.finditer(text)]
    if len(idxs) >= 1:
        chunks = []
        head = text[: idxs[0]].strip()
        if head:
            chunks.append(head)
        for i, s in enumerate(idxs):
            e = idxs[i + 1] if i + 1 < len(idxs) else len(text)
            chunks.append(text[s:e].strip())
        return [c for c in chunks if c]
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if len(p.strip()) > 40]
    return paras


def _split_large(chunk: str, budget: int) -> list[str]:
    """1 Điều dài hơn budget → tách theo Khoản để không tràn batch. Ngược lại giữ nguyên."""
    chunk = unicodedata.normalize("NFC", chunk)
    if len(chunk) <= budget:
        return [chunk]
    parts = _CLAUSE_SPLIT.split(chunk)
    out, cur = [], ""
    for p in parts:
        if not p.strip():
            continue
        if cur and len(cur) + len(p) > budget:
            out.append(cur.strip())
            cur = p
        else:
            cur = (cur + "\n" + p) if cur else p
    if cur.strip():
        out.append(cur.strip())
    return out or [chunk]


def _pack_batches(articles: list[str], budget: int = _BATCH_CHARS) -> list[str]:
    """CỘNG DỒN các Điều vào batch <= budget ký tự (giữ nguyên ranh giới Điều).

    Điều DÀI hơn budget (hiếm) → tách theo Khoản (_split_large) rồi mới gộp. Mỗi batch
    là 1 lần gọi LLM → ít lần gọi hơn hẳn so với 1 Điều/lần.
    """
    pieces: list[str] = []
    for art in articles:
        pieces.extend(_split_large(art, budget))
    batches: list[str] = []
    cur = ""
    for p in pieces:
        if not cur:
            cur = p
        elif len(cur) + len(p) + 2 <= budget:
            cur = cur + "\n\n" + p
        else:
            batches.append(cur)
            cur = p
    if cur:
        batches.append(cur)
    return batches


# ===========================================================================
# THAM KHẢO PyMuPDF + ĐIỂM VÀO fix_text
# ===========================================================================

def _mupdf_ref(path: Optional[str]) -> str:
    """Text-layer PyMuPDF làm tham khảo cho LLM (rỗng nếu scan thuần / không có path)."""
    if not path:
        return ""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return ""
    try:
        with fitz.open(path) as doc:
            return "\n".join((page.get_text() or "") for page in doc).strip()
    except Exception:  # noqa: BLE001 — tham khảo phụ, lỗi thì bỏ qua
        return ""


def fix_text(text: str, *, path: Optional[str] = None, budget: int = _BATCH_CHARS) -> str:
    """Sửa lỗi OCR cả văn bản: cắt Điều → GỘP BATCH ~budget ký tự → mỗi batch 1 lần gọi
    LLM, ghép lại, NFC.

    `path` = PDF gốc để lấy PyMuPDF text-layer làm tham khảo (đối chiếu số/ký hiệu).
    NFC đầu ra BẮT BUỘC: LLM có thể trả NFD làm unit_tree (regex ^Điều) vỡ.
    budget = ký tự input/batch (mặc định ~8750 ≈ 3500 token, chừa nửa context cho output).
    """
    mupdf = _mupdf_ref(path)
    fixed_all: list[str] = []
    for batch in _pack_batches(_split_articles(text), budget=budget):
        out = llm.complete_sync(
            build_fix2_prompt(batch, mupdf), system=FIX_SYSTEM, temperature=0.1
        )
        if out.strip():
            fixed_all.append(out.strip())
    joined = "\n\n".join(fixed_all)
    return unicodedata.normalize("NFC", joined) if joined else text
