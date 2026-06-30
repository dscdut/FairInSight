import re
import os
import json


def split_text(text: str) -> list[str]:
    # Split by "Điều" or "Dieu"
    parts = re.split(r"(?=Dieu\s+\d+|Điều\s+\d+)", text)
    return [p.strip() for p in parts if p.strip()]


def extract_number(text: str, prefix: str) -> str | None:
    match = re.search(rf"(?im){prefix}\s+(\d+)", text)
    if match:
        return match.group(1)
    return None


def _get_contextual_prefix(doc_title: str, chapter: str, section: str) -> str:
    parts = [f"Văn bản: {doc_title}"]
    if chapter:
        parts.append(chapter)
    if section:
        parts.append(section)
    return " | ".join(parts) + "\n\n"


def run(text: str = "") -> list[str] | None:
    # If a non-empty text string is passed, behave as helper function
    if text:
        return split_text(text)

    # Otherwise, run as a pipeline step
    input_path = os.path.join(os.path.dirname(__file__), "data", "cleaned_documents.json")
    output_path = os.path.join(os.path.dirname(__file__), "data", "split_chunks.json")

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run clean step first.")
        return None

    print(f"Reading cleaned documents from {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        docs = json.load(f)

    all_chunks = []
    print(f"Splitting {len(docs)} documents into chunks...")

    for doc in docs:
        doc_id = doc.get("doc_id", "unknown")
        doc_title = doc.get("doc_title", "Unknown Document")
        doc_type = doc.get("doc_type", "luat")
        legal_domain = doc.get("legal_domain")
        cleaned_text = doc.get("cleaned_text", "")

        # Split by "Điều" or "Dieu" using lookahead
        sections = re.split(r"(?im)(?=^(?:\#+\s*)?(?:Dieu|Điều)\s+\d+)", cleaned_text)

        current_chapter = ""
        current_section = ""

        for idx, content in enumerate(sections):
            content = content.strip()
            if not content:
                continue

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

            prefix = _get_contextual_prefix(doc_title, current_chapter, current_section)
            contextual_content = prefix + content

            # Check if content is too long (> 2000 chars) and split if necessary
            if len(contextual_content) > 2000:
                sub_sections = re.split(r"(?m)^(\d+\.\s+)", content)
                if len(sub_sections) > 1:
                    current_sub = sub_sections[0]
                    intro = current_sub.strip()
                    for i in range(1, len(sub_sections), 2):
                        marker = sub_sections[i]
                        sub_text = sub_sections[i + 1]
                        if intro:
                            combined = prefix + intro + "\n" + marker + sub_text
                        else:
                            combined = prefix + marker + sub_text
                        all_chunks.append(
                            {
                                "chunk_id": f"{doc_id}_{idx}_{i // 2 + 1}",
                                "doc_id": doc_id,
                                "doc_title": doc_title,
                                "doc_type": doc_type,
                                "legal_domain": legal_domain,
                                "article_ref": f"{article_ref} (Khoản {marker.strip('.')})",
                                "chapter": current_chapter,
                                "section": current_section,
                                "content": combined,
                                "is_active": True,
                            }
                        )
                    continue

            all_chunks.append(
                {
                    "chunk_id": f"{doc_id}_{idx}",
                    "doc_id": doc_id,
                    "doc_title": doc_title,
                    "doc_type": doc_type,
                    "legal_domain": legal_domain,
                    "article_ref": article_ref,
                    "chapter": current_chapter,
                    "section": current_section,
                    "content": contextual_content,
                    "is_active": True,
                }
            )

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)

    print(f"Successfully split into {len(all_chunks)} chunks.")
    print(f"Chunks saved to {output_path}")
    return None
