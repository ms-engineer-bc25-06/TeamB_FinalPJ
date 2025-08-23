from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
from uuid import UUID
import os
import tempfile
import time
import logging
import hashlib

import anyio
from fastapi import APIRouter, Depends, HTTPException
import sqlalchemy as sa
from sqlalchemy import select, text
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

# -------------------------------------------------
# Router / Logger
# -------------------------------------------------
router = APIRouter(prefix="/voice", tags=["voice"])

logger = logging.getLogger(__name__)

# -------------------------------------------------
# Helpers (JST / UUID / intensity / lock key)
# -------------------------------------------------
JST = timezone(timedelta(hours=9))

def _to_uuid(v) -> UUID:
    if isinstance(v, UUID):
        return v
    try:
        return UUID(str(v))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid UUID")

def _to_intensity_id(v) -> int:
    """
    'low'|'medium'|'high' or 1|2|3 を受け付ける。
    不正値は 2 (medium) にフォールバック。
    """
    mapping = {"low": 1, "medium": 2, "high": 3}
    if isinstance(v, str):
        s = v.strip().lower()
        if s in mapping:
            return mapping[s]
        if s.isdigit() and int(s) in (1, 2, 3):
            return int(s)
        return 2
    if isinstance(v, int) and v in (1, 2, 3):
        return v
    return 2

def _today_jst_date():
    return datetime.now(JST).date()  # YYYY-MM-DD (JST)

def _stable_lock_key(user_id: UUID, child_id: UUID, jst_date) -> int:
    """
    pg_advisory_xact_lock は bigint を受け取る。
    Pythonのhashはプロセスで変わるため、SHA-1の下位63bitで安定キー生成。
    """
    seed = f"{user_id}:{child_id}:{jst_date.isoformat()}".encode("utf-8")
    h = hashlib.sha1(seed).digest()
    n = int.from_bytes(h[-8:], "big") & 0x7FFFFFFFFFFFFFFF  # 符号なし63bit
    return n

# -------------------------------------------------
# Validation for local audio
# -------------------------------------------------
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

# -------------------------------------------------
# Whisper singleton
# -------------------------------------------------
_whisper_service: Optional[WhisperService] = None
def get_whisper_service() -> WhisperService:
    global _whisper_service
    if _whisper_service is None:
        logger.info(" WhisperService: 初期化開始 (singleton)")
        _whisper_service = WhisperService()
        logger.info(" WhisperService: 初期化完了")
    return _whisper_service

# -------------------------------------------------
# Health
# -------------------------------------------------
@router.get("/health", summary="音声APIヘルスチェック", description="音声APIの稼働状態を確認")
async def health_check():
    logger.info("🔍 ヘルスチェック開始")
    logger.info("✅ ヘルスチェック完了")
    return {"status": "healthy", "service": "voice-api"}

# -------------------------------------------------
# Transcribe
# -------------------------------------------------
@router.post(
    "/transcribe",
    response_model=VoiceTranscribeResponse,
    summary="音声認識実行",
    description=(
        "S3に置いた音声ファイルをWhisperで文字起こし\n"
        "- `audio_file_path`: S3キー（例: `audio/<uuid>/xxx.webm`）\n"
        "- HTTP(S)直URLは未対応"
    ),
)
async def transcribe_voice(
    request: VoiceTranscribeRequest,
    whisper: WhisperService = Depends(get_whisper_service),
) -> VoiceTranscribeResponse:
    s3 = S3Service()
    tmp_path: Optional[str] = None

    p = request.audio_file_path
    path_kind = (
        "local" if (os.path.isabs(p) and os.path.exists(p))
        else "http" if p.startswith(("http://", "https://"))
        else "s3key"
    )
    logger.info(f" 音声認識開始: 種類={path_kind}, 言語={request.language}, ファイル={p}")

    t0 = time.monotonic()
    try:
        if path_kind == "local":
            local_path = p

        elif path_kind == "s3key":
            suffix = os.path.splitext(p)[1] or ".wav"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            logger.info(f" S3ダウンロード: bucket={s3.bucket_name}, key={p}, tmp={tmp_path}")
            try:
                s3.download_file(s3_key=p, local_file_path=tmp_path, bucket_name=s3.bucket_name)
            except Exception as e:
                logger.exception("s3 download: error")
                raise HTTPException(status_code=500, detail=f"S3ダウンロードエラー: {str(e)}")
            if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
                raise HTTPException(status_code=400, detail="S3からのファイルダウンロードに失敗しました")
            local_path = tmp_path
        else:
            raise HTTPException(status_code=400, detail="HTTP(S)の音声URLは未対応です。S3キーを渡してください。")

        _validate_local_audio_file(local_path, request.language)

        t1 = time.monotonic()
        result = await anyio.to_thread.run_sync(
            lambda: whisper.transcribe_audio(local_path, language=request.language or "ja")
        )
        t2 = time.monotonic()

        resp = VoiceTranscribeResponse(
            success=True,
            transcription_id=0,
            text=result.get("text", ""),
            confidence=float(result.get("confidence", 0.0)) if isinstance(result.get("confidence", 0.0), (int, float)) else 0.0,
            language=result.get("language", request.language or "ja"),
            duration=float(result.get("duration", 0.0)),
            processed_at=datetime.now(timezone.utc),
        )
        logger.info(f"✅ Whisper完了: {round(t2 - t1, 2)}秒 / 総処理 {round(time.monotonic()-t0,2)}秒")
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
            except Exception:
                logger.warning(f"⚠️ 一時ファイル削除失敗: {tmp_path}")

# -------------------------------------------------
# Presign
# -------------------------------------------------
@router.post(
    "/get-upload-url",
    summary="アップロード用Presigned URL取得",
    description=(
        "S3に直接アップロードするための署名付きPUT URLを発行\n"
        "- `file_type`: 'audio' | 'text'\n"
        "- `file_format`: 例 'webm' | 'wav' | 'mp3' | 'm4a' | 'txt'\n"
        "- `file_path` はDBに保存するべき **S3のキー**"
    ),
)
async def get_upload_url(request: VoiceUploadRequest, db: AsyncSession = Depends(get_db)):
    s3 = S3Service()
    t0 = time.monotonic()
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
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
            raise HTTPException(status_code=400, detail="Invalid file type")

        presigned_url = s3.generate_presigned_upload_url(file_path, content_type)
        if not presigned_url:
            raise HTTPException(status_code=500, detail="Failed to generate upload URL")

        processing_time = round(time.monotonic() - t0, 2)
        logger.info(f"✅ Presigned URL: key={file_path}, type={content_type}, 処理={processing_time}秒")
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

# -------------------------------------------------
# SAVE (Advisory lock: DELETE → INSERT)
# -------------------------------------------------
@router.post(
    "/save-record",
    summary="その日の記録を置き換え保存（アドバイザリロックで直列化、マイグレ不要）",
    description="(user_id, child_id, JST日付) 単位で排他。既存があれば削除→新規1件を挿入。",
)
async def save_record(request: VoiceSaveRequest, db: AsyncSession = Depends(get_db)):
    s3 = S3Service()
    t0 = time.monotonic()

    # S3キー正規化
    def to_key(p: Optional[str]) -> Optional[str]:
        if not p:
            return None
        if p.startswith(("http://", "https://")):
            from urllib.parse import urlparse, unquote
            u = urlparse(p)
            path = unquote(u.path.lstrip("/"))
            if path.startswith(f"{s3.bucket_name}/"):
                return path[len(s3.bucket_name) + 1 :]
            return path
        return p

    try:
        # 必須
        if not (request.user_id and request.child_id and request.emotion_card_id and request.intensity_id):
            raise HTTPException(status_code=400, detail="user_id, child_id, emotion_card_id, intensity_id は必須です。")

        user_id = _to_uuid(request.user_id)
        child_id = _to_uuid(request.child_id)
        emotion_card_id = _to_uuid(request.emotion_card_id)
        intensity_id = _to_intensity_id(request.intensity_id)

        audio_key = to_key(request.audio_file_path)
        text_key  = to_key(request.text_file_path)

        jst_date = _today_jst_date()
        lock_k = _stable_lock_key(user_id, child_id, jst_date)

        # 古いS3の孤児掃除用に一時保管
        old_audio_keys: list[str] = []
        old_text_keys: list[str]  = []

        async with db.begin():
            # 同日同ユーザー×子どもで直列化
            await db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": lock_k})

            # 当日(JST)の既存行を削除しつつ、古いキーを回収
            res_del = await db.execute(
                sa.text("""
                    DELETE FROM emotion_logs
                    WHERE user_id = :uid
                      AND child_id = :cid
                      AND DATE(created_at AT TIME ZONE 'Asia/Tokyo') = :d
                    RETURNING audio_file_path, text_file_path
                """),
                {"uid": user_id, "cid": child_id, "d": jst_date}
            )
            for a, t in res_del.fetchall():
                if a: old_audio_keys.append(a)
                if t: old_text_keys.append(t)

            # 新規1件を挿入
            insert_sql = sa.text("""
                INSERT INTO emotion_logs
                    (id, user_id, child_id, emotion_card_id, intensity_id,
                     voice_note, text_file_path, audio_file_path,
                     created_at, updated_at)
                VALUES
                    (:id, :uid, :cid, :eid, :iid,
                     :note, :textp, :audiop,
                     now(), now())
                RETURNING id
            """)
            new_id = uuid.uuid4()
            res = await db.execute(insert_sql, {
                "id": new_id,
                "uid": user_id,
                "cid": child_id,
                "eid": emotion_card_id,
                "iid": int(intensity_id),
                "note": None,         # voice_note 使うなら適宜
                "textp": text_key,
                "audiop": audio_key,
            })
            record_id = res.scalar_one()

        # Tx後に古いS3を削除（DBは確定済み。失敗は警告ログに留める）
        for key in [*old_audio_keys, *old_text_keys]:
            try:
                if key:
                    s3.delete_object(key)
            except Exception as e:
                logger.warning(f"[S3] old object delete failed: key={key} err={e}")

        processing_time = round(time.monotonic() - t0, 2)
        logger.info(f"✅ 置き換え保存完了 (locked): record_id={record_id}, jst_date={jst_date}, 処理時間={processing_time}秒")
        return {
            "success": True,
            "record_id": str(record_id),
            "message": "Record saved (replaced) successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("save-record advisory-lock replace: failed")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------------------------
# Records list
# -------------------------------------------------
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
        logger.info(f"📊 取得完了: {record_count}件")

        def to_key(p: Optional[str]) -> Optional[str]:
            if not p:
                return None
            if isinstance(p, str) and p.startswith(("http://", "https://")):
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
        logger.info(f"✅ 一覧取得完了: {record_count}件, 処理時間={processing_time}秒")
        return payload

    except Exception as e:
        logger.exception("records: failed")
        raise HTTPException(status_code=500, detail=str(e))