from datetime import datetime, timezone  # timezoneを追加
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import anyio
from app.schemas.voice import VoiceTranscribeRequest, VoiceTranscribeResponse
from app.services.whisper import WhisperService

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
            processed_at = datetime.now(timezone.utc),
        )

    except HTTPException:
        raise  # 既に適切なHTTP例外ならそのまま
    except Exception as e:
        # TODO: ロガーで記録（例: logger.exception("Transcribe failed")）
        raise HTTPException(status_code=500, detail="Transcription failed")
