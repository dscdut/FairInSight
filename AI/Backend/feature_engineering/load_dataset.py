import json
import os
import re
from datasets import load_dataset

def extract_metadata(markdown_text: str):
    doc_type = "luat"
    doc_title = "Unknown Document"
    doc_number = ""
    doc_date = ""

    lines = [line.strip() for line in markdown_text.split("\n") if line.strip()]
    
    # 1. Extract Number
    num_match = re.search(
        r'(?:Luật|Nghị định|Thông tư|Quyết định|Nghị quyết|Số)\s*[:\s]\s*([0-9]+/[0-9]+/[A-Z0-9\-]+|[0-9]+/[A-Z0-9\-]+)', 
        markdown_text, 
        re.IGNORECASE
    )
    if num_match:
        doc_number = num_match.group(1).strip()
    
    # 2. Extract Date
    date_match = re.search(r'ngày\s+(\d+)\s+tháng\s+(\d+)\s+năm\s+(\d+)', markdown_text, re.IGNORECASE)
    if date_match:
        doc_date = f"{date_match.group(1)}/{date_match.group(2)}/{date_match.group(3)}"

    # 3. Extract Type and Title
    types_map = {
        'BỘ LUẬT': ('luat', 'Bộ luật'),
        'LUẬT': ('luat', 'Luật'),
        'NGHỊ ĐỊNH': ('nghi_dinh', 'Nghị định'),
        'THÔNG TƯ': ('thong_tu', 'Thông tư'),
        'QUYẾT ĐỊNH': ('quyet_dinh', 'Quyết định'),
        'NGHỊ QUYẾT': ('nghi_quyet', 'Nghị quyết'),
        'HIẾN PHÁP': ('hien_phap', 'Hiến pháp'),
    }

    found_type = None
    found_idx = -1
    
    for idx, line in enumerate(lines[:15]):
        cleaned_line = re.sub(r'[\*\#\_]', '', line).strip()
        if cleaned_line.upper() in types_map:
            found_type = types_map[cleaned_line.upper()]
            found_idx = idx
            break

    if found_type:
        doc_type = found_type[0]
        title_parts = []
        for line in lines[found_idx + 1: found_idx + 5]:
            cleaned_line = re.sub(r'[\*\#\_]', '', line).strip()
            if (cleaned_line.lower().startswith("căn cứ") or 
                cleaned_line.lower().startswith("điều 1") or 
                cleaned_line.lower().startswith("chương 1") or
                "ngày" in cleaned_line.lower()):
                break
            if cleaned_line:
                title_parts.append(cleaned_line)
        
        if title_parts:
            raw_title = " ".join(title_parts).strip()
            doc_title = f"{found_type[1]} {raw_title}"
        else:
            doc_title = found_type[1]
    else:
        # Fallback keyword scanning
        for idx, line in enumerate(lines[:15]):
            cleaned_line = re.sub(r'[\*\#\_]', '', line).strip()
            for k, (t_code, t_name) in types_map.items():
                if f" {k} " in f" {cleaned_line.upper()} ":
                    doc_type = t_code
                    doc_title = cleaned_line
                    found_idx = idx
                    break
            if found_idx != -1:
                break
    
    doc_title = re.sub(r'\s+', ' ', doc_title).strip()
    
    return {
        "doc_title": doc_title,
        "doc_type": doc_type,
        "number": doc_number,
        "date": doc_date,
    }

def run() -> None:
    # Get limit configuration from environment variables
    # Default is 5 for quick dev/testing, set to -1 to load all documents
    max_docs_env = os.getenv("MAX_DOCS", "5")
    try:
        max_docs = int(max_docs_env)
    except ValueError:
        max_docs = 5

    print(f"Loading dataset 'kiil-lab/vietnamese-law-corpus' (Limit: {max_docs if max_docs > 0 else 'All'})...")
    
    # Load dataset using HuggingFace datasets library in streaming mode to keep memory usage low
    dataset = load_dataset("kiil-lab/vietnamese-law-corpus", split="train", streaming=True)
    
    raw_docs = []
    count = 0
    
    for row in dataset:
        doc_id = str(row.get("doc_id"))
        markdown_text = row.get("markdown") or ""
        
        # Standardize record
        meta = extract_metadata(markdown_text)
        
        doc_obj = {
            "doc_id": doc_id,
            "doc_title": meta["doc_title"],
            "doc_type": meta["doc_type"],
            "number": meta["number"],
            "date": meta["date"],
            "raw_text": markdown_text,
            "legal_domain": None,  # Can be enriched in the enrich step
        }
        raw_docs.append(doc_obj)
        count += 1
        
        if max_docs > 0 and count >= max_docs:
            break

    # Save raw documents to JSON file inside feature_engineering/data/
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    
    output_path = os.path.join(output_dir, "raw_documents.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(raw_docs, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully loaded and standardized {len(raw_docs)} documents.")
    print(f"Output saved to {output_path}")
