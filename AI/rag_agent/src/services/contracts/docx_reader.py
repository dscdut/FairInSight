"""DOCX reader for contract analysis.

Module nay chi doc DOCX va giu thu tu paragraph/table de Module A tach du lieu sach.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from io import BytesIO
from typing import Any, Iterable

from docx import Document
from docx.document import Document as DocxDocument
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph


@dataclass
class DocxBlock:
    index: int
    kind: str
    text: str = ""
    rows: list[list[str]] = field(default_factory=list)


def _iter_block_items(parent: DocxDocument) -> Iterable[Paragraph | Table]:
    for child in parent.element.body.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def _cell_text(value: str) -> str:
    return " ".join((value or "").replace("\xa0", " ").split())


def read_docx_blocks(data: bytes) -> list[DocxBlock]:
    document = Document(BytesIO(data))
    blocks: list[DocxBlock] = []
    for index, item in enumerate(_iter_block_items(document)):
        if isinstance(item, Paragraph):
            text = _cell_text(item.text)
            if text:
                blocks.append(DocxBlock(index=index, kind="paragraph", text=text))
            continue
        rows: list[list[str]] = []
        for row in item.rows:
            rows.append([_cell_text(cell.text) for cell in row.cells])
        text = "\n".join(" | ".join(cell for cell in row if cell) for row in rows)
        blocks.append(DocxBlock(index=index, kind="table", text=text, rows=rows))
    return blocks


def blocks_to_json(blocks: list[DocxBlock]) -> list[dict[str, Any]]:
    return [
        {
            "index": block.index,
            "kind": block.kind,
            "text": block.text,
            "rows": block.rows,
        }
        for block in blocks
    ]
