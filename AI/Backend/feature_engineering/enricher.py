import json
import os

def run() -> None:
    input_path = os.path.join(os.path.dirname(__file__), "data", "split_chunks.json")
    output_path = os.path.join(os.path.dirname(__file__), "data", "enriched_chunks.json")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run split step first.")
        return
        
    print(f"Reading split chunks from {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)
        
    print(f"Enriching {len(chunks)} chunks with domain metadata...")
    for chunk in chunks:
        doc_title = chunk.get("doc_title", "").lower()
        
        # Rule-based legal domain classifier
        if "lao động" in doc_title or "bhxh" in doc_title:
            domain = "lao_dong"
        elif "dân sự" in doc_title:
            domain = "dan_su"
        elif "hình sự" in doc_title:
            domain = "hinh_su"
        elif "đất đai" in doc_title or "nhà ở" in doc_title:
            domain = "dat_dai"
        elif "doanh nghiệp" in doc_title or "đầu tư" in doc_title or "đấu thầu" in doc_title:
            domain = "dau_tu"
        else:
            domain = "khac"
            
        chunk["legal_domain"] = domain
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully enriched and saved chunks to {output_path}")
