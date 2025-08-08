from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import uuid
from typing import Optional
from pydantic import BaseModel, Field

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# データベース接続を直接定義
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_db():
    async with async_session_local() as session:
        yield session


from app.models import EmotionLog
from app.s3_service import S3Service

router = APIRouter(prefix="/voice", tags=["voice"])


# リクエストモデル
class UploadRequest(BaseModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    file_type: str = Field(
        ..., description="ファイルタイプ", example="audio"
    )  # "audio" or "text"
    file_format: Optional[str] = Field(
        default="webm", description="ファイル形式"
    )  # "webm", "wav", "mp3" など。今回はwebmを使用。


class SaveRecordRequest(BaseModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    audio_file_path: str = Field(..., description="音声ファイルのS3パス")
    text_file_path: Optional[str] = Field(None, description="テキストファイルのS3パス")


@router.post(
    "/get-upload-url",
    summary="アップロード用Presigned URL取得",
    description="""
    S3に直接アップロードするための署名付きURLを発行するAPIです。
    
    ## 使用フロー
    1. このAPIでアップロード用URLを取得
    2. 取得したURLに直接ファイルをアップロード（PUT）
    3. アップロード完了後、`/voice/save-record`でファイルパスをDBに保存
    
    ## 使用例（JavaScript）
    ```javascript
    // 1. アップロードURLを取得
    const response = await fetch('/voice/get-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: 1, 
        file_type: 'audio',
        file_format: 'webm'
      })
    });
    
    const { upload_url, content_type } = await response.json();
    
    // 2. MediaRecorderで録音
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    mediaRecorder.ondataavailable = async (event) => {
      const audioBlob = event.data;
      
      // 3. 直接S3にアップロード
      await fetch(upload_url, {
        method: 'PUT',
        body: audioBlob,
        headers: { 'Content-Type': content_type }
      });
    };
    ```
    
    ## セキュリティ
    - 署名付きURLの有効期限は1時間
    - ユーザー固有のファイルパスを生成
    - ファイル形式の制限あり
    
    ## 対応ファイル形式
    - **音声**: webm, wav, mp3
    - **テキスト**: txt
    """,
    response_description="アップロード用URLとファイル情報を返します",
)
async def get_upload_url(request: UploadRequest, db: AsyncSession = Depends(get_db)):

    try:
        s3_service = S3Service()

        # ファイル名を生成
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]

        if request.file_type == "audio":
            # ファイル形式に応じて拡張子とContent-Typeを設定
            if request.file_format == "webm":
                file_extension = "webm"
                content_type = "audio/webm"
            elif request.file_format == "wav":
                file_extension = "wav"
                content_type = "audio/wav"
            elif request.file_format == "mp3":
                file_extension = "mp3"
                content_type = "audio/mpeg"
            else:
                # デフォルトはWebMでいく
                file_extension = "webm"
                content_type = "audio/webm"

            file_path = f"audio/{request.user_id}/audio_{timestamp}_{unique_id}.{file_extension}"
        elif request.file_type == "text":
            file_path = f"text/{request.user_id}/text_{timestamp}_{unique_id}.txt"
            content_type = "text/plain"
        else:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # Presigned URLを生成
        presigned_url = s3_service.generate_presigned_upload_url(
            file_path, content_type
        )
        if not presigned_url:
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")

        return {
            "success": True,
            "upload_url": presigned_url,
            "file_path": file_path,
            "s3_url": s3_service.get_file_url(file_path),
            "content_type": content_type,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/save-record",
    summary="ファイルパス保存",
    description="""
    音声・文字ファイルのパスをデータベースに保存するAPIです。
    
    ## 使用タイミング
    - S3へのファイルアップロード完了後
    - ファイルパスをDBに記録して管理
    
    ## 使用例（JavaScript）
    ```javascript
    // 4. ファイルパスをDBに保存
    await fetch('/voice/save-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        audio_file_path: 's3://bucket-name/audio/1/audio_20241201_143022_abc123.webm',
        text_file_path: 's3://bucket-name/text/1/text_20241201_143022_abc123.txt'  // オプション
      })
    });
    ```
    
    ## 注意事項
    - ファイルパスはS3の形式（s3://bucket-name/path）で指定してください
    """,
    response_description="保存成功時はレコードIDを返します",
)
async def save_record(request: SaveRecordRequest, db: AsyncSession = Depends(get_db)):

    try:
        # DBに記録を保存
        voice_record = EmotionLog(
            user_id=request.user_id,
            audio_file_path=request.audio_file_path,
            text_file_path=request.text_file_path,
        )

        db.add(voice_record)
        await db.commit()
        await db.refresh(voice_record)

        return {
            "success": True,
            "record_id": voice_record.id,
            "message": "Record saved successfully",
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/records/{user_id}",
    summary="記録一覧取得",
    description="""
    指定ユーザーのファイル情報とダウンロード用Presigned URLを返すAPIです。
    
    ## 使用タイミング
    - ファイル一覧の表示時
    - ダウンロード用URLの取得時
    
    ## 使用例（JavaScript）
    ```javascript
    // 5. ファイル一覧を取得
    const records = await fetch('/voice/records/1');
    const { records } = await records.json();
    
    // レスポンス例
    {
      "success": true,
      "records": [
        {
          "id": 123,
          "audio_path": "s3://bucket-name/audio/1/audio_20241201_143022_abc123.webm",
          "text_path": "s3://bucket-name/text/1/text_20241201_143022_abc123.txt",
          "audio_download_url": "https://bucket-name.s3.ap-northeast-1.amazonaws.com/...",
          "text_download_url": "https://bucket-name.s3.ap-northeast-1.amazonaws.com/...",
          "created_at": ["20241201", "143022"]
        }
      ]
    }
    ```
    
    ## 取得情報
    - ファイルの基本情報（ID、パス、作成日時）
    - ダウンロード用の署名付きURL（1時間有効）
    
    ## セキュリティ
    - ユーザー固有のデータのみ取得可能
    - ダウンロードURLは一時的なアクセス権限
    
    ## レスポンス形式
    - ファイル一覧を新しい順で返します
    - 作成日時はファイル名から抽出されます
    """,
    response_description="ユーザーのファイル一覧とダウンロードURLを返します",
)
async def get_records(user_id: int, db: AsyncSession = Depends(get_db)):
    try:
        s3_service = S3Service()
        query = (
            select(EmotionLog)
            .where(EmotionLog.user_id == user_id)
            .order_by(EmotionLog.id.desc())
        )
        result = await db.execute(query)
        records = result.scalars().all()

        return {
            "success": True,
            "records": [
                {
                    "id": record.id,
                    "audio_path": record.audio_file_path,
                    "text_path": record.text_file_path,
                    "audio_download_url": s3_service.generate_presigned_download_url(
                        record.audio_file_path.replace(
                            f"s3://{s3_service.bucket_name}/", ""
                        )
                    ),
                    "text_download_url": (
                        s3_service.generate_presigned_download_url(
                            record.text_file_path.replace(
                                f"s3://{s3_service.bucket_name}/", ""
                            )
                        )
                        if record.text_file_path
                        else None
                    ),
                    "created_at": record.audio_file_path.split("/")[-1].split("_")[
                        1:3
                    ],  # ファイル名から日時を抽出
                }
                for record in records
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))