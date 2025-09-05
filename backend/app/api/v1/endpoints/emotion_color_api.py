from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.models import EmotionCard, Intensity

# データベース接続を直接定義
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db():
    async with async_session_local() as session:
        yield session


router = APIRouter(prefix="/emotion/colors", tags=["emotion-colors"])


# 色の組み合わせ計算用レスポンスモデル
class ColorCombinationResponse(BaseModel):
    emotion_id: UUID
    emotion_label: str
    base_color: str
    intensity_id: int
    color_modifier: float
    final_color: str
    rgba_color: str


@router.get(
    "/cards",
    summary="感情カードの色情報取得",
    description="""
    感情選択画面で使用する感情カードの色情報のみをDBから取得します。

    ## 使用タイミング
    - 感情選択画面の色表示時
    - 色の計算が必要な時

    ## レスポンス例
    ```json
    {
      "success": true,
      "cards": [
        {
          "id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
          "label": "うれしい",
          "color": "#FFCC00"
        }
      ]
    }
    ```

    ## 取得情報
    - `id`: UUID文字列
    - `label`: 感情名
    - `color`: ベースカラー（HEX）
    """,
    response_description="感情カードの色情報を返します",
)
async def get_emotion_colors(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(EmotionCard))
        cards = result.scalars().all()
        return {
            "success": True,
            "cards": [
                {
                    "id": str(card.id),
                    "label": card.label,
                    "color": card.color,
                }
                for card in cards
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/intensities",
    summary="強度による色調整情報取得",
    description="""
    感情の強度レベルによる色の透明度調整情報をDBから取得します。

    ## 使用タイミング
    - 強度選択UIの色表示時
    - 色の透明度計算時

    ## レスポンス例
    ```json
    {
      "success": true,
      "intensities": [
        { "id": 1, "color_modifier": 0.4 },
        { "id": 2, "color_modifier": 0.7 },
        { "id": 3, "color_modifier": 1.0 }
      ]
    }
    ```

    ## 取得情報
    - `id`: 強度ID（1, 2, 3 ...）
    - `color_modifier`: 透明度（0.0-1.0）。例: 0.7 → RGBAのalpha 0.7 相当

    ## 表示のヒント
    - ベースカラー `#RRGGBB` と `color_modifier` を組み合わせて `rgba(r,g,b, color_modifier)` を計算
    """,
    response_description="強度による色調整情報を返します",
)
async def get_intensity_colors(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Intensity))
        intensities = result.scalars().all()
        return {
            "success": True,
            "intensities": [
                {"id": intensity.id, "color_modifier": intensity.color_modifier / 100}
                for intensity in intensities
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/combinations/{emotion_id}/{intensity_id}",
    summary="感情+強度の色組み合わせ計算",
    description="""
    特定の感情カードと強度の組み合わせによる最終的な色を計算して返します。

    ## 使用タイミング
    - 感情+強度選択後の色表示時
    - 色のプレビュー表示時

    ## レスポンス例
    ```json
    {
      "success": true,
      "combination": {
        "emotion_id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
        "emotion_label": "うれしい",
        "base_color": "#FFCC00",
        "intensity_id": 2,
        "color_modifier": 0.7,
        "final_color": "#FFCC00",
        "rgba_color": "rgba(255, 204, 0, 0.7)"
      }
    }
    ```

    ## 計算ロジック
    - ベースカラーはそのまま
    - 透明度のみ強度に応じて調整
    - RGBA形式で透明度を表現
    """,
    response_description="感情+強度の色組み合わせを返します",
)
async def get_color_combination(
    emotion_id: UUID, intensity_id: int, db: AsyncSession = Depends(get_db)
):
    try:
        # 感情カードと強度を取得
        emotion_result = await db.execute(
            select(EmotionCard).where(EmotionCard.id == emotion_id)
        )
        intensity_result = await db.execute(
            select(Intensity).where(Intensity.id == intensity_id)
        )

        emotion_card = emotion_result.scalar_one_or_none()
        intensity = intensity_result.scalar_one_or_none()

        if not emotion_card:
            raise HTTPException(status_code=404, detail="Emotion card not found")
        if not intensity:
            raise HTTPException(status_code=404, detail="Intensity not found")

        # 色の計算
        color_modifier = intensity.color_modifier / 100
        base_color = emotion_card.color

        # HEXからRGBに変換（簡易版）
        if base_color.startswith("#"):
            r = int(base_color[1:3], 16)
            g = int(base_color[3:5], 16)
            b = int(base_color[5:7], 16)
            rgba_color = f"rgba({r}, {g}, {b}, {color_modifier})"
        else:
            rgba_color = f"rgba(0, 0, 0, {color_modifier})"

        return {
            "success": True,
            "combination": ColorCombinationResponse(
                emotion_id=emotion_card.id,
                emotion_label=emotion_card.label,
                base_color=base_color,
                intensity_id=intensity.id,
                color_modifier=color_modifier,
                final_color=base_color,
                rgba_color=rgba_color,
            ),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/preview",
    summary="全感情+強度の色プレビュー",
    description="""
    全ての感情カードと強度の組み合わせによる色のプレビューデータを返します。

    ## 使用タイミング
    - 開発・テスト時の色確認
    - 色の一覧表示

    ## レスポンス例
    ```json
    {
      "success": true,
      "previews": [
        {
          "emotion_id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
          "emotion_label": "うれしい",
          "base_color": "#FFCC00",
          "intensities": [
            { "id": 1, "color_modifier": 0.4, "rgba_color": "rgba(255, 204, 0, 0.4)" },
            { "id": 2, "color_modifier": 0.7, "rgba_color": "rgba(255, 204, 0, 0.7)" },
            { "id": 3, "color_modifier": 1.0, "rgba_color": "rgba(255, 204, 0, 1.0)" }
          ]
        }
      ]
    }
    ```
    """,
    response_description="全感情+強度の色プレビューを返します",
)
async def get_color_preview(db: AsyncSession = Depends(get_db)):
    try:
        # 感情カードと強度を全て取得
        emotion_result = await db.execute(select(EmotionCard))
        intensity_result = await db.execute(select(Intensity))

        emotion_cards = emotion_result.scalars().all()
        intensities = intensity_result.scalars().all()

        previews = []
        for emotion_card in emotion_cards:
            emotion_intensities = []
            for intensity in intensities:
                color_modifier = intensity.color_modifier / 100
                base_color = emotion_card.color

                # HEXからRGBに変換
                if base_color.startswith("#"):
                    r = int(base_color[1:3], 16)
                    g = int(base_color[3:5], 16)
                    b = int(base_color[5:7], 16)
                    rgba_color = f"rgba({r}, {g}, {b}, {color_modifier})"
                else:
                    rgba_color = f"rgba(0, 0, 0, {color_modifier})"

                emotion_intensities.append(
                    {
                        "id": intensity.id,
                        "color_modifier": color_modifier,
                        "rgba_color": rgba_color,
                    }
                )

            previews.append(
                {
                    "emotion_id": str(emotion_card.id),
                    "emotion_label": emotion_card.label,
                    "base_color": emotion_card.color,
                    "intensities": emotion_intensities,
                }
            )

        return {"success": True, "previews": previews}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
