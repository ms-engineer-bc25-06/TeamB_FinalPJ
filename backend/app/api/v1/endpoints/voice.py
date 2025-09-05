# 標準ライブラリ
from datetime import datetime, timezone, timedelta
from typing import Optional
import uuid
from uuid import UUID
import os
import time
import logging
import hashlib

# 外部ライブラリ
from fastapi import APIRouter, Depends, HTTPException
import sqlalchemy as sa
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

# プロジェクト内のモジュール
from app.schemas import (
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    VoiceUploadRequest,
    VoiceSaveRequest,
)
from app.services.whisper import WhisperService
from app.config.database import get_db
from app.models import EmotionLog
from app.services.voice.file_ops import VoiceFileService
from app.utils.constants import (
    INTENSITY_MAPPING,
    ERROR_MESSAGES,
)

# -------------------------------------------------
# Router / Logger
# -------------------------------------------------
router = APIRouter(prefix="/voice", tags=["voice"])

logger = logging.getLogger(__name__)

# -------------------------------------------------
# Helpers (JST / UUID / intensity / lock key)
# -------------------------------------------------
JST = timezone(timedelta(hours=9))


# TODO: 単体テストと統合テストの追加
def _to_uuid(v) -> UUID:
    """
    文字列をID（UUID）に変換する関数

    説明：
    - データベースで使うIDは特別な形式（UUID）が必要
    - 文字列で送られてきたIDを正しい形式に変換する
    - 変換できない場合はエラーを返す

    Args:
        v: 変換したい文字列やID

    Returns:
        UUID: 正しい形式のID

    Raises:
        HTTPException: 変換に失敗した場合
    """
    if isinstance(v, UUID):
        return v
    try:
        return UUID(str(v))
    except Exception:
        raise HTTPException(status_code=400, detail=ERROR_MESSAGES["INVALID_UUID"])


def _to_intensity_id(v) -> int:
    """
    感情の強さを数字に変換する関数

    説明：
    - 感情の強さを「低い」「普通」「高い」で表す
    - これを数字（1, 2, 3）に変換してデータベースに保存
    - 間違った値が来た場合は「普通」（2）にする

    例：
    - "low" → 1
    - "medium" → 2
    - "high" → 3
    - 間違い → 2（普通）
    """
    if isinstance(v, str):
        s = v.strip().lower()
        if s in INTENSITY_MAPPING:
            return INTENSITY_MAPPING[s]
        if s.isdigit() and int(s) in (1, 2, 3):
            return int(s)
        return INTENSITY_MAPPING["medium"]
    if isinstance(v, int) and v in (1, 2, 3):
        return v
    return INTENSITY_MAPPING["medium"]


def _today_jst_date():
    """
    今日の日付を取得する関数

    説明：
    - 日本の時間（JST）で今日の日付を取得
    - データベースに保存する時に日付が必要
    - 例：2024-01-15 のような形式

    Returns:
        date: 今日の日付（例：2024-01-15）
    """
    return datetime.now(JST).date()  # YYYY-MM-DD (JST)


def _stable_lock_key(user_id: UUID, child_id: UUID, jst_date) -> int:
    """
    データベースの重複防止用のキーを作る関数

    説明：
    - 同じ日に同じ人が同じ子の記録を複数作らないようにする
    - ユーザーID、子ID、日付を組み合わせて特別なキーを作る
    - このキーでデータベースをロックして、同時に複数の記録が作られないようにする

    例：
    - ユーザーA、子B、2024-01-15 → 特別な数字（例：123456789）
    - この数字でロックして、同時に記録を作るのを防ぐ
    """
    seed = f"{user_id}:{child_id}:{jst_date.isoformat()}".encode("utf-8")
    h = hashlib.sha1(seed).digest()
    n = int.from_bytes(h[-8:], "big") & 0x7FFFFFFFFFFFFFFF  # 符号なし63bit
    return n


# -------------------------------------------------
# Helper functions
# -------------------------------------------------


# -------------------------------------------------
# Service dependencies
# -------------------------------------------------

# 音声認識サービス（Whisper）を1回だけ読み込んで使い回す
# 説明：毎回読み込むと時間がかかるので、1回だけ読み込んで保存しておく
# TODO: シングルトンパターンの改善 - スレッドセーフな実装を検討
_whisper_service_instance: Optional[WhisperService] = None


def get_whisper_service() -> WhisperService:
    """
    音声認識サービスを取得する関数

    説明：
    - 初回だけ音声認識の準備をする（時間がかかる）
    - 2回目以降は準備済みのものを使い回す（早い）
    - これで音声認識が速くなる

    Returns:
        WhisperService: 音声認識サービス
    """
    global _whisper_service_instance
    if _whisper_service_instance is None:
        logger.info("WhisperServiceの初期化開始（初回のみ）")
        _whisper_service_instance = WhisperService()
        logger.info("WhisperServiceの初期化完了（シングルトン）")
    return _whisper_service_instance


def get_file_service() -> VoiceFileService:
    return VoiceFileService()


# -------------------------------------------------
# Health
# -------------------------------------------------
@router.get(
    "/health", summary="音声APIヘルスチェック", description="音声APIの稼働状態を確認"
)
async def health_check():
    """
    音声APIヘルスチェック

    音声APIの稼働状態を確認する。基本的な応答性をテストする。

    Returns:
        dict: ヘルスチェック結果
    """
    logger.info("Health check started")

    # S3設定の確認
    from app.utils.constants import S3_BUCKET_NAME

    s3_status = "configured" if S3_BUCKET_NAME else "not_configured"

    logger.info(f"Health check completed - S3: {s3_status}")
    return {
        "status": "healthy",
        "service": "voice-api",
        "s3_bucket": S3_BUCKET_NAME,
        "s3_status": s3_status,
    }


# -------------------------------------------------
# Transcribe
# -------------------------------------------------
# TODO: レート制限とリクエスト検証の追加
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
    whisper_service: WhisperService = Depends(get_whisper_service),
) -> VoiceTranscribeResponse:
    """
    音声を文字に変換する機能

    説明：
    - 録音した音声ファイルを文字（テキスト）に変換する
    - AI（Whisper）を使って音声を認識する
    - 例：「こんにちは」という音声 → 「こんにちは」という文字

    Args:
        request: 音声ファイルの情報
        whisper_service: 音声認識サービス

    Returns:
        VoiceTranscribeResponse: 変換された文字とその情報

    Raises:
        HTTPException: 変換に失敗した場合
    """
    # TODO: 構造化ログとメトリクス収集の実装
    logger.info(
        f"音声認識開始: ファイル={request.audio_file_path}, 言語={request.language}"
    )

    try:
        if request.audio_file_path.startswith(("http://", "https://")):
            raise HTTPException(
                status_code=400, detail=ERROR_MESSAGES["HTTP_URL_NOT_SUPPORTED"]
            )

        # S3から音声ファイルをダウンロードして音声認識を実行
        # 説明：S3に保存された音声ファイルを一時的にダウンロードして、AIが音声を聞いて文字に変換する
        result = await whisper_service.transcribe_from_s3(
            s3_key=request.audio_file_path, language=request.language or "ja"
        )

        # 結果を整理して返す
        # 説明：AIが変換した結果を、フロントエンドが使いやすい形に整理する
        resp = VoiceTranscribeResponse(
            success=True,  # 成功したかどうか
            transcription_id=0,  # 変換ID（今は使わない）
            text=result.get("text", "") or "",  # 変換された文字
            confidence=result.get(
                "confidence_score", 0.0
            ),  # 信頼度（どれくらい確実か）
            language=result.get("language", request.language or "ja"),  # 言語
            duration=result.get("duration", 0.0),  # 音声の長さ
            processed_at=datetime.now(timezone.utc),  # 処理した時刻
        )

        logger.info(f"音声認識完了")
        return resp

    except HTTPException:
        raise
    except Exception as e:
        # TODO: より詳細なエラーログとメトリクス収集
        logger.exception("Transcription failed")
        raise HTTPException(
            status_code=500,
            detail=f"{ERROR_MESSAGES['TRANSCRIPTION_FAILED']}: {type(e).__name__}: {e}",
        )


# -------------------------------------------------
# Helper functions for save_record
# -------------------------------------------------
def _normalize_s3_key(
    path: Optional[str], file_service: VoiceFileService
) -> Optional[str]:
    """
    S3キーを正規化する（URLからキーを抽出）

    HTTP(S) URLからS3キーを抽出し、正規化する。
    既にS3キー形式の場合はそのまま返す。

    Args:
        path: S3キーまたはHTTP(S) URL
        file_service: ファイルサービス（バケット名取得用）

    Returns:
        Optional[str]: 正規化されたS3キー、またはNone
    """
    if not path:
        return None
    if path.startswith(("http://", "https://")):
        from urllib.parse import urlparse, unquote

        u = urlparse(path)
        path = unquote(u.path.lstrip("/"))
        if path.startswith(f"{file_service.bucket_name}/"):
            return path[len(file_service.bucket_name) + 1 :]
        return path
    return path


async def _delete_existing_records_and_collect_old_keys(
    db: AsyncSession, user_id: UUID, child_id: UUID, jst_date
) -> tuple[list[str], list[str]]:
    """既存の記録を削除し、古いS3キーを回収する"""
    old_audio_keys: list[str] = []
    old_text_keys: list[str] = []

    res_del = await db.execute(
        sa.text(
            """
            DELETE FROM emotion_logs
            WHERE user_id = :uid
              AND child_id = :cid
              AND DATE(created_at AT TIME ZONE 'Asia/Tokyo') = :d
            RETURNING audio_file_path, text_file_path
        """
        ),
        {"uid": user_id, "cid": child_id, "d": jst_date},
    )
    for a, t in res_del.fetchall():
        if a:
            old_audio_keys.append(a)
        if t:
            old_text_keys.append(t)

    return old_audio_keys, old_text_keys


async def _insert_new_record(
    db: AsyncSession,
    user_id: UUID,
    child_id: UUID,
    emotion_card_id: UUID,
    intensity_id: int,
    voice_note: str,
    text_key: Optional[str],
    audio_key: Optional[str],
) -> UUID:
    """新しい記録を挿入する"""
    insert_sql = sa.text(
        """
        INSERT INTO emotion_logs
            (id, user_id, child_id, emotion_card_id, intensity_id,
             voice_note, text_file_path, audio_file_path,
             created_at, updated_at)
        VALUES
            (:id, :uid, :cid, :eid, :iid,
             :note, :textp, :audiop,
             now(), now())
        RETURNING id
    """
    )
    new_id = uuid.uuid4()

    res = await db.execute(
        insert_sql,
        {
            "id": new_id,
            "uid": user_id,
            "cid": child_id,
            "eid": emotion_card_id,
            "iid": int(intensity_id),
            "note": voice_note,
            "textp": text_key,
            "audiop": audio_key,
        },
    )
    return res.scalar_one()


def _cleanup_old_s3_objects(
    file_service: VoiceFileService, old_audio_keys: list[str], old_text_keys: list[str]
):
    """
    古いS3オブジェクトを削除する

    NOTE: 非同期削除の実装を検討（大量ファイルの場合のパフォーマンス向上）
    """
    for key in [*old_audio_keys, *old_text_keys]:
        try:
            if key:
                file_service.delete_object(key)
        except Exception as e:
            logger.warning(f"[S3] old object delete failed: key={key} err={e}")


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
async def get_upload_url(
    request: VoiceUploadRequest,
    db: AsyncSession = Depends(get_db),
    file_service: VoiceFileService = Depends(get_file_service),
):
    """
    アップロード用Presigned URL取得

    S3に直接アップロードするための署名付きPUT URLを発行する。
    クライアントがサーバーを経由せずにファイルをアップロードできるため、
    パフォーマンスが向上する。

    Args:
        request: アップロードリクエスト
        db: データベースセッション
        file_service: ファイルサービス

    Returns:
        dict: アップロードURL情報

    Raises:
        HTTPException: URL生成に失敗した場合
    """
    logger.info(
        f"アップロードURL生成開始: file_type={request.file_type}, file_format={request.file_format}"
    )

    try:
        # ファイル名を生成（タイムスタンプ付きでユニーク性を保証）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # TODO: 設定値の外部化（Content-Type、ファイル形式など）
        # ファイルタイプ別の拡張子とContent-Typeを設定
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
            file_name = f"audio_{timestamp}.{ext}"
        elif request.file_type == "text":
            ext, content_type = "txt", "text/plain"
            file_name = f"transcript_{timestamp}.{ext}"
        else:
            raise HTTPException(status_code=400, detail="Invalid file type")

        s3_key = file_service.generate_s3_key(
            user_id=str(request.user_id),
            file_name=file_name,
            file_type=request.file_type,
        )

        presigned_url = file_service.generate_presigned_upload_url(s3_key, content_type)

        logger.info(f"アップロードURL生成完了: key={s3_key}, type={content_type}")
        return {
            "success": True,
            "upload_url": presigned_url,
            "file_path": s3_key,
            "s3_url": file_service.get_file_url(s3_key),
            "content_type": content_type,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload URL generation failed")
        raise HTTPException(status_code=500, detail=str(e))


# -------------------------------------------------
# SAVE (Advisory lock: DELETE → INSERT)
# -------------------------------------------------
@router.post(
    "/save-record",
    summary="その日の記録を置き換え保存（アドバイザリロックで直列化、マイグレ不要）",
    description="(user_id, child_id, JST日付) 単位で排他。既存があれば削除→新規1件を挿入。",
)
async def save_record(
    request: VoiceSaveRequest,
    db: AsyncSession = Depends(get_db),
    file_service: VoiceFileService = Depends(get_file_service),
):
    """
    その日の記録を置き換え保存

    アドバイザリロックを使用してトランザクション処理を行い、
    (user_id, child_id, JST日付)単位で排他制御する。
    既存記録があれば削除してから新規1件を挿入する。

    Args:
        request: 保存リクエスト
        db: データベースセッション
        file_service: ファイルサービス

    Returns:
        dict: 保存結果

    Raises:
        HTTPException: 保存に失敗した場合
    """
    logger.debug(
        f"Save record request: user_id={request.user_id}, child_id={request.child_id}, emotion_card_id={request.emotion_card_id}"
    )

    t0 = time.monotonic()

    try:
        # 必須パラメータの検証
        if not (
            request.user_id
            and request.child_id
            and request.emotion_card_id
            and request.intensity_id
        ):
            raise HTTPException(
                status_code=400, detail=ERROR_MESSAGES["REQUIRED_PARAMS_MISSING"]
            )

        # パラメータの正規化
        user_id = _to_uuid(request.user_id)
        child_id = _to_uuid(request.child_id)
        emotion_card_id = _to_uuid(request.emotion_card_id)
        intensity_id = _to_intensity_id(request.intensity_id)

        audio_key = _normalize_s3_key(request.audio_file_path, file_service)
        text_key = _normalize_s3_key(request.text_file_path, file_service)

        jst_date = _today_jst_date()
        lock_k = _stable_lock_key(user_id, child_id, jst_date)

        # NOTE: アドバイザリロックの仕組み説明
        # PostgreSQLのpg_advisory_xact_lockを使用してトランザクション内で排他制御
        # 同日同ユーザー×子どもで直列化し、重複記録を防ぐ
        async with db.begin():
            # 同日同ユーザー×子どもで直列化
            await db.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": lock_k})

            old_audio_keys, old_text_keys = (
                await _delete_existing_records_and_collect_old_keys(
                    db, user_id, child_id, jst_date
                )
            )

            voice_note = request.voice_note if request.voice_note is not None else ""
            record_id = await _insert_new_record(
                db,
                user_id,
                child_id,
                emotion_card_id,
                intensity_id,
                voice_note,
                text_key,
                audio_key,
            )

        _cleanup_old_s3_objects(file_service, old_audio_keys, old_text_keys)

        processing_time = round(time.monotonic() - t0, 2)
        logger.info(
            f"Record saved successfully (locked): record_id={record_id}, jst_date={jst_date}, processing={processing_time}s"
        )
        return {
            "success": True,
            "record_id": str(record_id),
            "message": "Record saved (replaced) successfully",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Save record failed")
        raise HTTPException(
            status_code=500, detail=f"{ERROR_MESSAGES['SAVE_RECORD_FAILED']}: {str(e)}"
        )


# -------------------------------------------------
# Records list
# -------------------------------------------------
@router.get(
    "/records/{user_id}",
    summary="記録一覧取得",
    description="指定ユーザーのS3キーとダウンロード用Presigned URLを返す（URLは都度生成）。",
)
async def get_records(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    file_service: VoiceFileService = Depends(get_file_service),
):
    """
    記録一覧取得

    指定ユーザーの感情ログ記録一覧を取得し、
    S3キーとダウンロード用Presigned URLを返す。
    URLは都度生成されるため、セキュリティが保たれる。

    Args:
        user_id: ユーザーID
        db: データベースセッション
        file_service: ファイルサービス

    Returns:
        dict: 記録一覧とメタデータ

    Raises:
        HTTPException: 取得に失敗した場合
    """
    logger.info(f"記録一覧取得開始: user_id={user_id}")

    try:
        # TODO: インデックス最適化とクエリパフォーマンス改善
        # データベースから記録を取得
        query = (
            select(EmotionLog)
            .where(EmotionLog.user_id == user_id)
            .order_by(EmotionLog.id.desc())
        )
        result = await db.execute(query)
        records = result.scalars().all()
        record_count = len(records)
        logger.info(f"記録取得完了: {record_count}件")

        def to_key(p: Optional[str]) -> Optional[str]:
            """
            S3キーを正規化

            データベースに保存されているパスをS3キー形式に正規化する。
            HTTP(S) URLの場合はS3キー部分を抽出する。
            """
            if not p:
                return None
            if isinstance(p, str) and p.startswith(("http://", "https://")):
                from urllib.parse import urlparse, unquote

                u = urlparse(p)
                path = unquote(u.path.lstrip("/"))
                if path.startswith(f"{file_service.bucket_name}/"):
                    return path[len(file_service.bucket_name) + 1 :]
                return path
            return p

        # 記録一覧を構築
        records_list = []
        for r in records:
            audio_key = to_key(r.audio_file_path)
            text_key = to_key(r.text_file_path)

            record_data = {
                "id": r.id,
                "audio_path": audio_key,
                "text_path": text_key,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "emotion_card_id": r.emotion_card_id,
                "intensity_id": r.intensity_id,
                "voice_note": r.voice_note,
            }

            if audio_key:
                try:
                    record_data["audio_download_url"] = (
                        file_service.generate_download_url(audio_key)
                    )
                except Exception as e:
                    logger.warning(
                        f"音声ダウンロードURL生成失敗: {audio_key}, エラー: {e}"
                    )
                    record_data["audio_download_url"] = None

            if text_key:
                try:
                    record_data["text_download_url"] = (
                        file_service.generate_download_url(text_key)
                    )
                except Exception as e:
                    logger.warning(
                        f"テキストダウンロードURL生成失敗: {text_key}, エラー: {e}"
                    )
                    record_data["text_download_url"] = None

            records_list.append(record_data)

        payload = {
            "success": True,
            "records": records_list,
            "total_count": record_count,
        }

        logger.info(f"記録一覧取得完了: {record_count}件")
        return payload

    except Exception as e:
        logger.exception("Records fetch failed")
        raise HTTPException(
            status_code=500,
            detail=f"{ERROR_MESSAGES['RECORDS_FETCH_FAILED']}: {str(e)}",
        )
