import pytest
from app.graphs.state import GraphState
from app.nodes.chunk import run as run_chunknode


@pytest.mark.asyncio
async def test_chunk_node_long_article_split() -> None:
    # A long article (> 2000 chars) that has sub-articles (Khoản)
    # The prefix is: "Văn bản: Luật Lao động | Chương I: Quy định chung"
    # We want to ensure that:
    # 1. The article is split into clauses (Khoản)
    # 2. The article title/header (current_sub) is NOT lost and is prepended to each chunk
    intro_text = "Điều 5. Quyền và nghĩa vụ của người lao động:\n"
    clause_1 = "1. Người lao động có các quyền sau đây:\na) Làm việc, tự do lựa chọn việc làm, nghề nghiệp, học nghề, nâng cao trình độ nghề nghiệp;\nb) Hưởng lương phù hợp với trình độ kỹ năng nghề trên cơ sở thỏa thuận;\nc) Đơn phương chấm dứt hợp đồng lao động;\nd) Các quyền khác theo quy định của pháp luật.\n"
    clause_2 = "2. Người lao động có các nghĩa vụ sau đây:\na) Thực hiện hợp đồng lao động, thỏa ước lao động tập thể;\nb) Chấp hành kỷ luật lao động, nội quy lao động;\nc) Thực hiện các quy định của pháp luật về lao động, việc làm, an toàn, vệ sinh lao động.\n"

    # Let's repeat some text to make it > 2000 characters
    padding = (
        "Padding text to make this chunk extremely long so that it exceeds the 2000 characters threshold. "
        * 20
    )

    content = intro_text + clause_1 + padding + "\n" + clause_2 + padding

    raw_text = f"Chương I\nQuy định chung\n\n{content}"

    state: GraphState = {
        "raw_text": raw_text,
        "doc_title": "Luật Lao động",
        "file_path": "luat_lao_dong.pdf",
        "doc_type": "luat",
        "legal_domain": "Lao động",
    }

    result = await run_chunknode(state)
    chunks = result["chunks"]

    # We have:
    # chunks[0] -> Preamble: "Chương I\nQuy định chung"
    # chunks[1] -> Điều 5 (Khoản 1)
    # chunks[2] -> Điều 5 (Khoản 2)
    assert len(chunks) == 3

    # Check if each chunk contains the document context prefix
    for chunk in chunks:
        assert "Văn bản: Luật Lao động" in chunk["content"]

    # Check if the sub-chunks contain their respective clauses
    assert "1. Người lao động" in chunks[1]["content"]
    assert "Khoản 1" in chunks[1]["article_ref"]

    assert "2. Người lao động" in chunks[2]["content"]
    assert "Khoản 2" in chunks[2]["article_ref"]

    # Verify that the article header (current_sub) is preserved in the chunk content!
    # Currently this will FAIL because we haven't fixed the bug yet.
    assert "Điều 5. Quyền và nghĩa vụ" in chunks[1]["content"]
    assert "Điều 5. Quyền và nghĩa vụ" in chunks[2]["content"]
