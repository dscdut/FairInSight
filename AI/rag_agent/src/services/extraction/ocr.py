"""OCR tiếng Việt bằng EasyOCR — đọc chữ từ ảnh (PDF scan, và sau này ảnh user gửi).

Đã benchmark 5 engine trên data luật thật: EasyOCR(['vi']) giữ dấu tiếng Việt
ổn định (~28-31% diacritic) và bắt đúng cấu trúc "Điều/Khoản". Reader nạp model
một lần rồi tái dùng (model ở cache global `~/.EasyOCR`, ~98MB).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from src.services.extraction import pdf as pdf_mod
from src.services.extraction.types import PageText

if TYPE_CHECKING:
    import easyocr

# easyocr import LƯỜI (trong _get_reader), KHÔNG ở module top: easyocr kéo theo cv2
# (DLL native). Nếu môi trường chặn cv2 (vd Windows Smart App Control chặn cv2.pyd),
# import top sẽ làm SẬP toàn bộ app lúc khởi động — kể cả khi chỉ nạp PDF digital
# (không cần OCR). Để lười → app vẫn boot, chỉ trang scan mới chạm OCR và báo lỗi rõ.

# Reader nặng (vài GB VRAM) → khởi tạo lười, dùng lại cho mọi lần OCR.
_reader: "easyocr.Reader | None" = None


def _get_reader() -> "easyocr.Reader":
    """Trả về EasyOCR Reader (nạp model lần đầu, sau đó cache).

    Dùng GPU khi: config OCR_USE_GPU=true VÀ có CUDA. Máy 8GB VRAM để false
    (LLM qwen3+bge-m3 đã chiếm GPU). EasyOCR tự fallback CPU nếu thiếu CUDA.
    """
    global _reader
    if _reader is None:
        import easyocr  # lười: cv2 chỉ nạp khi THỰC SỰ cần OCR

        from src.config.settings import settings

        gpu = False
        if settings.OCR_USE_GPU:
            try:
                import torch

                gpu = torch.cuda.is_available()
            except Exception:
                gpu = False
        _reader = easyocr.Reader(["vi"], gpu=gpu)
    return _reader


def ocr_image(png: bytes) -> str:
    """OCR một ảnh PNG → text, TÁI DỰNG DÒNG theo tọa độ box.

    EasyOCR trả các box rời. Nếu chỉ join thứ tự box (paragraph=False) thì câu vỡ:
    "1." và "Có bằng..." thành 2 dòng → regex khoản trượt → RỚT KHOẢN. Nếu gộp đoạn
    (paragraph=True) thì Điều không còn ở đầu dòng → regex Điều trượt.
    GIẢI: gom box theo HÀNG (y gần nhau) rồi sắp theo x → mỗi hàng 1 dòng đọc đúng
    (vd "1. Có bằng cử nhân luật;"). Giữ được cả Điều LẪN Khoản cho unit_tree.
    """
    reader = _get_reader()
    res = reader.readtext(png, detail=1, paragraph=False)
    return _reflow_lines(res)


def _reflow_lines(boxes: list, y_tol: int = 14) -> str:
    """Tái dựng dòng từ list (bbox, text, conf): gom theo y, sắp theo x."""
    items = []
    for bbox, txt, *_ in boxes:
        ys = [p[1] for p in bbox]
        xs = [p[0] for p in bbox]
        items.append((sum(ys) / len(ys), min(xs), txt))
    items.sort(key=lambda r: (r[0], r[1]))
    lines: list[str] = []
    cur: list[tuple[float, str]] = []
    cur_y: float | None = None
    for y, x, txt in items:
        if cur_y is None or abs(y - cur_y) <= y_tol:
            cur.append((x, txt))
            cur_y = y if cur_y is None else (cur_y + y) / 2
        else:
            cur.sort()
            lines.append(" ".join(t for _, t in cur))
            cur = [(x, txt)]
            cur_y = y
    if cur:
        cur.sort()
        lines.append(" ".join(t for _, t in cur))
    return "\n".join(lines)


def ocr_pdf(path: str, dpi: int = 200, max_pages: int | None = None) -> list[PageText]:
    """OCR toàn bộ (hoặc `max_pages` trang đầu) của một PDF scan."""
    profile = pdf_mod.profile(path)
    n = profile.page_count if max_pages is None else min(max_pages, profile.page_count)
    pages: list[PageText] = []
    for i in range(n):
        png = pdf_mod.render_page_png(path, i, dpi=dpi)
        pages.append(PageText(page_no=i, text=ocr_image(png)))
    return pages
