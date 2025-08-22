from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
import uuid
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

logging.basicConfig(level=logging.INFO, force=True)
logging.getLogger().setLevel(logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
logger.addHandler(handler)

# 強度レベルの文字列を数値IDに変換する関数
def convert_intensity_level(level_str: str) -> int:
    intensity_mapping = {
        'low': 1,
        'medium': 2,
        'high': 3
    }
    # デフォルトは2（中程度）を返す
    logger.info(f"🔢 強度レベル変換: '{level_str}' → {intensity_mapping.get(level_str, 2)}")
    return intensity_mapping.get(level_str, 2)

# バリデーション
def _validate_local_audio_file(path: str, language: str) -> None:
    ALLOWED_EXT = {"webm", "wav", "mp3", "m4a"}
    ALLOWED_LANG = {"ja", "en"}

    if not os.path.exists(path):
        logger.error(f"❌ バリデーションエラー: ファイルが存在しません - {path}")
        raise HTTPException(status_code=400, detail="Downloaded audio file not found")
    size = os.path.getsize(path)
    if size <= 0:
        logger.error(f"❌ バリデーションエラー: ファイルが空です - {path}")
        raise HTTPException(status_code=400, detail="Audio file is empty")
    if size > 25 * 1024 * 1024:
        logger.error(f"❌ バリデーションエラー: ファイルサイズが大きすぎます - {path}, {size} bytes")
        raise HTTPException(status_code=413, detail="Audio file too large")

    ext = os.path.splitext(path)[1].lower().lstrip(".")
    if ext and ext not in ALLOWED_EXT:
        logger.error(f"❌ バリデーションエラー: サポートされていない音声形式 - {ext}")
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: .{ext}")

    if language not in ALLOWED_LANG:
        logger.error(f"❌ バリデーションエラー: サポートされていない言語 - {language}")
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")
    
    logger.info(f"✅ バリデーション完了: {path}, サイズ: {size} bytes, 形式: {ext}, 言語: {language}")


# --- WhisperService をプロセス内シングルトンで使い回す -------------------
_whisper_service: Optional[WhisperService] = None
def get_whisper_service() -> WhisperService:
    global _whisper_service
    if _whisper_service is None:
        logger.info(" WhisperService: 初期化開始 (singleton)")
        _whisper_service = WhisperService()
        logger.info("✅ WhisperService: 初期化完了")
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
    logger.info("🔍 ヘルスチェック開始")
    logger.debug("health_check: ok")
    logger.info("✅ ヘルスチェック完了")
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

    # 入口ログ（パスの"種類"だけ出す）
    p = request.audio_file_path
    path_kind = (
        "local" if (os.path.isabs(p) and os.path.exists(p))
        else "s3uri" if p.startswith("s3://")
        else "http" if p.startswith(("http://", "https://"))
        else "s3key"
    )
    logger.info(
        f" 音声認識開始: パス種類={path_kind}, 言語={request.language}, ファイル={p}"
    )

    t0 = time.monotonic()
    try:
        # 1) ローカル絶対パス
        if path_kind == "local":
            local_path = p
            logger.info(f"📁 ローカルパスを使用: {local_path}")

        # 2) s3://bucket/key
        elif path_kind == "s3uri":
            rest = p.replace("s3://", "", 1)
            bucket, key = rest.split("/", 1)
            suffix = os.path.splitext(key)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            logger.info(f" S3ダウンロード開始: bucket={bucket}, key={key}, tmp={tmp_path}")
            s3.download_file(s3_key=key, local_file_path=tmp_path, bucket_name=bucket)
            size = os.path.getsize(tmp_path)
            logger.info(f"✅ S3ダウンロード完了: {tmp_path}, サイズ: {size} bytes")
            local_path = tmp_path

        # 3) S3キー（例: 'audio/<uuid>/xxx.ext'）
        elif path_kind == "s3key":
            suffix = os.path.splitext(p)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            logger.info(f" S3ダウンロード開始: bucket={s3.bucket_name}, key={p}, tmp={tmp_path}")
            try:
                s3.download_file(s3_key=p, local_file_path=tmp_path, bucket_name=s3.bucket_name)
                logger.info(f"✅ S3ダウンロード完了: {tmp_path}")
            except Exception as e:
                logger.error(f"❌ S3ダウンロードエラー: {e}")
                logger.exception("s3 download: error")
                raise HTTPException(status_code=500, detail=f"S3ダウンロードエラー: {str(e)}")
            
            if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
                logger.error(f"❌ S3からのファイルダウンロードに失敗しました: {tmp_path}")
                raise HTTPException(status_code=400, detail="S3からのファイルダウンロードに失敗しました")
            
            size = os.path.getsize(tmp_path)
            logger.info(f"✅ S3ダウンロード完了: {tmp_path}, サイズ: {size} bytes")
            local_path = tmp_path

        # 4) http(s) 未対応
        else:
            logger.warning(f"⚠️ HTTP(S)は未対応: {p}")
            raise HTTPException(status_code=400, detail="HTTP(S)の音声URLは未対応です。S3キーか s3:// を渡してください。")

        # 事前バリデーション
        logger.info(f"🔍 ファイルバリデーション開始: {local_path}")
        _validate_local_audio_file(local_path, request.language)

        # Whisper は同期API → スレッドで実行
        t1 = time.monotonic()
        logger.info(f"🤖 Whisper処理開始: {local_path}")
        result = await anyio.to_thread.run_sync(
            lambda: whisper.transcribe_audio(
                local_path,
                language=request.language or "ja",
            )
        )
        t2 = time.monotonic()
        whisper_time = round(t2 - t1, 2)
        text_length = len(result.get("text", ""))
        detected_lang = result.get("language")
        logger.info(
            f"✅ Whisper処理完了: 処理時間={whisper_time}秒, 文字数={text_length}, 検出言語={detected_lang}"
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
        total_time = round(time.monotonic() - t0, 2)
        logger.info(f"🎉 音声認識完了: 総処理時間={total_time}秒, 文字数={text_length}")
        return resp

    except HTTPException:
        logger.error(f"❌ HTTPException発生: 音声認識失敗")
        raise
    except Exception as e:
        logger.error(f"❌ 予期しないエラー: {type(e).__name__}: {e}")
        logger.exception("transcribe: failed")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {type(e).__name__}: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
                logger.debug(f"🧹 一時ファイル削除完了: {tmp_path}")
            except Exception:
                logger.warning(f"⚠️ 一時ファイル削除失敗: {tmp_path}")


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
        unique_id = str(uuid.uuid4())[:8]
        logger.info(
            f" Presigned URL生成開始: user_id={request.user_id}, file_type={request.file_type}, file_format={request.file_format}"
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
            logger.info(f" 音声ファイル設定: 拡張子={ext}, Content-Type={content_type}")

        elif request.file_type == "text":
            ext, content_type = "txt", "text/plain"
            file_path = f"text/{request.user_id}/transcript_{timestamp}_{unique_id}.{ext}"
            logger.info(f"📝 テキストファイル設定: 拡張子={ext}, Content-Type={content_type}")

        else:
            logger.warning(f"❌ 無効なfile_type: {request.file_type}")
            raise HTTPException(status_code=400, detail="Invalid file type")

        logger.info(f" S3 Presigned URL生成中: {file_path}")
        presigned_url = s3.generate_presigned_upload_url(file_path, content_type)
        if not presigned_url:
            logger.error(f"❌ Presigned URL生成失敗: {file_path}")
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")

        # URL本体はログに出さない（秘匿）→長さのみ
        url_length = len(presigned_url)
        processing_time = round(time.monotonic() - t0, 2)
        logger.info(
            f"✅ Presigned URL生成完了: key={file_path}, content_type={content_type}, url_length={url_length}, 処理時間={processing_time}秒"
        )
        return {
            "success": True,
            "upload_url": presigned_url,
            "file_path": file_path,
            "s3_url": s3.get_file_url(file_path),
            "content_type": content_type,
        }

    except HTTPException:
        logger.error(f"❌ HTTPException発生: Presigned URL生成失敗")
        raise
    except Exception as e:
        logger.error(f"❌ 予期しないエラー: {type(e).__name__}: {e}")
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
        # "s3://<bucket>/..." や "https://..." が来た場合も key に正規化して保存
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
            f"💾 記録保存開始: user_id={request.user_id}, audio_key={bool(audio_key)}, text_key={bool(text_key)}"
        )

        # 感情データのフィールドを追加
        if not request.emotion_card_id or not request.intensity_id or not request.child_id:
            raise HTTPException(
                status_code=400, 
                detail="emotion_card_id, intensity_id, and child_id are required"
            )
        
        voice_record = EmotionLog(
            user_id=request.user_id,
            audio_file_path=audio_key,
            text_file_path=text_key,
            # 感情データのフィールドを追加
            emotion_card_id=uuid.UUID(request.emotion_card_id),
            intensity_id=convert_intensity_level(request.intensity_id),
            child_id=uuid.UUID(request.child_id),
        )

        logger.info(f" EmotionLog作成: id={voice_record.id}")
        db.add(voice_record)
        await db.commit()
        await db.refresh(voice_record)
        logger.info(f"✅ データベース保存完了: record_id={voice_record.id}")

        processing_time = round(time.monotonic() - t0, 2)
        logger.info(f"🎉 記録保存完了: record_id={voice_record.id}, 処理時間={processing_time}秒")
        return {
            "success": True,
            "record_id": voice_record.id,
            "message": "Record saved successfully",
        }

    except Exception as e:
        logger.error(f"❌ 記録保存エラー: {type(e).__name__}: {e}")
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
        logger.info(f"📋 記録一覧取得開始: user_id={user_id}")
        query = (
            select(EmotionLog)
            .where(EmotionLog.user_id == user_id)
            .order_by(EmotionLog.id.desc())
        )
        result = await db.execute(query)
        records = result.scalars().all()
        record_count = len(records)
        logger.info(f"📊 データベースから記録取得完了: {record_count}件")

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
        processing_time = round(time.monotonic() - t0, 2)
        logger.info(f"✅ 記録一覧取得完了: {record_count}件, 処理時間={processing_time}秒")
        return payload

    except Exception as e:
        logger.error(f"❌ 記録一覧取得エラー: {type(e).__name__}: {e}")
        logger.exception("records: failed")
        raise HTTPException(status_code=500, detail=str(e))