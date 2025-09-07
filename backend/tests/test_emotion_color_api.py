import pytest
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import asyncio
import uuid

from app.models import EmotionCard, Intensity
from app.main import app


class TestEmotionColorAPI:
    """感情色APIのシンプルテスト"""

    def test_get_emotion_colors(self):
        """感情カードの取得"""
        # テスト用のデータベースURL
        TEST_DATABASE_URL = "postgresql+asyncpg://teamb:kokoron_kawaii@db:5432/teamb_db"
        
        # テスト用エンジンを作成
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # セッションファクトリーを作成
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # テストデータを準備
        card = EmotionCard(id=uuid.uuid4(), label="うれしい", color="#FFCC00", image_url="/img.webp")
        
        # データベースにデータを追加
        async def add_test_data():
            async with async_session() as session:
                session.add(card)
                await session.commit()
        
        asyncio.run(add_test_data())

        # TestClientを使用してAPIを呼び出し
        with TestClient(app) as client:
            res = client.get("/emotion/colors/cards")
            assert res.status_code == 200
            data = res.json()
            assert data["cards"][0]["id"] == str(card.id)

    def test_get_intensity_colors(self):
        """強度取得"""
        # テスト用のデータベースURL
        TEST_DATABASE_URL = "postgresql+asyncpg://teamb:kokoron_kawaii@db:5432/teamb_db"
        
        # テスト用エンジンを作成
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # セッションファクトリーを作成
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # テストデータを準備
        intensity = Intensity(id=1001, color_modifier=40)
        
        # データベースにデータを追加
        async def add_test_data():
            async with async_session() as session:
                session.add(intensity)
                await session.commit()
        
        asyncio.run(add_test_data())

        # TestClientを使用してAPIを呼び出し
        with TestClient(app) as client:
            res = client.get("/emotion/colors/intensities")
            assert res.status_code == 200
            data = res.json()
        assert data["intensities"][0]["id"] == 1001
        assert data["intensities"][0]["color_modifier"] == 0.4

    def test_get_color_combination(self):
        """感情×強度の組み合わせ計算"""
        # テスト用のデータベースURL
        TEST_DATABASE_URL = "postgresql+asyncpg://teamb:kokoron_kawaii@db:5432/teamb_db"
        
        # テスト用エンジンを作成
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        
        # セッションファクトリーを作成
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        # テストデータを準備
        card = EmotionCard(id=uuid.uuid4(), label="うれしい", color="#FFCC00", image_url="/img.webp")
        intensity = Intensity(id=1002, color_modifier=70)
        
        # データベースにデータを追加
        async def add_test_data():
            async with async_session() as session:
                session.add_all([card, intensity])
                await session.commit()
        
        asyncio.run(add_test_data())

        # TestClientを使用してAPIを呼び出し
        with TestClient(app) as client:
            res = client.get(f"/emotion/colors/combinations/{card.id}/{intensity.id}")
            assert res.status_code == 200
            data = res.json()
            assert data["combination"]["rgba_color"].startswith("rgba(")

    def test_invalid_ids(self):
        """存在しないIDで404"""
        with TestClient(app) as client:
            res = client.get("/emotion/colors/combinations/00000000-0000-0000-0000-000000000000/999")
            assert res.status_code == 404

    def test_missing_params(self):
        """パラメータ不足で404（パスパラメータなので422ではなく404）"""
        with TestClient(app) as client:
            res = client.get("/emotion/colors/combinations/")
            assert res.status_code == 404
