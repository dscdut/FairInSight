import re
import logging
import structlog
from typing import Tuple

logger = structlog.get_logger(__name__)

# Pattern for adversarial intent in Vietnamese legal context
ADVERSARIAL_PATTERNS = [
    # Evasion/Loophole seeking
    r"lách luật",
    r"trốn thuế",
    r"không bị phát hiện",
    r"giấu diếm",
    r"qua mặt",
    r"làm sao để không bị bắt",
    r"cách lẩn tránh",
    # Jailbreak attempts
    r"ignore previous instructions",
    r"bỏ qua các chỉ dẫn",
    r"hãy đóng vai",
    r"pretend you are",
    # Political/Sensitive
    r"phản động",
    r"chống đối nhà nước"
]

async def scan_for_adversarial_intent(query: str) -> Tuple[bool, str]:
    """
    NLP middleware to detect malicious or adversarial intent.
    Returns (is_adversarial, matched_pattern).
    """
    if not query:
        return False, ""

    query_lower = query.lower()
    
    for pattern in ADVERSARIAL_PATTERNS:
        if re.search(pattern, query_lower):
            logger.warning("security_violation_detected", pattern=pattern, query_snippet=query[:50])
            return True, pattern
            
    return False, ""
