"""OpenRouter-backed LLM service using tiered Mistral models."""

from __future__ import annotations

import json
from typing import Any

from openai import AsyncOpenAI

from app.core.config import Settings


class FairInsightLLM:
    """LLM service with strict model routing for intake and legal analysis."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = AsyncOpenAI(
            base_url=settings.llm.base_url,
            api_key=settings.llm.api_key,
            default_headers=self._headers,
        )

    @property
    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {
            "HTTP-Referer": self._settings.llm.site_url,
            "X-Title": self._settings.llm.app_name,
        }
        if self._settings.llm.organization_id:
            headers["X-Organization-Id"] = self._settings.llm.organization_id
        if self._settings.llm.organization_name:
            headers["X-Organization-Name"] = self._settings.llm.organization_name
        return headers

    async def classify_intake(self, user_query: str) -> dict[str, Any]:
        """Use cheap model for intent and retrieval query extraction."""
        system_prompt = (
            "Bạn là Intake Agent cho hệ thống pháp lý Việt Nam. "
            "Trả về JSON hợp lệ với keys: intent, search_query, domains. "
            "domains là mảng text snake_case, ví dụ: lao_dong, thue, doanh_nghiep, dan_su, dat_dai, hinh_su, hanh_chinh."
        )

        response = await self._client.chat.completions.create(
            model=self._settings.llm.router_model,
            temperature=self._settings.llm.router_temperature,
            max_tokens=self._settings.llm.router_max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_query},
            ],
        )

        content = response.choices[0].message.content or "{}"
        try:
            payload = json.loads(content)
        except json.JSONDecodeError:
            payload = {}

        intent = str(payload.get("intent") or "legal_qa")
        search_query = str(payload.get("search_query") or user_query)

        raw_domains = payload.get("domains")
        domains: list[str] = []
        if isinstance(raw_domains, list):
            domains = [str(item).strip() for item in raw_domains if str(item).strip()]

        return {
            "intent": intent,
            "search_query": search_query,
            "domains": domains,
        }

    async def analyze_legal_answer(self, user_query: str, context: str) -> str:
        """Use high-quality model for final legal reasoning synthesis."""
        system_prompt = (
            "Bạn là Analyst Agent của FairInsight. "
            "Chỉ trả lời dựa trên context pháp lý được cung cấp. "
            "Nếu nguồn không đủ, nêu rõ giới hạn và đề xuất kiểm chứng thêm. "
            "Trả lời tiếng Việt, súc tích, có cấu trúc rõ ràng.\n\n"
            "### FEW-SHOT EXAMPLES ###\n"
            "[EXAMPLE 1]\n"
            "User Query: \"Công ty tự ý đuổi việc tôi không báo trước có vi phạm không?\"\n"
            "Context: [{\"law_title\": \"Bộ luật Lao động 2019\", \"article\": \"Điều 36\", \"content\": \"Quyền đơn phương chấm dứt hợp đồng lao động của người sử dụng lao động...\"}]\n"
            "Response: \n"
            "\"Chào bạn, dựa trên quy định của pháp luật hiện hành, trường hợp của bạn được giải quyết như sau:\n"
            "Theo **Khoản 1 Điều 36 Bộ luật Lao động 2019**, người sử dụng lao động có quyền đơn phương chấm dứt hợp đồng nhưng phải báo trước...\"\n"
            "\n"
            "[EXAMPLE 2]\n"
            "User Query: \"Luật pháp có cho phép tôi cưới 2 vợ không?\"\n"
            "Context: [{\"law_title\": \"Luật Hôn nhân và Gia đình 2014\", \"article\": \"Điều 5\", \"content\": \"Bảo vệ chế độ hôn nhân và gia đình. 2. Cấm các hành vi sau đây: c) Người đang có vợ...\"}]\n"
            "Response:\n"
            "\"Chào bạn, \n"
            "Theo điểm c **Khoản 2 Điều 5 Luật Hôn nhân và Gia đình 2014**, pháp luật Việt Nam nghiêm cấm hành vi người đang có vợ, có chồng mà kết hôn hoặc chung sống như vợ chồng với người khác. Do đó, chế độ đa thê không được pháp luật công nhận.\"\n"
            "### END OF EXAMPLES ###"
        )
        user_prompt = (
            "### Câu hỏi người dùng\n"
            f"{user_query}\n\n"
            "### Nguồn pháp lý đã truy xuất\n"
            f"{context}\n\n"
            "### Yêu cầu\n"
            "1) Tóm tắt kết luận chính\n"
            "2) Liệt kê căn cứ liên quan\n"
            "3) Nêu rủi ro/hạn chế nếu có\n"
        )

        response = await self._client.chat.completions.create(
            model=self._settings.llm.analyst_model,
            temperature=self._settings.llm.analyst_temperature,
            max_tokens=self._settings.llm.analyst_max_tokens,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content
        return content or "Không tạo được phân tích pháp lý."

    async def review_draft(self, context: str, draft: str) -> dict[str, Any]:
        """Audit the draft to ensure no hallucinations and exact citations."""
        system_prompt = (
            "You are a strict Legal Auditor. Check if the DRAFT cites EXACTLY the laws provided in the CONTEXT. "
            "Output valid JSON: {\"is_valid\": bool, \"feedback\": \"str\"}"
        )
        user_prompt = f"CONTEXT:\n{context}\n\nDRAFT:\n{draft}"

        response = await self._client.chat.completions.create(
            model=self._settings.llm.router_model,
            temperature=0.0,
            max_tokens=self._settings.llm.router_max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content or "{}"
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"is_valid": False, "feedback": "Failed to parse JSON."}
