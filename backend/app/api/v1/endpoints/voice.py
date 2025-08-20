from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
import os
import tempfile
import time
import logging

import anyio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import (
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    VoiceUploadRequest,
    VoiceSaveRequest,
)
from app.services.whisper import WhisperService
from app.services.s3 import S3Service
from app.database import get_db
from app.models import EmotionLog

router = APIRouter(prefix="/voice", tags=["voice"])

logger = logging.getLogger(__name__)  # uvicorn側の設定に従って出力されます


# バリデーション
def _validate_local_audio_file(path: str, language: str) -> None:
    ALLOWED_EXT = {"webm", "wav", "mp3", "m4a"}
    ALLOWED_LANG = {"ja", "en"}

    if not os.path.exists(path):
        raise HTTPException(status_code=400, detail="Downloaded audio file not found")
    size = os.path.getsize(path)
    if size <= 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if size > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large")

    ext = os.path.splitext(path)[1].lower().lstrip(".")
    if ext and ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: .{ext}")

    if language not in ALLOWED_LANG:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")


# --- WhisperService をプロセス内シングルトンで使い回す -------------------
_whisper_service: Optional[WhisperService] = None
def get_whisper_service() -> WhisperService:
    global _whisper_service
    if _whisper_service is None:
        logger.info("WhisperService: initialize (singleton)")
        _whisper_service = WhisperService()
    return _whisper_service


@router.get(
    "/health",
    summary="音声APIヘルスチェック",
    description="音声APIの稼働状態を確認",
    responses={
        200: {
            "description": "サービス稼働中",
            "content": {
                "application/json": {
                    "example": {"status": "healthy", "service": "voice-api"}
                }
            },
        }
    },
)
async def health_check():
    logger.debug("health_check: ok")
    return {"status": "healthy", "service": "voice-api"}


@router.post(
    "/transcribe",
    response_model=VoiceTranscribeResponse,
    summary="音声認識実行",
    description=(
        "S3に置いた音声ファイルをWhisperで文字起こし\n"
        "- `audio_file_path`: S3キー推奨（例: `audio/<uuid>/xxx.webm`）。\n"
        "- `s3://bucket/key` も可。HTTP(S)直URLは未対応。"
    ),
)
async def transcribe_voice(
    request: VoiceTranscribeRequest,
    whisper: WhisperService = Depends(get_whisper_service),
) -> VoiceTranscribeResponse:
    """
    audio_file_path の許可形式:
      - 'audio/<uuid>/xxx.ext'     ← S3キー（推奨）
      - 's3://bucket-name/audio/..'← s3 URI
      - '/tmp/xxx.wav'             ← ローカル絶対パス（内部用）
    """
    s3 = S3Service()
    tmp_path: Optional[str] = None

    # 入口ログ（パスの“種類”だけ出す）
    p = request.audio_file_path
    path_kind = (
        "local" if (os.path.isabs(p) and os.path.exists(p))
        else "s3uri" if p.startswith("s3://")
        else "http" if p.startswith(("http://", "https://"))
        else "s3key"
    )
    logger.info(
        "transcribe: start",
        extra={"path_kind": path_kind, "language": request.language}
    )

    t0 = time.monotonic()
    try:
        # 1) ローカル絶対パス
        if path_kind == "local":
            local_path = p
            logger.debug("transcribe: use local path", extra={"path": local_path})

        # 2) s3://bucket/key
        elif path_kind == "s3uri":
            rest = p.replace("s3://", "", 1)
            bucket, key = rest.split("/", 1)
            suffix = os.path.splitext(key)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            logger.info("s3 download: begin", extra={"bucket": bucket, "key": key, "tmp": tmp_path})
            s3.download_file(s3_key=key, local_file_path=tmp_path, bucket_name=bucket)
            size = os.path.getsize(tmp_path)
            logger.info("s3 download: done", extra={"bytes": size})
            local_path = tmp_path

        # 3) S3キー（例: 'audio/<uuid>/xxx.ext'）
        elif path_kind == "s3key":
            suffix = os.path.splitext(p)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            logger.info("s3 download: begin", extra={"bucket": s3.bucket_name, "key": p, "tmp": tmp_path})
            try:
                s3.download_file(s3_key=p, local_file_path=tmp_path, bucket_name=s3.bucket_name)
            except Exception as e:
                logger.exception("s3 download: error")
                raise HTTPException(status_code=500, detail=f"S3ダウンロードエラー: {str(e)}")
            size = os.path.getsize(tmp_path) if os.path.exists(tmp_path) else 0
            logger.info("s3 download: done", extra={"bytes": size})
            if size == 0:
                raise HTTPException(status_code=400, detail="S3からのファイルダウンロードに失敗しました")
            local_path = tmp_path

        # 4) http(s) 未対応
        else:
            logger.warning("transcribe: http(s) not supported")
            raise HTTPException(status_code=400, detail="HTTP(S)の音声URLは未対応です。S3キーか s3:// を渡してください。")

        # 事前バリデーション
        _validate_local_audio_file(local_path, request.language)
        logger.debug("transcribe: local file validated", extra={"path": local_path})

        # Whisper は同期API → スレッドで実行
        t1 = time.monotonic()
        logger.info("whisper: begin")
        result = await anyio.to_thread.run_sync(
            lambda: whisper.transcribe_audio(
                local_path,
                language=request.language or "ja",
            )
        )
        t2 = time.monotonic()
        logger.info(
            "whisper: done",
            extra={
                "sec": round(t2 - t1, 2),
                "text_len": len(result.get("text", "")),
                "det_lang": result.get("language"),
            },
        )

        resp = VoiceTranscribeResponse(
            success=True,
            transcription_id=0,  # 追ってDB保存する場合は実IDを返す
            text=result.get("text", ""),
            confidence=float(result.get("confidence", 0.0))
            if isinstance(result.get("confidence", 0.0), (int, float))
            else 0.0,
            language=result.get("language", request.language or "ja"),
            duration=float(result.get("duration", 0.0)),
            processed_at=datetime.now(timezone.utc),
        )
        logger.info("transcribe: success", extra={"total_sec": round(time.monotonic() - t0, 2)})
        return resp

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("transcribe: failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {type(e).__name__}: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                logger.debug("transcribe: tmp cleaned", extra={"tmp": tmp_path})
            except Exception:
                logger.warning("transcribe: tmp cleanup failed", extra={"tmp": tmp_path})


@router.post(
    "/get-upload-url",
    summary="アップロード用Presigned URL取得",
    description=(
        "S3に直接アップロードするための署名付きPUT URLを発行\n"
        "- リクエストで `file_type`（'audio' | 'text'）と `file_format`（例: 'webm' | 'wav' | 'mp3' | 'm4a' | 'txt'）を指定。\n"
        "- レスポンスの `upload_url` に、フロントから `PUT`（ヘッダ Content-Type は `content_type` をそのまま送る）。\n"
        "- `file_path` はDBに保存するべき **S3のキー**。"
    ),
)
async def get_upload_url(request: VoiceUploadRequest, db: AsyncSession = Depends(get_db)):
    s3 = S3Service()
    t0 = time.monotonic()
    try:
        # ファイル名用の一意ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        logger.info(
            "presign: begin",
            extra={"user_id": str(request.user_id), "file_type": request.file_type, "file_format": request.file_format},
        )

        # ---- file_type ごとに拡張子とContent-Typeを決定 ----
        if request.file_type == "audio":
            if request.file_format == "webm":
                ext, content_type = "webm", "audio/webm"
            elif request.file_format == "wav":
                ext, content_type = "wav", "audio/wav"
            elif request.file_format == "mp3":
                ext, content_type = "mp3", "audio/mpeg"
            elif request.file_format in ("m4a",):
                ext, content_type = "m4a", "audio/mp4"
            else:
                ext, content_type = "wav", "audio/wav"

            file_path = f"audio/{request.user_id}/audio_{timestamp}_{unique_id}.{ext}"

        elif request.file_type == "text":
            ext, content_type = "txt", "text/plain"
            file_path = f"text/{request.user_id}/transcript_{timestamp}_{unique_id}.{ext}"

        else:
            logger.warning("presign: invalid file_type", extra={"file_type": request.file_type})
            raise HTTPException(status_code=400, detail="Invalid file type")

        presigned_url = s3.generate_presigned_upload_url(file_path, content_type)
        if not presigned_url:
            logger.error("presign: failed to generate url", extra={"key": file_path})
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")

        # URL本体はログに出さない（秘匿）→長さのみ
        logger.info(
            "presign: success",
            extra={"key": file_path, "content_type": content_type, "url_len": len(presigned_url), "sec": round(time.monotonic() - t0, 2)},
        )
        return {
            "success": True,
            "upload_url": presigned_url,
            "file_path": file_path,
            "s3_url": s3.get_file_url(file_path),
            "content_type": content_type,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("presign: failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/save-record",
    summary="ファイルキー保存",
    description="音声・文字ファイルのS3キーをデータベースに保存（URLは保存しない）",
)
async def save_record(request: VoiceSaveRequest, db: AsyncSession = Depends(get_db)):
    s3 = S3Service()
    t0 = time.monotonic()
    try:
        # “s3://<bucket>/...” や “https://...” が来た場合も key に正規化して保存
        def to_key(p: Optional[str]) -> Optional[str]:
            if not p:
                return None
            prefix = f"s3://{s3.bucket_name}/"
            if p.startswith(prefix):
                return p.replace(prefix, "")
            if p.startswith(("http://", "https://")):
                from urllib.parse import urlparse, unquote
                u = urlparse(p)
                path = unquote(u.path.lstrip("/"))
                if path.startswith(f"{s3.bucket_name}/"):
                    return path[len(s3.bucket_name) + 1 :]
                return path
            return p

        audio_key = to_key(request.audio_file_path)
        text_key = to_key(request.text_file_path)
        logger.info(
            "save-record: begin",
            extra={"user_id": str(request.user_id), "audio_key": bool(audio_key), "text_key": bool(text_key)},
        )

        voice_record = EmotionLog(
            user_id=request.user_id,
            audio_file_path=audio_key,
            text_file_path=text_key,
        )

        db.add(voice_record)
        await db.commit()
        await db.refresh(voice_record)

        logger.info("save-record: success", extra={"record_id": str(voice_record.id), "sec": round(time.monotonic() - t0, 2)})
        return {
            "success": True,
            "record_id": voice_record.id,
            "message": "Record saved successfully",
        }

    except Exception as e:
        await db.rollback()
        logger.exception("save-record: failed")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/records/{user_id}",
    summary="記録一覧取得",
    description="指定ユーザーのS3キーとダウンロード用Presigned URLを返す（URLは都度生成）。",
)
async def get_records(user_id: UUID, db: AsyncSession = Depends(get_db)):
    s3 = S3Service()
    t0 = time.monotonic()
    try:
        logger.info("records: begin", extra={"user_id": str(user_id)})
        query = (
            select(EmotionLog)
            .where(EmotionLog.user_id == user_id)
            .order_by(EmotionLog.id.desc())
        )
        result = await db.execute(query)
        records = result.scalars().all()
        logger.info("records: fetched", extra={"count": len(records), "sec": round(time.monotonic() - t0, 2)})

        def to_key(p: Optional[str]) -> Optional[str]:
            if not p:
                return None
            prefix = f"s3://{s3.bucket_name}/"
            if p.startswith(prefix):
                return p.replace(prefix, "")
            if p.startswith(("http://", "https://")):
                from urllib.parse import urlparse, unquote
                u = urlparse(p)
                path = unquote(u.path.lstrip("/"))
                if path.startswith(f"{s3.bucket_name}/"):
                    return path[len(s3.bucket_name) + 1 :]
                return path
            return p

        payload = {
            "success": True,
            "records": [
                {
                    "id": r.id,
                    "audio_path": to_key(r.audio_file_path),
                    "text_path": to_key(r.text_file_path),
                    "audio_download_url": (
                        s3.generate_presigned_download_url(to_key(r.audio_file_path))
                        if r.audio_file_path else None
                    ),
                    "text_download_url": (
                        s3.generate_presigned_download_url(to_key(r.text_file_path))
                        if r.text_file_path else None
                    ),
                    # ファイル名から日時を抽出（audio_YYYYMMDD_HHMMSS_xxx.ext を想定）
                    "created_at": (
                        (to_key(r.audio_file_path) or "").split("/")[-1].split("_")[1:3]
                        if r.audio_file_path else None
                    ),
                }
                for r in records
            ],
        }
        logger.info("records: success", extra={"count": len(payload["records"])})
        return payload

    except Exception as e:
        logger.exception("records: failed")
        raise HTTPException(status_code=500, detail=str(e))
