import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from unittest.mock import patch
import uuid
from datetime import datetime, date

from app.models import User, Child, EmotionCard, Intensity, EmotionLog


class TestEmotionAPI:
    """感情データAPIのテスト"""

    @pytest.mark.asyncio
    async def test_get_emotion_cards(self, client: AsyncClient, db_session: AsyncSession):
        """感情カード一覧取得のテスト"""
        # テストデータを準備
        emotion_card = EmotionCard(
            id=uuid.uuid4(),
            label="うれしい",
            image_url="/images/emotions/ureshii.webp",
            color="#FFCC00"
        )
        db_session.add(emotion_card)
        await db_session.commit()

        # APIを呼び出し
        response = await client.get("/api/v1/emotion/cards")
        
        # レスポンスを検証
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["cards"]) == 1
        assert data["cards"][0]["label"] == "うれしい"

    @pytest.mark.asyncio
    async def test_get_intensities(self, client: AsyncClient, db_session: AsyncSession):
        """強度一覧取得のテスト"""
        # テストデータを準備
        intensity = Intensity(
            id=1,
            color_modifier=70
        )
        db_session.add(intensity)
        await db_session.commit()

        # APIを呼び出し
        response = await client.get("/api/v1/emotion/intensities")
        
        # レスポンスを検証
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["intensities"]) == 1
        assert data["intensities"][0]["id"] == 1
        assert data["intensities"][0]["color_modifier"] == 0.7

    @pytest.mark.asyncio
    async def test_create_emotion_log(self, client: AsyncClient, db_session: AsyncSession):
        """感情記録作成のテスト"""
        # テストデータを準備
        user = User(
            id=uuid.uuid4(),
            firebase_uid="test_user_123",
            email="test@example.com"
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
            id=1,
            color_modifier=70
        )
        
        db_session.add_all([user, child, emotion_card, intensity])
        await db_session.commit()

        # 認証をモック
        with patch('app.api.v1.endpoints.emotion_api.get_current_user') as mock_auth:
            mock_auth.return_value = user

            # APIを呼び出し
            response = await client.post(
                "/api/v1/emotion/logs",
                json={
                    "child_id": str(child.id),
                    "emotion_card_id": str(emotion_card.id),
                    "intensity_id": 1
                }
            )
            
            # レスポンスを検証
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "log_id" in data

    @pytest.mark.asyncio
    async def test_create_emotion_log_unauthorized(self, client: AsyncClient):
        """認証なしでの感情記録作成テスト"""
        # 認証なしでAPIを呼び出し
        response = await client.post(
            "/api/v1/emotion/logs",
            json={
                "child_id": "test_child_id",
                "emotion_card_id": "test_emotion_id",
                "intensity_id": 1
            }
        )
        
        # 認証エラーが返されることを確認
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_emotion_logs(self, client: AsyncClient, db_session: AsyncSession):
        """感情ログ一覧取得のテスト"""
        # テストデータを準備
        user = User(
            id=uuid.uuid4(),
            firebase_uid="test_user_123",
            email="test@example.com"
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
            id=1,
            color_modifier=70
        )
        emotion_log = EmotionLog(
            id=uuid.uuid4(),
            user_id=user.id,
            child_id=child.id,
            emotion_card_id=emotion_card.id,
            intensity_id=1
        )
        
        db_session.add_all([user, child, emotion_card, intensity, emotion_log])
        await db_session.commit()

        # 認証をモック
        with patch('app.api.v1.endpoints.emotion_api.get_current_user') as mock_auth:
            mock_auth.return_value = user

            # APIを呼び出し
            response = await client.get("/api/v1/emotion/logs/list")
            
            # レスポンスを検証
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1

    @pytest.mark.asyncio
    async def test_get_emotion_logs_daily(self, client: AsyncClient, db_session: AsyncSession):
        """指定日の感情ログ取得のテスト"""
        # テストデータを準備
        user = User(
            id=uuid.uuid4(),
            firebase_uid="test_user_123",
            email="test@example.com"
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
            id=1,
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
        
        db_session.add_all([user, child, emotion_card, intensity, emotion_log])
        await db_session.commit()

        # 認証をモック
        with patch('app.api.v1.endpoints.emotion_api.get_current_user') as mock_auth:
            mock_auth.return_value = user

            # APIを呼び出し
            response = await client.get("/api/v1/emotion/logs/daily/2024-01-15")
            
            # レスポンスを検証
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 1

    @pytest.mark.asyncio
    async def test_get_emotion_logs_invalid_date(self, client: AsyncClient, db_session: AsyncSession):
        """無効な日付形式での感情ログ取得テスト"""
        # 認証をモック
        user = User(
            id=uuid.uuid4(),
            firebase_uid="test_user_123",
            email="test@example.com"
        )
        
        with patch('app.api.v1.endpoints.emotion_api.get_current_user') as mock_auth:
            mock_auth.return_value = user

            # 無効な日付形式でAPIを呼び出し
            response = await client.get("/api/v1/emotion/logs/daily/invalid-date")
            
            # エラーレスポンスを検証
            assert response.status_code == 400
            data = response.json()
            assert "Invalid date format" in data["detail"]
