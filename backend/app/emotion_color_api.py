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

from app.models import EmotionCard, Intensity, EmotionLog

# データベース接続を直接定義
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def get_db():
    async with async_session_local() as session:
        yield session

router = APIRouter(prefix="/emotion", tags=["emotion"])

# リクエストモデル（DBに合わせて必須/型を統一）
class CreateEmotionLogRequest(BaseModel):
    user_id: UUID = Field(..., description="ユーザーID(UUID)")
    child_id: UUID = Field(..., description="子供のID(UUID)")
    emotion_card_id: UUID = Field(..., description="感情カードID(UUID)")
    intensity_id: int = Field(..., description="強度ID (1/2/3 等)")
    voice_note: str = Field(..., description="音声メモ")
    text_file_path: str = Field(..., description="テキストファイルのS3パス")
    audio_file_path: Optional[str] = Field(None, description="音声ファイルのS3パス")


@router.get(
    "/cards",
    summary="感情カード一覧取得",
    description="""
    感情選択画面で使用する感情カードの一覧をDBから取得します。

    ## 使用タイミング
    - 感情選択画面の初期表示時
    - 感情カードの表示用データ取得時

    ## 使用例（JavaScript）
    ```javascript
    const response = await fetch('/emotion/cards');
    const data = await response.json();
    // data = { success: true, cards: [{ id, label, image_url, color }, ...] }
    ```

    ## レスポンス例
    ```json
    {
      "success": true,
      "cards": [
        {
          "id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
          "label": "うれしい",
          "image_url": "/images/ureshii.webp",
          "color": "#FFCC00"
        }
      ]
    }
    ```

    ## 取得情報
    - `id`: UUID文字列
    - `label`: 感情名
    - `image_url`: 画像パス
    - `color`: ベースカラー（HEX）

    ## 表示のヒント
    - 強度は `/emotion/intensities` の `color_modifier` と組み合わせて前端で透明度を調整
    """,
    response_description="感情カード一覧を返します",
)
async def get_emotion_cards(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(EmotionCard))
        cards = result.scalars().all()
        return {
            "success": True,
            "cards": [
                {
                    "id": str(card.id),
                    "label": card.label,
                    "image_url": card.image_url,
                    "color": card.color,
                }
                for card in cards
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/intensities",
    summary="強度一覧取得",
    description="""
    感情の強度レベル一覧をDBから取得します。

    ## 使用タイミング
    - 強度選択UIの初期表示時
    - 色の透明度計算用データ取得時

    ## 使用例（JavaScript）
    ```javascript
    const response = await fetch('/emotion/intensities');
    const data = await response.json();
    // data = { success: true, intensities: [{ id, color_modifier }, ...] }
    ```

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
    response_description="強度一覧を返します",
)
async def get_intensities(db: AsyncSession = Depends(get_db)):
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


@router.post(
    "/logs",
    summary="感情記録作成",
    description="""
    ユーザーの感情記録をDBに保存します。

    ## 使用フロー
    1. `/emotion/cards` と `/emotion/intensities` で選択候補を取得
    2. 前端でカードと強度を選択し、任意で音声・テキストのS3パスを指定
    3. 本APIにPOSTして記録を作成

    ## リクエスト例（JSON）
    ```json
    {
      "user_id": "0d7b2d2a-2a18-4b2d-9d5f-8d4b2c3a1f00",
      "child_id": "a1f0d7b2-2a18-4b2d-9d5f-8d4b2c3a1f01",
      "emotion_card_id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
      "intensity_id": 2,
      "voice_note": "こころんとおはなしして楽しかった",
      "text_file_path": "s3://bucket/text/user-uuid/2024-01-01.txt",
      "audio_file_path": "s3://bucket/audio/user-uuid/2024-01-01.webm"
    }
    ```

    ## レスポンス例
    ```json
    {
      "success": true,
      "log_id": "3f9c22c1-9a1c-4a9d-8f6f-1c2a3b4d5e6f",
      "message": "Emotion log created successfully"
    }
    ```

    ## 必須項目
    - `user_id` / `child_id` / `emotion_card_id`: UUID 文字列
    - `intensity_id`: 既存の強度ID（例: 1,2,3）
    - `voice_note`, `text_file_path`: 文字列

    ## 注意事項
    - 参照するIDはすべて既存レコードである必要があります（外部キー制約）
    - 強度は必須です（「わからない」を許容したい場合はDB設計変更が必要）
    """,
    response_description="感情記録作成結果を返します",
)
async def create_emotion_log(
    request: CreateEmotionLogRequest, db: AsyncSession = Depends(get_db)
):
    try:
        emotion_log = EmotionLog(
            user_id=request.user_id,
            child_id=request.child_id,
            emotion_card_id=request.emotion_card_id,
            intensity_id=request.intensity_id,
            voice_note=request.voice_note,
            text_file_path=request.text_file_path,
            audio_file_path=request.audio_file_path,
        )

        db.add(emotion_log)
        await db.commit()
        await db.refresh(emotion_log)

        return {
            "success": True,
            "log_id": str(emotion_log.id),
            "message": "Emotion log created successfully",
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
