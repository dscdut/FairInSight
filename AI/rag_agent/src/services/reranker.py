"""RerankerService — cross-encoder bge-reranker-v2-m3 chấm lại độ liên quan (query, text).

Đặt SAU hybrid (vector+keyword RRF): RRF chỉ hợp nhất thứ hạng, không hiểu ngữ nghĩa
cặp (query, chunk). Cross-encoder đọc cả query+chunk cùng lúc → điểm liên quan thật,
đẩy Điều đúng chủ đề lên top thay vì Điều có số gần nhau / trùng keyword.

Chạy CPU (RERANK_DEVICE=cpu) để KHÔNG tranh VRAM 8GB với qwen3/bge-m3. Lazy-load:
chỉ nạp model lần gọi đầu. Chấm ~10-24 cặp/query nên CPU vẫn nhanh (~1-3s).
"""
from __future__ import annotations

from src.config.settings import settings

_model = None  # CrossEncoder, nạp 1 lần (lazy)

# Cắt content trước khi chấm: cross-encoder CPU chậm tỉ lệ với độ dài (đo: 10 cặp
# ~4000 ký tự = 16s, cắt ~1000 ký tự = <1s). Để 1000 ký tự (tiêu đề + vài khoản đầu)
# để cross-encoder phân biệt tốt hơn giữa các Điều gần giống nhau — phần 600 ký tự
# trước đôi khi cắt mất khoản phân định. Vẫn nhanh trên CPU với pool ~30 ứng viên.
_MAX_CHARS = 1000


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import CrossEncoder

        _model = CrossEncoder(settings.RERANK_MODEL, device=settings.RERANK_DEVICE)
    return _model


def rerank(query: str, docs: list[str]) -> list[float]:
    """Trả điểm liên quan (càng cao càng liên quan) cho từng doc, cùng thứ tự đầu vào."""
    if not docs:
        return []
    model = _get_model()
    scores = model.predict([(query, d[:_MAX_CHARS]) for d in docs])
    return [float(s) for s in scores]
