"""Module A/B/C deterministic extraction for DOCX contracts."""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from typing import Any

from src.schema.dto.contract import (
    ContractClause,
    ContractModuleAResult,
    ContractObligation,
    ContractParty,
    ContractReference,
    ContractRelationship,
    ContractRiskCandidate,
    ContractTable,
)
from src.services.contracts.docx_reader import DocxBlock


ARTICLE_RE = re.compile(r"^(?:Điều|Dieu)\s+([0-9]+[A-Za-z]?)\s*[.:]?\s*(.*)$", re.I)
CLAUSE_RE = re.compile(r"^([0-9]+)\.([0-9]+)\.?\s+(.*)$")
POINT_RE = re.compile(r"^([a-zđ])\)\s+(.*)$", re.I)
REF_RE = re.compile(
    r"\b(Điều|Dieu|Khoản|Khoan|Bảng|Bang)\s+([0-9]+(?:\.[0-9]+)?)\b|\b(Phụ lục|Phu luc)\s+([A-ZĐ0-9]+)\b",
    re.I,
)
MONEY_RE = re.compile(r"(\d{1,3}(?:[.\s]\d{3})+(?:\s*(?:VNĐ|VND|đồng))?|\d+%)", re.I)
DATE_RE = re.compile(
    r"(\d{1,2}\s+ngày làm việc|\d{1,2}\s+ngày|\d{1,2}\s+tuần|Tuần\s+\d+(?:-\d+)?|"
    r"ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4})",
    re.I,
)

ACTION_CUES = (
    "phai", "co trach nhiem", "cung cap", "thanh toan", "ban giao", "khac phuc",
    "ho tro", "bao mat", "khong duoc", "duoc quyen", "gui", "xac nhan", "phe duyet",
    "lam viec", "van hanh", "giu",
)
RISKY_PHRASES = ("phu hop", "hop ly", "kip thoi", "theo yeu cau", "co the", "se xem xet")


def _clean(text: str) -> str:
    return " ".join((text or "").replace("\xa0", " ").split())


def _norm_key(text: str) -> str:
    value = _clean(text).lower().replace("đ", "d")
    decomposed = unicodedata.normalize("NFD", value)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def _topic(text: str) -> str:
    n = _norm_key(text)
    if any(key in n for key in ("thanh toan", "gia tri", "tien", "phi")):
        return "payment"
    if any(key in n for key in ("nghiem thu", "ban giao", "tien do", "moc")):
        return "acceptance_schedule"
    if any(key in n for key in ("bao mat", "du lieu", "thong tin")):
        return "confidentiality_data"
    if any(key in n for key in ("so huu tri tue", "ban quyen", "ma nguon")):
        return "intellectual_property"
    if any(key in n for key in ("phat", "boi thuong", "trach nhiem")):
        return "liability_penalty"
    if any(key in n for key in ("cham dut", "huy", "don phuong")):
        return "termination"
    if any(key in n for key in ("tranh chap", "toa an", "thuong luong")):
        return "dispute"
    if any(key in n for key in ("lao dong", "tang ca", "lam them", "ngay nghi", "bang cap")):
        return "labor_terms"
    return "general"


def _clause_topic(clause: ContractClause) -> str:
    return _topic(f"{clause.title} {clause.text}")


def build_module_a(blocks: list[DocxBlock], filename: str) -> ContractModuleAResult:
    clauses, tables = _parse_structure(blocks)
    parties = _extract_parties(tables, blocks)
    obligations = _extract_obligations(clauses)
    relationships = _extract_relationships(clauses, parties)
    money_terms = _extract_money_terms(clauses, tables)
    timeline_terms = _extract_timeline_terms(clauses, tables)
    references = _check_internal_references(clauses)
    risks = _build_risk_candidates(clauses, parties, money_terms, references)
    document_info = _document_info(blocks, filename, clauses)
    clean_context = _clean_context(
        document_info, parties, clauses, tables, obligations, relationships, money_terms, timeline_terms, risks
    )
    warnings: list[str] = []
    if not clauses:
        warnings.append("Không nhận diện được Điều/Khoản rõ ràng trong DOCX.")
    if not parties:
        warnings.append("Không nhận diện được bảng thông tin các bên.")
    return ContractModuleAResult(
        document_info=document_info,
        parties=parties,
        clauses=clauses,
        tables=tables,
        obligations=obligations,
        relationships=relationships,
        money_terms=money_terms,
        timeline_terms=timeline_terms,
        internal_references=references,
        risk_candidates=risks,
        clean_context=clean_context,
        warnings=warnings,
    )


def _parse_structure(blocks: list[DocxBlock]) -> tuple[list[ContractClause], list[ContractTable]]:
    clauses: list[ContractClause] = []
    tables: list[ContractTable] = []
    current_article_id: str | None = None
    current_clause_id: str | None = None
    order = 0
    article_numbers: Counter[str] = Counter()

    for block in blocks:
        if block.kind == "table":
            table_id = f"T{len(tables) + 1}"
            headers = block.rows[0] if block.rows else []
            data_rows = block.rows[1:] if len(block.rows) > 1 else []
            tables.append(ContractTable(
                table_id=table_id,
                nearest_clause_id=current_clause_id or current_article_id,
                headers=headers,
                rows=data_rows,
            ))
            if clauses:
                clauses[-1].table_ids.append(table_id)
            continue

        text = _clean(block.text)
        article_match = ARTICLE_RE.match(text)
        clause_match = CLAUSE_RE.match(text)
        point_match = POINT_RE.match(text)
        if article_match:
            order += 1
            number = article_match.group(1)
            article_numbers[number] += 1
            suffix = f".{article_numbers[number]}" if article_numbers[number] > 1 else ""
            current_article_id = f"D{number}{suffix}"
            current_clause_id = current_article_id
            clauses.append(ContractClause(
                clause_id=current_article_id,
                level="article",
                number=number,
                title=_clean(article_match.group(2)),
                text=text,
                order=order,
            ))
        elif clause_match:
            order += 1
            number = f"{clause_match.group(1)}.{clause_match.group(2)}"
            current_clause_id = f"D{number}"
            clauses.append(ContractClause(
                clause_id=current_clause_id,
                level="clause",
                number=number,
                text=_clean(clause_match.group(3)),
                parent_id=current_article_id,
                order=order,
            ))
        elif point_match and current_clause_id:
            order += 1
            number = point_match.group(1)
            clauses.append(ContractClause(
                clause_id=f"{current_clause_id}.{number}",
                level="point",
                number=number,
                text=_clean(point_match.group(2)),
                parent_id=current_clause_id,
                order=order,
            ))
        elif clauses:
            previous = clauses[-1]
            previous.text = _clean(f"{previous.text} {text}")
        else:
            order += 1
            clauses.append(ContractClause(
                clause_id=f"P{order}",
                level="article",
                number=str(order),
                title="Phần mở đầu",
                text=text,
                order=order,
            ))
            current_article_id = clauses[-1].clause_id
            current_clause_id = current_article_id
    return clauses, tables


def _extract_parties(tables: list[ContractTable], blocks: list[DocxBlock] | None = None) -> list[ContractParty]:
    for table in tables:
        header = [_norm_key(cell) for cell in table.headers]
        side_indexes = [
            (index, table.headers[index].strip())
            for index, cell in enumerate(header)
            if index > 0 and (
                re.match(r"^ben\s+[a-z0-9]+", cell)
                or cell in {"nguoi su dung lao dong", "nguoi lao dong"}
            )
        ]
        if len(side_indexes) >= 2:
            by_side = {side: {} for _, side in side_indexes}
            for row in table.rows:
                if len(row) < 2:
                    continue
                key = _norm_key(row[0])
                for index, side in side_indexes:
                    if index < len(row):
                        by_side[side][key] = row[index]
            return [_party_from_map(side, data) for side, data in by_side.items()]
    if blocks:
        paragraph_parties = _extract_parties_from_paragraphs(blocks)
        if paragraph_parties:
            return paragraph_parties
    return []


def _extract_parties_from_paragraphs(blocks: list[DocxBlock]) -> list[ContractParty]:
    parties: list[ContractParty] = []
    current_side: str | None = None
    current_data: dict[str, str] = {}
    side_re = re.compile(r"^(Ben\s+[A-Z0-9]+|Bên\s+[A-Z0-9]+|Người sử dụng lao động|Nguoi su dung lao dong|Người lao động|Nguoi lao dong)$", re.I)
    key_re = re.compile(r"^([^:：]{2,40})[:：]\s*(.+)$")

    def flush() -> None:
        nonlocal current_side, current_data
        if current_side and current_data:
            parties.append(_party_from_map(current_side, current_data))
        current_side = None
        current_data = {}

    for block in blocks[:35]:
        if block.kind != "paragraph":
            continue
        text = _clean(block.text)
        if not text:
            continue
        if ARTICLE_RE.match(text):
            break
        if side_re.match(text):
            flush()
            current_side = text
            continue
        if not current_side:
            continue
        match = key_re.match(text)
        if match:
            current_data[_norm_key(match.group(1))] = _clean(match.group(2))
    flush()
    return parties if len(parties) >= 2 else []


def _party_from_map(side: str, data: dict[str, str]) -> ContractParty:
    name = data.get("ten don vi") or data.get("ten") or data.get("ho ten") or data.get("ten cong ty") or ""
    address = data.get("dia chi lien he") or data.get("dia chi") or ""
    return ContractParty(
        side=side,
        name=name,
        role=data.get("vai tro", ""),
        representative=data.get("dai dien", ""),
        position=data.get("chuc vu", ""),
        address=address,
        email=data.get("email", ""),
        raw=data,
    )


def _extract_obligations(clauses: list[ContractClause]) -> list[ContractObligation]:
    obligations: list[ContractObligation] = []
    for clause in clauses:
        text = clause.text
        norm = _norm_key(text)
        if clause.clause_id.startswith("P") or (text.startswith("Điều ") and len(text) < 90):
            continue
        if not any(cue in norm for cue in ACTION_CUES):
            continue
        actor = _detect_actor(norm)
        deadline = _first_match(DATE_RE, text)
        consequence = None
        if any(cue in norm for cue in ("neu", "truong hop", "qua han", "phat", "cham dut", "boi thuong")):
            consequence = text
        obligations.append(ContractObligation(
            obligation_id=f"O{len(obligations) + 1}",
            actor=actor,
            action=text,
            deadline=deadline,
            consequence=consequence,
            source_clause_id=clause.clause_id,
            confidence=0.72 if actor != "Các bên" else 0.58,
        ))
    return obligations


def _extract_relationships(
    clauses: list[ContractClause], parties: list[ContractParty]
) -> list[ContractRelationship]:
    side_labels = [party.side for party in parties]
    norm_to_side = {_norm_key(side): side for side in side_labels}
    relationships: list[ContractRelationship] = []
    relation_patterns = [
        ("cung cấp cho", r"\b(ben\s+[a-z0-9]+)\s+cung cap\b.*?\bcho\s+(ben\s+[a-z0-9]+)\b"),
        ("thanh toán cho", r"\b(ben\s+[a-z0-9]+)\s+thanh toan\b.*?\bcho\s+(ben\s+[a-z0-9]+)\b"),
        ("bàn giao cho", r"\b(ben\s+[a-z0-9]+)\s+(?:ban giao|gui)\b.*?\bcho\s+(ben\s+[a-z0-9]+)\b"),
        ("bảo lãnh cho", r"\b(ben\s+[a-z0-9]+)\s+bao lanh\b.*?\bcho\s+(ben\s+[a-z0-9]+)\b"),
        ("phối hợp với", r"\b(ben\s+[a-z0-9]+)\s+phoi hop\b.*?\bvoi\s+(ben\s+[a-z0-9]+)\b"),
    ]
    for clause in clauses:
        norm = _norm_key(clause.text)
        for relation, pattern in relation_patterns:
            for match in re.finditer(pattern, norm):
                from_side = norm_to_side.get(match.group(1))
                to_side = norm_to_side.get(match.group(2))
                if not from_side:
                    continue
                relationships.append(ContractRelationship(
                    relationship_id=f"REL{len(relationships) + 1}",
                    from_party=from_side,
                    to_party=to_side,
                    relation=relation,
                    source_clause_id=clause.clause_id,
                    evidence=clause.text,
                ))
    return relationships


def _detect_actor(norm_text: str) -> str:
    if norm_text.startswith("nguoi lao dong"):
        return "Người lao động"
    if norm_text.startswith("nguoi su dung lao dong"):
        return "Người sử dụng lao động"
    if "ben b co quyen" in norm_text or "ben b khac phuc" in norm_text:
        return "Bên B"
    if re.search(r"\bben b\s+(cung cap|khong cung cap|chi duoc|gui|ban giao|ho tro|bao mat|khong duoc|phai)", norm_text):
        return "Bên B"
    if "do ben a chi tra" in norm_text or "ben a thanh toan" in norm_text:
        return "Bên A"
    if re.search(r"\bben a\s+(cung cap|cu|gui|xac nhan|phe duyet|phan hoi|chap thuan)", norm_text):
        return "Bên A"
    if "ben a" in norm_text and "ben b" not in norm_text:
        return "Bên A"
    if "ben b" in norm_text and "ben a" not in norm_text:
        return "Bên B"
    if "ben a" in norm_text and "ben b" in norm_text:
        return "Hai bên"
    if "nguoi su dung lao dong" in norm_text:
        return "Người sử dụng lao động"
    if "nguoi lao dong" in norm_text:
        return "Người lao động"
    return "Các bên"


def _extract_money_terms(clauses: list[ContractClause], tables: list[ContractTable]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for clause in clauses:
        for value in MONEY_RE.findall(clause.text):
            items.append({"value": _clean(value), "source": "clause", "source_clause_id": clause.clause_id})
    for table in tables:
        joined = " ".join(" ".join(row) for row in table.rows)
        for value in MONEY_RE.findall(joined):
            items.append({"value": _clean(value), "source": "table", "table_id": table.table_id})
    return _dedupe_dicts(items, ["value", "source_clause_id", "table_id"])


def _extract_timeline_terms(clauses: list[ContractClause], tables: list[ContractTable]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for clause in clauses:
        for value in DATE_RE.findall(clause.text):
            items.append({"value": _clean(value), "source_clause_id": clause.clause_id, "topic": _topic(clause.text)})
    for table in tables:
        joined = " ".join(" ".join(row) for row in table.rows)
        for value in DATE_RE.findall(joined):
            items.append({"value": _clean(value), "table_id": table.table_id, "topic": "table"})
    return _dedupe_dicts(items, ["value", "source_clause_id", "table_id"])


def _check_internal_references(clauses: list[ContractClause]) -> list[ContractReference]:
    article_by_number = {item.number: item.clause_id for item in clauses if item.level == "article"}
    clause_by_number = {item.number: item.clause_id for item in clauses if item.level in {"article", "clause"}}
    table_numbers = {
        match.group(1)
        for item in clauses
        for match in re.finditer(r"\bBảng\s+([0-9]+)", item.text, re.I)
    }
    references: list[ContractReference] = []
    for clause in clauses:
        for match in REF_RE.findall(clause.text):
            kind = match[0] or match[2]
            label = match[1] or match[3]
            if clause.level == "article" and label == clause.number:
                continue
            norm_kind = _norm_key(kind)
            target_type = {
                "dieu": "Điều",
                "khoan": "Khoản",
                "bang": "Bảng",
                "phu luc": "Phụ lục",
            }.get(norm_kind, kind.capitalize())
            exists = True
            target_id = None
            if target_type == "Điều":
                target_id = article_by_number.get(label) or clause_by_number.get(label)
                exists = target_id is not None
            elif target_type == "Khoản":
                target_id = clause_by_number.get(label)
                exists = target_id is not None
            elif target_type == "Bảng":
                exists = label in table_numbers or (label.isdigit() and int(label) > 0)
                target_id = f"Bảng {label}" if exists else None
            references.append(ContractReference(
                source_clause_id=clause.clause_id,
                target_type=target_type,
                target_label=f"{kind} {label}",
                target_exists=exists,
                target_id=target_id,
                note="ok" if exists else "Không tìm thấy mục được dẫn chiếu trong cấu trúc đã tách.",
            ))
    return references


def _build_risk_candidates(
    clauses: list[ContractClause],
    parties: list[ContractParty],
    money_terms: list[dict[str, Any]],
    references: list[ContractReference],
) -> list[ContractRiskCandidate]:
    risks: list[ContractRiskCandidate] = []
    if len(parties) < 2:
        risks.append(_risk("missing_party", "high", "Thiếu thông tin các bên", "Không nhận diện đủ Bên A/Bên B.", None, risks))
    if not money_terms:
        risks.append(_risk("missing_money", "medium", "Thiếu giá trị/thanh toán", "Không thấy số tiền hoặc tỷ lệ thanh toán rõ.", None, risks))
    for ref in references:
        if not ref.target_exists:
            risks.append(_risk("broken_reference", "high", "Dẫn chiếu nội bộ không khớp", f"{ref.target_label} không tồn tại.", ref.source_clause_id, risks))
    found_topics = {_clause_topic(item) for item in clauses}
    for topic, label in {
        "payment": "thanh toán",
        "acceptance_schedule": "nghiệm thu/tiến độ",
        "confidentiality_data": "bảo mật/dữ liệu",
        "intellectual_property": "sở hữu trí tuệ",
        "termination": "chấm dứt",
        "dispute": "tranh chấp",
    }.items():
        if topic not in found_topics:
            risks.append(_risk("missing_topic", "medium", f"Thiếu nhóm điều khoản {label}", f"Chưa thấy điều khoản {label} rõ.", None, risks))
    for clause in clauses:
        norm = _norm_key(clause.text)
        if any(phrase in norm for phrase in RISKY_PHRASES) and not _first_match(DATE_RE, clause.text):
            risks.append(_risk("ambiguous_wording", "low", "Cụm từ mơ hồ", "Có cụm từ mở nhưng chưa thấy hạn/mốc cụ thể.", clause.clause_id, risks))
        if "chi phi" in norm and "ngoai pham vi" in norm:
            risks.append(_risk("scope_cost", "medium", "Chi phí ngoài phạm vi", "Có chi phí ngoài phạm vi hợp đồng; cần kiểm tra cơ chế phê duyệt và giới hạn chi phí.", clause.clause_id, risks))
        if "duoc xem la da nghiem thu" in norm:
            risks.append(_risk("deemed_acceptance", "medium", "Tự động nghiệm thu", "Có cơ chế xem như đã nghiệm thu nếu hết hạn phản hồi; cần kiểm tra thời hạn và cách thông báo.", clause.clause_id, risks))
        if "tam dung trien khai" in norm:
            risks.append(_risk("service_suspension", "medium", "Quyền tạm dừng triển khai", "Có quyền tạm dừng khi chậm thanh toán; cần kiểm tra điều kiện, thông báo và hậu quả.", clause.clause_id, risks))
        if "gioi han trach nhiem" in norm or "khong vuot qua" in norm:
            risks.append(_risk("liability_cap", "medium", "Giới hạn trách nhiệm", "Có giới hạn trách nhiệm/bồi thường; cần đối chiếu với loại thiệt hại và luật áp dụng.", clause.clause_id, risks))
        if any(key in norm for key in ("lam viec 12 gio", "tang ca", "lam them gio", "khong tinh luong lam them")):
            risks.append(_risk("labor_overtime", "high", "Làm thêm giờ/thời giờ làm việc", "Có dấu hiệu thời giờ làm việc hoặc làm thêm giờ cần đối chiếu giới hạn và điều kiện theo pháp luật lao động.", clause.clause_id, risks))
        if "khong nghi" in norm or "khong co ngay nghi" in norm:
            risks.append(_risk("labor_rest", "high", "Thiếu thời gian nghỉ", "Có dấu hiệu hạn chế thời gian nghỉ/ngày nghỉ của người lao động.", clause.clause_id, risks))
        if "giu ban goc" in norm or "giu giay to" in norm or "giu bang cap" in norm:
            risks.append(_risk("labor_document_retention", "high", "Giữ giấy tờ gốc", "Có dấu hiệu giữ giấy tờ/bằng cấp gốc của người lao động; cần kiểm tra tính hợp pháp.", clause.clause_id, risks))
    return risks


def _risk(kind: str, severity: str, title: str, detail: str, clause_id: str | None, risks: list) -> ContractRiskCandidate:
    return ContractRiskCandidate(
        risk_id=f"R{len(risks) + 1}",
        kind=kind,
        severity=severity,  # type: ignore[arg-type]
        title=title,
        detail=detail,
        source_clause_id=clause_id,
    )


def _document_info(blocks: list[DocxBlock], filename: str, clauses: list[ContractClause]) -> dict[str, Any]:
    text = "\n".join(block.text for block in blocks[:12] if block.text)
    title = ""
    for line in text.splitlines():
        if "hop dong" in _norm_key(line):
            title = line
            break
    return {
        "filename": filename,
        "title": title or (clauses[0].title if clauses else ""),
        "block_count": len(blocks),
        "clause_count": len(clauses),
        "first_lines": [block.text for block in blocks[:5] if block.text],
    }


def _clean_context(
    document_info: dict[str, Any],
    parties: list[ContractParty],
    clauses: list[ContractClause],
    tables: list[ContractTable],
    obligations: list[ContractObligation],
    relationships: list[ContractRelationship],
    money_terms: list[dict[str, Any]],
    timeline_terms: list[dict[str, Any]],
    risks: list[ContractRiskCandidate],
) -> dict[str, Any]:
    return {
        "summary": {
            "filename": document_info.get("filename"),
            "title": document_info.get("title"),
            "party_count": len(parties),
            "clause_count": len(clauses),
            "table_count": len(tables),
            "obligation_count": len(obligations),
            "relationship_count": len(relationships),
            "risk_count": len(risks),
        },
        "party_names": [party.name for party in parties if party.name],
        "key_clause_ids": [item.clause_id for item in clauses[:12]],
        "money_values": [item["value"] for item in money_terms[:12]],
        "timeline_values": [item["value"] for item in timeline_terms[:12]],
        "risk_titles": [item.title for item in risks[:12]],
    }


def _first_match(pattern: re.Pattern[str], text: str) -> str | None:
    match = pattern.search(text)
    return _clean(match.group(1)) if match else None


def _dedupe_dicts(items: list[dict[str, Any]], keys: list[str]) -> list[dict[str, Any]]:
    seen = set()
    output = []
    for item in items:
        identity = tuple(item.get(key) for key in keys)
        if identity in seen:
            continue
        seen.add(identity)
        output.append(item)
    return output
