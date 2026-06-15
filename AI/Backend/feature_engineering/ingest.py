import os
import json
import sys

# Ensure Backend folder is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.connection import upsert_chunks

def run() -> None:
    input_path = os.path.join(os.path.dirname(__file__), "data", "embedded_chunks.json")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run embed step first.")
        return
        
    print(f"Reading embedded chunks from {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    chunks = data.get("chunks") or []
    embeddings = data.get("embeddings") or []
    
    if not chunks or not embeddings:
        print("No chunks or embeddings found to ingest.")
        return
        
    print(f"Ingesting {len(chunks)} chunks into Qdrant...")
    try:
        upsert_chunks(chunks, embeddings)
        print("Successfully ingested all chunks into Qdrant!")
    except Exception as e:
        print(f"Ingestion failed: {e}")
