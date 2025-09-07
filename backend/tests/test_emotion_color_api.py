import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import EmotionCard, Intensity


class TestEmotionColorAPI:
    """感情色APIのシンプルテスト"""

    @pytest.mark.asyncio
    async def test_get_emotion_colors(self, client, db_session: AsyncSession):
        """感情カードの取得"""
        card = EmotionCard(id="e1", label="うれしい", color="#FFCC00", image_url="/img.webp")
        db_session.add(card)
        await db_session.commit()

        res = client.get("/api/v1/emotion/colors/cards")
        assert res.status_code == 200
        data = res.json()
        assert data["cards"][0]["id"] == "e1"

    @pytest.mark.asyncio
    async def test_get_intensity_colors(self, client, db_session: AsyncSession):
        """強度取得"""
        intensity = Intensity(id=1, level="low", description="少し", color_modifier=40)
        db_session.add(intensity)
        await db_session.commit()

        res = client.get("/api/v1/emotion/colors/intensities")
        assert res.status_code == 200
        data = res.json()
        assert data["intensities"][0]["color_modifier"] == 0.4

    @pytest.mark.asyncio
    async def test_get_color_combination(self, client, db_session: AsyncSession):
        """感情×強度の組み合わせ計算"""
        card = EmotionCard(id="e2", label="うれしい", color="#FFCC00", image_url="/img.webp")
        intensity = Intensity(id=2, level="medium", description="普通に", color_modifier=70)
        db_session.add_all([card, intensity])
        await db_session.commit()

        res = client.get("/api/v1/emotion/colors/combination",
                         params={"emotion_id": "e2", "intensity_id": 2})
        assert res.status_code == 200
        data = res.json()
        assert data["rgba_color"].startswith("rgba(")

    @pytest.mark.asyncio
    async def test_invalid_ids(self, client):
        """存在しないIDで404"""
        res = client.get("/api/v1/emotion/colors/combination",
                         params={"emotion_id": "xxx", "intensity_id": 999})
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_missing_params(self, client):
        """パラメータ不足で422"""
        res = client.get("/api/v1/emotion/colors/combination")
        assert res.status_code == 422
