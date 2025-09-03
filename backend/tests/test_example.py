import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class TestExample:
    """サンプルテストクラス"""

    @pytest.mark.unit
    def test_basic_math(self):
        """基本的な計算のテスト"""
        assert 2 + 2 == 4
        assert 10 - 5 == 5

    @pytest.mark.integration
    @pytest.mark.skip(reason="CI環境ではバックエンドサーバーが起動していないためスキップ")
    def test_login_endpoint(self):
        """ログインエンドポイントのテスト（簡易版）"""
        # ログインテスト（非同期フィクスチャを使わない）
        import asyncio
        from httpx import AsyncClient
        from app.main import app

        async def _test_login():
            async with AsyncClient() as client:
                # 無効なトークンでログインを試行（401エラーが期待される）
                response = await client.post(
                    "http://localhost:8000/api/v1/login",
                    json={"id_token": "invalid_token"},
                )
                # 認証エラー（401）が返されることを確認
                assert response.status_code == 401

                # エラーメッセージの確認
                json_data = response.json()
                assert "detail" in json_data
                assert json_data["detail"] == "Invalid token"

        # 非同期テストを実行
        asyncio.run(_test_login())

    @pytest.mark.unit
    def test_string_operations(self):
        """文字列操作のテスト"""
        text = "Hello, World!"
        assert text.lower() == "hello, world!"
        assert len(text) == 13

    @pytest.mark.integration
    def test_database_connection(self):
        """データベース接続のテスト（簡易版）"""
        # データベース接続のテスト（非同期フィクスチャを使わない）
        import asyncio
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text

        async def _test_connection():
            import os
            from dotenv import load_dotenv

            load_dotenv()
            test_db_url = os.getenv("TEST_DATABASE_URL")
            if not test_db_url:
                raise ValueError(
                    "TEST_DATABASE_URL environment variable is required. "
                    "Please set it in your .env file or environment."
                )
            engine = create_async_engine(test_db_url)

            try:
                # 接続テスト
                async with engine.connect() as conn:
                    result = await conn.execute(text("SELECT 1 as test_value"))
                    row = result.fetchone()
                    assert row is not None
                    assert row.test_value == 1
            finally:
                await engine.dispose()

        # 非同期テストを実行
        asyncio.run(_test_connection())
