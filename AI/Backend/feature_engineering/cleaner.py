import re
import os
import json

def clean_text(text: str) -> str:
    # Basic normalization
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    return text

def run(text: str = "") -> str | None:
    # If a non-empty text string is passed, behave as a helper function
    if text:
        return clean_text(text)
        
    # Otherwise, run as a pipeline step
    input_path = os.path.join(os.path.dirname(__file__), "data", "raw_documents.json")
    output_path = os.path.join(os.path.dirname(__file__), "data", "cleaned_documents.json")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run load step first.")
        return None
        
    print(f"Reading raw documents from {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        docs = json.load(f)
        
    print(f"Cleaning {len(docs)} documents...")
    for doc in docs:
        doc["cleaned_text"] = clean_text(doc.get("raw_text", ""))
        
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully cleaned and saved {len(docs)} documents to {output_path}")
    return None
