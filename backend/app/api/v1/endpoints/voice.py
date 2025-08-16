from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import anyio
from app.schemas import (
    VoiceTranscribeRequest, 
    VoiceTranscribeResponse,
    VoiceUploadRequest,
    VoiceSaveRequest
)
from app.services.whisper import WhisperService
from app.services.s3 import S3Service
from app.database import get_db
from app.models import EmotionLog
from sqlalchemy import select

router = APIRouter(prefix="/voice", tags=["voice"])

# --- 依存性注入：WhisperService をシングルトンで使い回す ---
_whisper_service: Optional[WhisperService] = None
def get_whisper_service() -> WhisperService:
    global _whisper_service
    if _whisper_service is None:
        _whisper_service = WhisperService()  # モデル読み込みは高コスト → 1回だけ
    return _whisper_service

@router.get("/health", summary="音声APIヘルスチェック", description="音声APIの稼働状態を確認します。")
async def health_check():
    return {"status": "healthy", "service": "voice-api"}

@router.post(
    "/transcribe",
    response_model=VoiceTranscribeResponse,
    summary="音声認識実行",
    description="S3にある音声をWhisperで文字起こしして返します。"
)
async def transcribe_voice(
    request: VoiceTranscribeRequest,
    whisper: WhisperService = Depends(get_whisper_service),
    # db: AsyncSession = Depends(get_db),  # 将来DB保存するなら有効化
) -> VoiceTranscribeResponse:
    try:
        # WhisperService.transcribe_audio は同期関数だと仮定
        result = await anyio.to_thread.run_sync(
            whisper.transcribe_audio,
            request.audio_file_path,
            request.language or "ja",
        )

        # confidence が無い実装の場合に備えてデフォルト
        confidence = result.get("confidence", 0.0)
        duration = float(result.get("duration", 0.0))
        language = result.get("language", request.language or "ja")
        text = result.get("text", "")

        # TODO: 実際はDB保存して、そのレコードIDを使う
        return VoiceTranscribeResponse(
            success=True,
            transcription_id=1,
            text=text,
            confidence=confidence,
            language=language,
            duration=duration,
            processed_at=datetime.now(timezone.utc),
        )

    except HTTPException:
        raise  # 既に適切なHTTP例外ならそのまま
    except Exception as e:
        # TODO: ロガーで記録（例: logger.exception("Transcribe failed")）
        raise HTTPException(status_code=500, detail="Transcription failed")

@router.post(
    "/get-upload-url",
    summary="アップロード用Presigned URL取得",
    description="S3に直接アップロードするための署名付きURLを発行するAPIです。"
)
async def get_upload_url(request: VoiceUploadRequest, db: AsyncSession = Depends(get_db)):
    try:
        s3_service = S3Service()
        
        # ファイル名を生成
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        import uuid
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
                #デフォルトはwavに変更
                file_extension = "wav"
                content_type = "audio/wav"

            file_path = f"audio/{request.user_id}/audio_{timestamp}_{unique_id}.{file_extension}"
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
    description="音声・文字ファイルのパスをデータベースに保存するAPIです。"
)
async def save_record(request: VoiceSaveRequest, db: AsyncSession = Depends(get_db)):
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
    description="指定ユーザーのファイル情報とダウンロード用Presigned URLを返すAPIです。"
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