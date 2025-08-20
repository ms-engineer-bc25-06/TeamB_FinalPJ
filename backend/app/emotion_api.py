from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

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

# 感情記録作成用リクエストモデル（段階的保存対応）
class CreateEmotionLogRequest(BaseModel):
    user_id: str = Field(..., description="Firebase UID")
    child_id: str = Field(..., description="子供のID（文字列）")
    emotion_card_id: str = Field(..., description="感情カードID（文字列）")
    intensity_id: int = Field(..., description="強度ID (1/2/3 等)")
    voice_note: str | None = None
    text_file_path: str | None = None
    audio_file_path: str | None = None

@router.get(
    "/cards",
    summary="感情カード一覧取得",
    description="""
    感情選択画面で使用する感情カードの一覧をDBから取得します。

    ## 使用タイミング
    - 感情選択画面の初期表示時
    - 感情カードの表示用データ取得時

    ## レスポンス例
    ```json
    {
      "success": true,
      "cards": [
        {
          "id": "8f5e4f8a-0e2f-4a2b-9dc3-6a4b1b3f4e12",
          "label": "うれしい",
          "image_url": "/images/emotions/ureshii.webp",
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
    - 強度選択用データ取得時

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
    summary="感情記録作成（段階的保存）",
    description="""
    感情カードと強度の選択のみをDBに保存します。音声・テキスト関連のデータは後で音声入力画面で更新されます。

    ## 使用フロー
    1. `/emotion/cards` と `/emotion/intensities` で選択候補を取得
    2. 前端でカードと強度を選択
    3. 本APIにPOSTして感情記録を作成
    4. 後で音声入力画面で音声・テキストデータを追加

    ## リクエスト例（JSON）
    ```json
    {
      "user_id": "user123",
      "child_id": "child456",
      "emotion_card_id": "ureshii",
      "intensity_id": 2
    }
    ```

    ## レスポンス例
    ```json
    {
      "success": true,
      "log_id": "emotion_log_123",
      "message": "Emotion log created successfully"
    }
    ```

    ## 必須項目
    - `user_id`: ユーザーID
    - `child_id`: 子供のID
    - `emotion_card_id`: 感情カードID
    - `intensity_id`: 強度ID (1/2/3)

    ## オプショナル項目
    - `voice_note`: 音声メモ（後で音声入力画面で更新）
    - `text_file_path`: テキストファイルのS3パス（後で音声入力画面で更新）
    - `audio_file_path`: 音声ファイルのS3パス（後で音声入力画面で更新）

    ## 注意事項
    - 音声・テキスト関連のフィールドは送信不要
    - 後で音声入力画面でこれらのデータが追加される
    """,
    response_description="感情記録保存結果を返します",
)
async def create_emotion_log(
    request: CreateEmotionLogRequest, db: AsyncSession = Depends(get_db)
):
    try:
        # Firebase UIDからユーザーIDを検索
        from app.crud import get_user_by_uid
        user = await get_user_by_uid(db, request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # 感情記録を作成（音声・テキスト関連は後で更新）
        emotion_log = EmotionLog(
            user_id=user.id,  # 検索したユーザーのUUIDを使用
            child_id=uuid.UUID(request.child_id),  # 文字列をUUIDに変換
            emotion_card_id=uuid.UUID(request.emotion_card_id),  # 文字列をUUIDに変換
            intensity_id=request.intensity_id,
            voice_note=request.voice_note,  # nullのまま（後で更新）
            text_file_path=request.text_file_path,  # nullのまま（後で更新）
            audio_file_path=request.audio_file_path,  # nullのまま
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
