from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
import os
import tempfile

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
from app.services.whisper import WhisperService  # Whisper モデルを包むサービス（同期APIなのでスレッドで実行）
from app.services.s3 import S3Service            # S3 への presign, get_url, download_file などのラッパ
from app.database import get_db
from app.models import EmotionLog

router = APIRouter(prefix="/voice", tags=["voice"])

# Whisper 実行前の“最小”バリデーション
def _validate_local_audio_file(path: str, language: str) -> None:
    ALLOWED_EXT = {"webm", "wav", "mp3", "m4a"}
    ALLOWED_LANG = {"ja", "en"}

    if not os.path.exists(path):
        raise HTTPException(status_code=400, detail="Downloaded audio file not found")
    size = os.path.getsize(path)
    if size <= 0:
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if size > 25 * 1024 * 1024:  # 必要なら調整
        raise HTTPException(status_code=413, detail="Audio file too large")

    ext = os.path.splitext(path)[1].lower().lstrip(".")
    if ext and ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: .{ext}")

    if language not in ALLOWED_LANG:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

# WhisperService をプロセス内シングルトンで使い回す
_whisper_service: Optional[WhisperService] = None
def get_whisper_service() -> WhisperService:
    global _whisper_service
    if _whisper_service is None:
        _whisper_service = WhisperService()
    return _whisper_service


@router.get("/health", summary="音声APIヘルスチェック", description="音声APIの稼働状態を確認")
async def health_check():
    return {"status": "healthy", "service": "voice-api"}


@router.post(
    "/transcribe",
    response_model=VoiceTranscribeResponse,
    summary="音声認識実行",
    description=(
        "S3に置いた音声ファイルをWhisperで文字起こし"
        "\\n- `audio_file_path`: S3キー推奨（例: `audio/<uuid>/xxx.webm`）。"
        "\\n- `s3://bucket/key` も可。HTTP(S)直URLは未対応。"
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

    try:
        p = request.audio_file_path

        # 1) ローカル絶対パス
        if os.path.isabs(p) and os.path.exists(p):
            local_path = p

        # 2) s3://bucket/key
        elif p.startswith("s3://"):
            rest = p.replace("s3://", "", 1)
            bucket, key = rest.split("/", 1)
            suffix = os.path.splitext(key)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            s3.download_file(s3_key=key, local_file_path=tmp_path, bucket_name=bucket)
            local_path = tmp_path

        # 3) S3キー（例: 'audio/<uuid>/xxx.ext'）
        elif not p.startswith(("http://", "https://")):
            suffix = os.path.splitext(p)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            try:
                print(f" S3ダウンロード開始: key={p}, bucket={s3.bucket_name}")
                s3.download_file(s3_key=p, local_file_path=tmp_path, bucket_name=s3.bucket_name)
                print(f"🎯 S3ダウンロード完了: {tmp_path}")
                if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
                    raise HTTPException(status_code=400, detail="S3からのファイルダウンロードに失敗しました")
            except Exception as e:
                print(f"🎯 S3ダウンロードエラー: {e}")
                raise HTTPException(status_code=500, detail=f"S3ダウンロードエラー: {str(e)}")
            local_path = tmp_path

        # 4) http(s) 未対応
        else:
            raise HTTPException(status_code=400, detail="HTTP(S)の音声URLは未対応です。S3キーか s3:// を渡してください。")

        # Whisper 実行前に“最小バリデーション”を適用
        _validate_local_audio_file(local_path, request.language or "ja")

        # Whisper は同期API → スレッドで実行
        result = await anyio.to_thread.run_sync(
            lambda: whisper.transcribe_audio(
                local_path,
                language=request.language or "ja",
            )
        )

        return VoiceTranscribeResponse(
            success=True,
            transcription_id=0,  # 追ってDB保存する場合は実IDを返す
            text=result.get("text", ""),
            confidence=float(result.get("confidence", 0.0)) if isinstance(result.get("confidence", 0.0), (int, float)) else 0.0,
            language=result.get("language", request.language or "ja"),
            duration=float(result.get("duration", 0.0)),
            processed_at=datetime.now(timezone.utc),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {type(e).__name__}: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass


@router.post(
    "/get-upload-url",
    summary="アップロード用Presigned URL取得",
    description=(
        "S3に直接アップロードするための署名付きPUT URLを発行"
        "\\n- リクエストで `file_type`（'audio' | 'text'）と `file_format`（例: 'webm' | 'wav' | 'mp3' | 'm4a' | 'txt'）を指定。"
        "\\n- レスポンスの `upload_url` に、フロントから `PUT` してください（Content-Type は `content_type` をそのまま送る）。"
        "\\n- `file_path` はDBに保存するべき **S3のキー**（例: `audio/<uuid>/audio_YYYYMMDD_HHMMSS_xxxx.webm`）。"
    ),
)
async def get_upload_url(request: VoiceUploadRequest, db: AsyncSession = Depends(get_db)):
    try:
        s3 = S3Service()

        # ファイル名用の一意ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        import uuid
        unique_id = str(uuid.uuid4())[:8]

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
                # デフォルトは wav
                ext, content_type = "wav", "audio/wav"

            file_path = f"audio/{request.user_id}/audio_{timestamp}_{unique_id}.{ext}"

        elif request.file_type == "text":
            # テキストファイルは txt 固定（必要なら拡張）
            ext, content_type = "txt", "text/plain"
            file_path = f"text/{request.user_id}/transcript_{timestamp}_{unique_id}.{ext}"

        else:
            raise HTTPException(status_code=400, detail="Invalid file type")

        # 署名付きPUT URLを発行（Content-Type固定）
        presigned_url = s3.generate_presigned_upload_url(file_path, content_type)
        if not presigned_url:
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")

        # フロントは `upload_url` に PUT、DBには `file_path`（key）を保存する
        return {
            "success": True,
            "upload_url": presigned_url,
            "file_path": file_path,
            "s3_url": s3.get_file_url(file_path),
            "content_type": content_type,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/save-record",
    summary="ファイルキー保存",
    description="音声・文字ファイルのS3キーをデータベースに保存（URLは保存しない）",
)
async def save_record(request: VoiceSaveRequest, db: AsyncSession = Depends(get_db)):
    try:
        s3 = S3Service()

        # “s3://<bucket>/...” や “https://...” が来た場合も key に正規化して保存
        def to_key(p: Optional[str]) -> Optional[str]:
            if not p:
                return None
            # s3://bucket/key → key
            prefix = f"s3://{s3.bucket_name}/"
            if p.startswith(prefix):
                return p.replace(prefix, "")
            # https://<bucket>.s3.<region>.amazonaws.com/key → key の簡易対応（必要に応じて強化）
            if p.startswith("http://") or p.startswith("https://"):
                from urllib.parse import urlparse, unquote
                u = urlparse(p)
                path = unquote(u.path.lstrip("/"))
                if path.startswith(f"{s3.bucket_name}/"):
                    return path[len(s3.bucket_name) + 1:]
                return path
            return p

        voice_record = EmotionLog(
            user_id=request.user_id,                          # UUID はそのまま
            audio_file_path=to_key(request.audio_file_path),  # ← keyのみ
            text_file_path=to_key(request.text_file_path),    # ← keyのみ（任意）
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
    description="指定ユーザーのS3キーとダウンロード用Presigned URLを返す（URLは都度生成）。",
)
async def get_records(user_id: UUID, db: AsyncSession = Depends(get_db)):
    try:
        s3 = S3Service()
        query = (
            select(EmotionLog)
            .where(EmotionLog.user_id == user_id)
            .order_by(EmotionLog.id.desc())
        )
        result = await db.execute(query)
        records = result.scalars().all()

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
                    return path[len(s3.bucket_name) + 1:]
                return path
            return p

        return {
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
