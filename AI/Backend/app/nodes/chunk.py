import re
from app.graphs.state import GraphState
from app.utils.text_utils import normalize_text, extract_number


def _get_contextual_prefix(doc_title: str, chapter: str, section: str) -> str:
    parts = [f"Văn bản: {doc_title}"]
    if chapter:
        parts.append(chapter)
    if section:
        parts.append(section)
    return " | ".join(parts) + "\n\n"


async def run(state: GraphState) -> GraphState:
    raw_text = state.get("raw_text") or ""
    doc_title = (
        state.get("doc_title") or (state.get("file_path") or "unknown").split("/")[-1].split(".")[0]
    )
    doc_id = (state.get("file_path") or "unknown").split("/")[-1].split(".")[0]

    # Split by "Điều" or "Dieu" using lookahead
    # Also need to identify "Chương" and "Mục" to maintain context
    sections = re.split(r"(?im)(?=^(?:\#+\s*)?(?:Dieu|Điều)\s+\d+)", raw_text)

    chunks: list[dict] = []
    current_chapter = ""
    current_section = ""

    for idx, content in enumerate(sections):
        # Clean the content
        content = normalize_text(content)
        if not content:
            continue

        # Look for Chapter or Section titles within this content to update state for NEXT chunks
        # Note: Usually a "Điều" is within a Chapter/Section.
        # If this is the FIRST chunk (preamble), it might contain the first Chapter title.

        # Check for Chapter (Chương)
        chapter_match = re.search(
            r"(?im)^(?:Chương|Chuong)\s+([IVXLCDM\d\.]+)(?::?\s*(.*))?", content
        )
        if chapter_match:
            chapter_num = chapter_match.group(1)
            chapter_name = chapter_match.group(2) or ""
            current_chapter = f"Chương {chapter_num}: {chapter_name.strip()}".strip(" :")
            current_section = ""  # Reset section when chapter changes

        # Check for Section (Mục)
        section_match = re.search(r"(?im)^(?:Mục|Muc)\s+(\d+)(?::?\s*(.*))?", content)
        if section_match:
            section_num = section_match.group(1)
            section_name = section_match.group(2) or ""
            current_section = f"Mục {section_num}: {section_name.strip()}".strip(" :")

        # Determine if this chunk is an Article or Preamble
        article_num = extract_number(content, "(?:Dieu|Điều)")

        if article_num:
            article_ref = f"Điều {article_num}"
        else:
            article_ref = "Lời nói đầu" if idx == 0 else f"Phần {idx}"

        # Prepend context to improve embedding/retrieval quality
        prefix = _get_contextual_prefix(doc_title, current_chapter, current_section)
        contextual_content = prefix + content

        # Check if content is too long (> 2000 chars) and split if necessary
        # 2000 chars is roughly 500-700 tokens, safe for most embedding models
        if len(contextual_content) > 2000:
            # Try to split by "Khoản" (e.g., "1. ", "2. ")
            sub_sections = re.split(r"(?m)^(\d+\.\s+)", content)
            if len(sub_sections) > 1:
                # re.split with capturing group keeps the group in the list
                # sub_sections looks like ['', '1. ', 'Content...', '2. ', 'Content...']
                current_sub = sub_sections[0]
                intro = current_sub.strip()
                for i in range(1, len(sub_sections), 2):
                    marker = sub_sections[i]
                    sub_text = sub_sections[i + 1]
                    if intro:
                        combined = prefix + intro + "\n" + marker + sub_text
                    else:
                        combined = prefix + marker + sub_text
                    chunks.append(
                        {
                            "chunk_id": f"{doc_id}_{idx}_{i // 2 + 1}",
                            "doc_id": doc_id,
                            "doc_title": doc_title,
                            "doc_type": state.get("doc_type", "luat"),
                            "legal_domain": state.get("legal_domain"),
                            "article_ref": f"{article_ref} (Khoản {marker.strip('.')})",
                            "chapter": current_chapter,
                            "section": current_section,
                            "content": combined,
                            "is_active": True,
                        }
                    )
                continue  # Skip the main article chunk as it's split

        chunks.append(
            {
                "chunk_id": f"{doc_id}_{idx}",
                "doc_id": doc_id,
                "doc_title": doc_title,
                "doc_type": state.get("doc_type", "luat"),
                "legal_domain": state.get("legal_domain"),
                "article_ref": article_ref,
                "chapter": current_chapter,
                "section": current_section,
                "content": contextual_content,
                "is_active": True,
            }
        )

    return {**state, "chunks": chunks, "chunks_created": len(chunks)}
