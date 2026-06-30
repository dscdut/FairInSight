import re
import unicodedata

ABBR_MAP = {
    "blld": "Bo luat Lao dong",
    "blds": "Bo luat Dan su",
    "blhs": "Bo luat Hinh su",
}


def normalize_text(text: str) -> str:
    """Normalize text while preserving meaningful structural breaks."""
    text = unicodedata.normalize("NFKC", text)
    # Collapse horizontal spaces but keep single newlines if they look like list items
    # Replace multiple newlines with double newline to separate paragraphs
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n", "\n\n", text)
    return text.strip()


def extract_number(text: str, prefix_pattern: str) -> str:
    """Extract number/identifier following a prefix (e.g., 'Điều', 'Chương')."""
    # Ensure it starts with a digit or Roman numeral (for Chapters)
    match = re.search(rf"{prefix_pattern}\s+([IVXLCDM\d]+[\w\.]*)", text, re.IGNORECASE)
    return match.group(1) if match else ""


def expand_abbreviation(text: str) -> str:
    lowered = text.lower()
    for abbr, full in ABBR_MAP.items():
        lowered = re.sub(rf"\b{abbr}\b", full, lowered)
    return lowered
