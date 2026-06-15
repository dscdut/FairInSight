import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.embedding_service import EmbeddingService
from app.utils.settings import get_settings

settings = get_settings()

@pytest.mark.asyncio
async def test_embedding_service_local() -> None:
    # Test that local encoding returns correct shapes
    service = EmbeddingService()
    res = await service.encode("Hello test")
    assert isinstance(res, list)
    assert len(res) == settings.embed_dim

    res_list = await service.encode(["Hello 1", "Hello 2"])
    assert isinstance(res_list, list)
    assert len(res_list) == 2
    assert len(res_list[0]) == settings.embed_dim

@pytest.mark.asyncio
async def test_embedding_service_jina_mock() -> None:
    # Test that Jina API encoding works when model starts with 'jina-'
    service = EmbeddingService()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [
            {"index": 0, "embedding": [0.1] * settings.embed_dim},
            {"index": 1, "embedding": [0.2] * settings.embed_dim}
        ]
    }
    
    # We patch settings to pretend we are using Jina
    with patch.object(settings, "embed_model", "jina-embeddings-v3"), \
         patch.object(settings, "jina_api_key", "mock-jina-key"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_response) as mock_post:
         
        res = await service.encode(["text1", "text2"])
        
        # Verify call arguments
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        assert kwargs["json"]["model"] == "jina-embeddings-v3"
        assert kwargs["json"]["input"] == ["text1", "text2"]
        
        # Verify results
        assert len(res) == 2
        assert res[0] == [0.1] * settings.embed_dim
        assert res[1] == [0.2] * settings.embed_dim
