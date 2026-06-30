import asyncio
import os
import json
import sys

# Ensure Backend folder is in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.embedding_service import embedding_service

async def embed_chunks_async():
    input_path = os.path.join(os.path.dirname(__file__), "data", "enriched_chunks.json")
    output_path = os.path.join(os.path.dirname(__file__), "data", "embedded_chunks.json")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run enrich step first.")
        return
        
    print(f"Reading enriched chunks from {input_path}...")
    with open(input_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)
        
    if not chunks:
        print("No chunks found to embed.")
        return

    print(f"Generating embeddings for {len(chunks)} chunks using model...")
    texts = [c["content"] for c in chunks]
    
    # For indexing documents, use 'retrieval.passage' task
    embeddings = await embedding_service.encode(texts, task="retrieval.passage")
    
    output_data = {
        "chunks": chunks,
        "embeddings": embeddings
    }
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully generated embeddings and saved to {output_path}")

def run() -> None:
    asyncio.run(embed_chunks_async())
