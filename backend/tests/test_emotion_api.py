import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
import uuid
from datetime import datetime, date

from app.models import User, Child, EmotionCard, Intensity, EmotionLog
from app.main import app


class TestEmotionAPI:
    """感情データAPIのテスト（シンプル版）"""

    def test_get_emotion_cards_endpoint(self):
        """感情カードエンドポイントのテスト"""
        with TestClient(app) as client:
            response = client.get("/emotion/cards")
            # エンドポイントが存在することを確認
            assert response.status_code in [200, 403]

    def test_get_intensities_endpoint(self):
        """強度エンドポイントのテスト"""
        with TestClient(app) as client:
            response = client.get("/emotion/intensities")
            # エンドポイントが存在することを確認
            assert response.status_code in [200, 403]

    def test_create_emotion_log_unauthorized(self):
        """認証なしでの感情記録作成テスト"""
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

    def test_emotion_logs_endpoint(self):
        """感情ログエンドポイントのテスト"""
        with TestClient(app) as client:
            response = client.get("/emotion/logs/list")
            # エンドポイントが存在することを確認（認証エラーでもOK）
            assert response.status_code in [200, 403]

    def test_emotion_logs_daily_endpoint(self):
        """日別感情ログエンドポイントのテスト"""
        with TestClient(app) as client:
            response = client.get("/emotion/logs/daily/2024-01-15")
            # エンドポイントが存在することを確認（認証エラーでもOK）
            assert response.status_code in [200, 403, 400]

    def test_emotion_logs_invalid_date(self):
        """無効な日付での感情ログ取得テスト"""
        with TestClient(app) as client:
            response = client.get("/emotion/logs/daily/invalid-date")
            # エラーレスポンスを確認
            assert response.status_code in [400, 404]