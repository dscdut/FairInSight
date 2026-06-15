import re

VALID_DOC_TYPES = {"luat", "nghi_dinh", "thong_tu", "quyet_dinh", "nghi_quyet"}


def validate_doc_type(doc_type: str) -> bool:
    return doc_type in VALID_DOC_TYPES


def validate_chunk_id(chunk_id: str) -> bool:
    return bool(re.match(r"^[A-Za-z0-9_\-]{3,200}$", chunk_id))
