import httpx
from dotenv import load_dotenv
import os

load_dotenv()

api_key = os.getenv("JINA_API_KEY")
model = os.getenv("EMBED_MODEL", "jina-embeddings-v3")
dim = os.getenv("EMBED_DIM", "1024")

print(f"JINA_API_KEY: {api_key[:10]}...{api_key[-5:] if api_key else ''}")
print(f"MODEL: {model}")
print(f"DIM: {dim}")

url = "https://api.jina.ai/v1/embeddings"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {api_key}"
}
payload = {
    "model": model,
    "task": "retrieval.passage",
    "dimensions": int(dim),
    "late_chunking": False,
    "embedding_type": "float",
    "input": ["test text", ""]
}

response = httpx.post(url, headers=headers, json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
