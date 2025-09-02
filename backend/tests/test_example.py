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
    async def test_health_check(self, client: AsyncClient):
        """ヘルスチェックエンドポイントのテスト"""
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        
        # レスポンス内容の確認
        json_data = response.json()
        assert json_data["status"] == "healthy"
        assert json_data["service"] == "voice-api"
    
    @pytest.mark.unit
    def test_string_operations(self):
        """文字列操作のテスト"""
        text = "Hello, World!"
        assert text.lower() == "hello, world!"
        assert len(text) == 13
    
    @pytest.mark.integration
    async def test_database_connection(self, db_session: AsyncSession):
        """データベース接続のテスト"""
        # データベースセッションが正常に取得できることを確認
        assert db_session is not None
        assert isinstance(db_session, AsyncSession)
        
        # 簡単なクエリ実行テスト（SQLAlchemy 2.x推奨スタイル）
        result = await db_session.execute(text("SELECT 1 as test_value"))
        row = result.fetchone()
        assert row is not None
        assert row.test_value == 1 