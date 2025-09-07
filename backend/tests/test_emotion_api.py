import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from unittest.mock import patch
import uuid
from datetime import datetime, date
import asyncio
from fastapi.testclient import TestClient

from app.models import User, Child, EmotionCard, Intensity, EmotionLog
from app.main import app


class TestEmotionAPI:
    """感情データAPIのテスト"""

    def test_get_emotion_cards(self):
        """感情カード一覧取得のテスト"""
        # テスト用のデータベースURL（conftest.pyと同じ設定を使用）
        TEST_DATABASE_URL = "postgresql+asyncpg://teamb:kokoron_kawaii@db:5432/teamb_db"
        
        # テスト用エンジンを作成
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # セッションファクトリーを作成
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # テストデータを準備
        emotion_card = EmotionCard(
            id=uuid.uuid4(),
            label="うれしい",
            image_url="/images/emotions/ureshii.webp",
            color="#FFCC00"
        )
        
        # データベースにデータを追加
        async def add_test_data():
            async with async_session() as session:
                session.add(emotion_card)
                await session.commit()
        
        asyncio.run(add_test_data())

        # TestClientを使用してAPIを呼び出し
        with TestClient(app) as client:
            response = client.get("/emotion/cards")
        
        # レスポンスを検証
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["cards"]) == 1
        assert data["cards"][0]["label"] == "うれしい"

    def test_get_intensities(self):
        """強度一覧取得のテスト"""
        # テスト用のデータベースURL
        TEST_DATABASE_URL = "postgresql+asyncpg://teamb:kokoron_kawaii@db:5432/teamb_db"
        
        # テスト用エンジンを作成
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # セッションファクトリーを作成
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # テストデータを準備
        intensity = Intensity(
            id=3001,
            color_modifier=70
        )
        
        # データベースにデータを追加
        async def add_test_data():
            async with async_session() as session:
                session.add(intensity)
                await session.commit()
        
        asyncio.run(add_test_data())

        # TestClientを使用してAPIを呼び出し
        with TestClient(app) as client:
            response = client.get("/emotion/intensities")
        
        # レスポンスを検証
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["intensities"]) == 1
        assert data["intensities"][0]["id"] == 3001
        assert data["intensities"][0]["color_modifier"] == 0.7

    def test_create_emotion_log(self):
        """感情記録作成のテスト"""
        # テストデータを準備
        user = User(
            id=uuid.uuid4(),
            uid=f"test_user_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            email_verified=True
        )
        child = Child(
            id=uuid.uuid4(),
            user_id=user.id,
            nickname="テストくん",
            birth_date=date(2018, 4, 15),
            gender="男の子"
        )
        emotion_card = EmotionCard(
            id=uuid.uuid4(),
            label="うれしい",
            image_url="/images/emotions/ureshii.webp",
            color="#FFCC00"
        )
        intensity = Intensity(
            id=3001,
            color_modifier=70
        )
        
        # テスト用のデータベースURL
        TEST_DATABASE_URL = "postgresql+asyncpg://teamb:kokoron_kawaii@db:5432/teamb_db"
        
        # テスト用エンジンを作成
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # セッションファクトリーを作成
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # データベースにデータを追加
        async def add_test_data():
            async with async_session() as session:
                session.add_all([user, child, emotion_card, intensity])
                await session.commit()
        
        asyncio.run(add_test_data())

        # 認証をモック
        from app.api.v1.endpoints.auth import get_current_user
        
        def mock_get_current_user():
            return user
        
        app.dependency_overrides[get_current_user] = mock_get_current_user

        try:
            # TestClientを使用してAPIを呼び出し
            with TestClient(app) as client:
                response = client.post(
                    "/emotion/logs",
                    json={
                        "child_id": str(child.id),
                        "emotion_card_id": str(emotion_card.id),
                        "intensity_id": 3001
                    }
                )
                
                # レスポンスを検証
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "log_id" in data
        finally:
            # 依存関係のオーバーライドをクリア
            app.dependency_overrides.clear()

    def test_create_emotion_log_unauthorized(self):
        """認証なしでの感情記録作成テスト"""
        # TestClientを使用してAPIを呼び出し
        with TestClient(app) as client:
            response = client.post(
                "/emotion/logs",
                json={
                    "child_id": "test_child_id",
                    "emotion_card_id": "test_emotion_id",
                    "intensity_id": 1
                }
            )
            
            # 認証エラーが返されることを確認
            assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_emotion_logs(self, client: AsyncClient, test_db_session: AsyncSession):
        """感情ログ一覧取得のテスト"""
        # テストデータを準備
        user = User(
            id=uuid.uuid4(),
            uid=f"test_user_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            email_verified=True
        )
        child = Child(
            id=uuid.uuid4(),
            user_id=user.id,
            nickname="テストくん",
            birth_date=date(2018, 4, 15),
            gender="男の子"
        )
        emotion_card = EmotionCard(
            id=uuid.uuid4(),
            label="うれしい",
            image_url="/images/emotions/ureshii.webp",
            color="#FFCC00"
        )
        intensity = Intensity(
            id=3001,
            color_modifier=70
        )
        emotion_log = EmotionLog(
            id=uuid.uuid4(),
            user_id=user.id,
            child_id=child.id,
            emotion_card_id=emotion_card.id,
            intensity_id=1
        )
        
        test_db_session.add_all([user, child, emotion_card, intensity, emotion_log])
        await test_db_session.commit()

        # 認証をモック
        from app.api.v1.endpoints.auth import get_current_user
        
        def mock_get_current_user():
            return user
        
        app.dependency_overrides[get_current_user] = mock_get_current_user

        try:
            # APIを呼び出し
            response = await client.get("/api/v1/emotion/logs/list")
            
            # レスポンスを検証
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
        finally:
            # 依存関係のオーバーライドをクリア
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_emotion_logs_daily(self, client: AsyncClient, test_db_session: AsyncSession):
        """指定日の感情ログ取得のテスト"""
        # テストデータを準備
        user = User(
            id=uuid.uuid4(),
            uid=f"test_user_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            email_verified=True
        )
        child = Child(
            id=uuid.uuid4(),
            user_id=user.id,
            nickname="テストくん",
            birth_date=date(2018, 4, 15),
            gender="男の子"
        )
        emotion_card = EmotionCard(
            id=uuid.uuid4(),
            label="うれしい",
            image_url="/images/emotions/ureshii.webp",
            color="#FFCC00"
        )
        intensity = Intensity(
            id=3001,
            color_modifier=70
        )
        emotion_log = EmotionLog(
            id=uuid.uuid4(),
            user_id=user.id,
            child_id=child.id,
            emotion_card_id=emotion_card.id,
            intensity_id=1,
            created_at=datetime(2024, 1, 15, 10, 0, 0)
        )
        
        test_db_session.add_all([user, child, emotion_card, intensity, emotion_log])
        await test_db_session.commit()

        # 認証をモック
        from app.api.v1.endpoints.auth import get_current_user
        
        def mock_get_current_user():
            return user
        
        app.dependency_overrides[get_current_user] = mock_get_current_user

        try:
            # APIを呼び出し
            response = await client.get("/api/v1/emotion/logs/daily/2024-01-15")
            
            # レスポンスを検証
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1
        finally:
            # 依存関係のオーバーライドをクリア
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_get_emotion_logs_invalid_date(self, client: AsyncClient, test_db_session: AsyncSession):
        """無効な日付形式での感情ログ取得テスト"""
        # 認証をモック
        user = User(
            id=uuid.uuid4(),
            uid=f"test_user_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            email_verified=True
        )
        
        from app.api.v1.endpoints.auth import get_current_user
        
        def mock_get_current_user():
            return user
        
        app.dependency_overrides[get_current_user] = mock_get_current_user

        try:
            # 無効な日付形式でAPIを呼び出し
            response = await client.get("/api/v1/emotion/logs/daily/invalid-date")
            
            # エラーレスポンスを検証
            assert response.status_code == 400
            data = response.json()
            assert "Invalid date format" in data["detail"]
        finally:
            # 依存関係のオーバーライドをクリア
            app.dependency_overrides.clear()
