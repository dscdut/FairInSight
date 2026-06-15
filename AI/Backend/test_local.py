import asyncio
import sys
import os

# Add Backend directory to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.services.embedding_service import embedding_service

async def main():
    print("Testing local embedding service loading and inference...")
    # BAAI/bge-m3 will be downloaded on first run
    res = await embedding_service.encode("Xin chào Việt Nam")
    print(f"Success! Embedding vector size: {len(res)}")
    print(f"First 5 values: {res[:5]}")
    
    # Test list of strings
    res_list = await embedding_service.encode(["Xin chào", "Tạm biệt"])
    print(f"Success! List embedding size: {len(res_list)}x{len(res_list[0])}")

if __name__ == "__main__":
    asyncio.run(main())
