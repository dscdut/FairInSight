import asyncio
import json
import os
import sys

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.graphs.import_graph import build_import_graph

async def test():
    file_path = "/Users/anhnon/GovDoc/VANBAN1.pdf"
    
    state = {
        "file_path": file_path,
        "doc_type": "luat",
        "legal_domain": "Hình sự"
    }
    
    print(f"--- Testing Pipeline with: {file_path} ---")
    
    graph = build_import_graph()
    print("🚀 Running Import Graph...")
    result = await graph.ainvoke(state)
    
    if result.get("error"):
        print(f"❌ Error in pipeline: {result['error']}")
        return
        
    print(f"✅ Extracted Title: {result.get('doc_title')}")
    print(f"✅ Raw text length: {len(result.get('raw_text', ''))} characters")
    print(f"📝 Summary: {result.get('summary', 'No summary generated')[:500]}...")
    
    chunks = result.get("chunks", [])
    print(f"✅ Created {len(chunks)} chunks.")
    
    # Save results for inspection
    output_path = "scratch/test_output.json"
    os.makedirs("scratch", exist_ok=True)
    
    # Show some statistics
    long_chunks = [c for c in chunks if "(Khoản" in c["article_ref"]]
    print(f"📊 Statistics:")
    print(f"   - Total Chunks: {len(chunks)}")
    print(f"   - Sub-article (Khoản) Chunks: {len(long_chunks)}")
    
    # Save a sample of 20 chunks (including some mid-document ones to see chapter changes)
    sample_indices = list(range(min(10, len(chunks)))) + [len(chunks)//2] + list(range(len(chunks)-5, len(chunks)))
    sample_chunks = [chunks[i] for i in sample_indices if i < len(chunks)]
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    
    print(f"\n🚀 Full results saved to {output_path}")
    
    # Print first 2 chunks for immediate feedback
    print("\n--- SAMPLE CHUNK 1 ---")
    print(f"Ref: {chunks[0]['article_ref']}")
    print(f"Content Sample: {chunks[0]['content'][:200]}...")
    
    if len(chunks) > 1:
        print("\n--- SAMPLE CHUNK 2 ---")
        print(f"Ref: {chunks[1]['article_ref']}")
        print(f"Chapter: {chunks[1].get('chapter')}")
        print(f"Content Sample: {chunks[1]['content'][:200]}...")

if __name__ == "__main__":
    asyncio.run(test())
