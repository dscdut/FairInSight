"""Fixtures dùng chung cho test pipeline chat.

Test e2e thật: cần Postgres (POCFAIRINSIGHT) + Ollama (qwen3:8b, bge-m3) đang chạy.
Tự đọc DB lấy dữ liệu thật làm input — không hard-code nội dung luật.
"""

from __future__ import annotations

import logging

import psycopg2
import pytest

from src.config.settings import settings

logging.disable(logging.INFO)  # tắt SQL echo cho gọn output test


@pytest.fixture(scope="session")
def db_cursor():
    """Cursor psycopg2 (sync) để chuẩn bị dữ liệu kỳ vọng từ DB thật."""
    conn = psycopg2.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        dbname=settings.POSTGRES_DB,
    )
    cur = conn.cursor()
    yield cur
    cur.close()
    conn.close()


@pytest.fixture(scope="session")
def sample_article(db_cursor):
    """Một Điều thật có nội dung đủ dài + thuộc văn bản có official_code.

    Trả dict {official_code, article_no, title, content} để sinh câu hỏi đích danh.
    """
    db_cursor.execute(
        """
        SELECT d.official_code, u.article_no, u.title, u.content
        FROM units u JOIN documents d ON u.document_id = d.id
        WHERE u.unit_type = 'article'
          AND d.official_code IS NOT NULL
          AND u.content IS NOT NULL AND length(u.content) > 300
          AND u.article_no ~ '^[0-9]+$'
        ORDER BY length(u.content) DESC
        LIMIT 1
        """
    )
    row = db_cursor.fetchone()
    assert row, "DB không có Điều nào đủ điều kiện làm sample"
    return {
        "official_code": row[0],
        "article_no": row[1],
        "title": row[2],
        "content": row[3],
    }


@pytest.fixture(scope="session")
def amended_units(db_cursor):
    """Các unit (Điều) ĐÃ resolve là đích của một sửa đổi (old_unit_id NOT NULL).

    Dùng để kiểm B7 có bắt được căn cứ hết/giảm hiệu lực không. Có thể rỗng nếu
    ingest chưa resolve amendment nào → test tương ứng sẽ skip.
    """
    db_cursor.execute(
        """
        SELECT a.old_unit_id, a.amendment_type, d.official_code, u.unit_status
        FROM amendments a
        JOIN units u ON a.old_unit_id = u.id
        JOIN documents d ON u.document_id = d.id
        WHERE a.old_unit_id IS NOT NULL
        LIMIT 10
        """
    )
    return [
        {"unit_id": r[0], "amendment_type": r[1], "official_code": r[2], "unit_status": r[3]}
        for r in db_cursor.fetchall()
    ]
