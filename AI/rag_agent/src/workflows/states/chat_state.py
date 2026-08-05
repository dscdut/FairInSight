"""ChatState — state machine của chat graph (CHAT_PROCESSING_FLOW_DESIGN §5).

MVP Lookup dùng tập con; field deep reasoning để sẵn cho Phase sau.
"""

from __future__ import annotations

from typing import Optional, TypedDict


class ChatState(TypedDict, total=False):
    # input
    session_id: str
    user_id: Optional[str]           # UUID người dùng (đăng nhập); None = ẩn danh
    user_message: str
    normalized_question: Optional[str]
    chat_history: list[dict]         # [{role, content}] vài lượt gần nhất (ngữ cảnh)
    in_deep_session: bool            # phiên ĐÃ từng vào deep → follow-up không mời-gộp lại
    asked_facts_before: bool         # đã hỏi lại dữ kiện trong phiên → lượt sau phải kết luận

    # routing
    mode: Optional[str]              # lookup | explain | deep_reasoning_pending | out_of_scope
    route_confidence: Optional[float]
    topic: Optional[str]             # chủ đề câu hỏi (router gắn) — dùng cho câu mời deep
    guardrail_status: Optional[str]  # allow | refuse | abusive | self_harm

    # query plan (lookup)
    query_filters: dict              # official_code, article_no, tier, domains, province...
    retrieval_plan: dict             # {retriever: citation|hybrid, filters} — B5

    # --- deep reasoning ---
    deep_confirmed: bool             # user đã đồng ý phân tích sâu chưa
    external_persistence: bool       # API facade lưu turn atomic; graph không ghi trùng
    case_frame: dict                 # khung vụ việc (parties, domains, case_types)
    facts: dict                      # dữ kiện đã biết
    missing_facts: list[dict]        # dữ kiện còn thiếu (+ câu hỏi gợi ý)
    missing_decision: Optional[str]  # ask_user | continue_conditionally
    reasoning_branch: Optional[str]  # rights_duties | sanction | procedure | temporal...
    hypotheses: list[dict]           # đường đi pháp lý nội bộ
    investigation_round: int         # vòng lặp điều tra hiện tại
    sufficiency: str                 # enough | need_more_retrieval | need_user
    answer_outline: list[str]        # khung câu trả lời cuối
    _next_queries: list[str]         # gợi ý truy vấn cho vòng investigation sau

    # retrieval
    evidence: list[dict]             # EvidenceUnit dạng dict
    citations: list[dict]            # citation đã verify

    # answer
    draft_answer: Optional[str]
    final_answer: Optional[str]
    risk: Optional[str]              # low | medium | high (đánh giá rủi ro câu trả lời)

    # trace
    steps: list[dict]
    warnings: list[str]
