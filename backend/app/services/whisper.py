import os
import logging
from typing import Dict, Any, Optional, List

import whisper

# S3 は将来の拡張で使う想定（既存の構成に合わせて残しています）
from app.services.s3 import S3Service, S3UploadError  # noqa: F401

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------
# デフォルト設定（環境変数で上書き可能）
# ---------------------------------------------------------------------
_DEFAULTS = {
    "model_name": os.getenv("WHISPER_MODEL_SIZE", "small"),   # 既定: small（base より日本語が安定しやすい）
    "language": os.getenv("WHISPER_LANGUAGE", "ja"),
    "temperature": float(os.getenv("WHISPER_TEMPERATURE", "0.0")),
    "best_of": int(os.getenv("WHISPER_BEST_OF", "5")),
    "condition_on_previous_text": os.getenv("WHISPER_COND_PREV", "false").lower() == "true",
    "no_speech_threshold": float(os.getenv("WHISPER_NO_SPEECH_TH", "0.4")),
    "compression_ratio_threshold": float(os.getenv("WHISPER_COMP_RATIO_TH", "2.4")),
    "logprob_threshold": float(os.getenv("WHISPER_LOGPROB_TH", "-1.0")),
}

_SUPPORTED_LANGUAGES: List[str] = ["ja", "en"]  # 必要なら拡張可


class WhisperService:
    """
    Whisper モデルのラッパー。
    - モデルを1度ロードしてキャッシュ
    - transcribe_audio() にて initial_prompt など任意指定可能
    - CPU実行時は自動で fp16 を無効化
    """

    def __init__(self) -> None:
        self.model_name = _DEFAULTS["model_name"]
        logger.info(f"Whisperモデル読み込み開始: {self.model_name}")
        try:
            # whisper.load_model は内部でデバイスを自動選択（CUDA あればGPU）
            self.model = whisper.load_model(self.model_name)
            # 実際の実行デバイスをログに出す
            try:
                import torch  # type: ignore
                device = "cuda" if torch.cuda.is_available() else "cpu"
            except Exception:
                device = "cpu"
            logger.info(f"Whisperモデル読み込み完了: {self.model_name}（device={device}）")
        except Exception as e:
            logger.error(f"Whisperモデル読み込みエラー: {e}")
            raise WhisperModelLoadError(f"Whisperモデルの読み込みに失敗しました: {e}")

        # S3 サービス（必要に応じて利用）
        self.s3_service = S3Service()

    # ---------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------
    def transcribe_audio(
        self,
        audio_file_path: str,
        *,
        # よく使うパラメータ（呼び出し側から上書き可）
        initial_prompt: Optional[str] = None,
        language: str = _DEFAULTS["language"],
        model_name: Optional[str] = None,              # その呼び出しだけモデルを切り替えたい場合
        temperature: float = _DEFAULTS["temperature"],
        best_of: int = _DEFAULTS["best_of"],
        condition_on_previous_text: bool = _DEFAULTS["condition_on_previous_text"],
        no_speech_threshold: float = _DEFAULTS["no_speech_threshold"],
        compression_ratio_threshold: float = _DEFAULTS["compression_ratio_threshold"],
        logprob_threshold: float = _DEFAULTS["logprob_threshold"],
    ) -> Dict[str, Any]:
        """
        音声ファイルを文字起こしして辞書を返します。
        戻り値の主キー: success, text, language, file_path, segments, duration

        呼び出し例（推奨）:
            result = whisper_service.transcribe_audio(
                "/tmp/normalized.wav",
                initial_prompt=load_base_prompt(),  # 任意
                language="ja",
            )
        """
        # 言語バリデーション（厳密さが不要ならこのチェックは外してもOK）
        if language not in self.get_supported_languages():
            raise WhisperLanguageError(
                f"サポートされていない言語です: {language}. "
                f"サポート言語: {self.get_supported_languages()}"
            )

        # 必要に応じて一時的にモデル差し替え
        model_to_use = self._get_model(model_name) if model_name else self.model

        # CPU では fp16 を無効化して警告を抑制
        fp16 = False
        try:
            import torch  # type: ignore
            if torch.cuda.is_available():
                fp16 = True
        except Exception:
            fp16 = False

        try:
            logger.info(
                "音声認識開始: %s (lang=%s, temp=%.2f, best_of=%d, cond_prev=%s, fp16=%s)",
                audio_file_path, language, temperature, best_of, condition_on_previous_text, fp16
            )
            result = model_to_use.transcribe(
                audio_file_path,
                language=language,
                temperature=temperature,
                best_of=best_of,
                condition_on_previous_text=condition_on_previous_text,
                initial_prompt=initial_prompt,
                no_speech_threshold=no_speech_threshold,
                compression_ratio_threshold=compression_ratio_threshold,
                logprob_threshold=logprob_threshold,
                fp16=fp16,
            )
            # duration が result に無い場合は segments から算出
            duration = result.get("duration")
            if duration is None:
                segments = result.get("segments") or []
                duration = max((s.get("end", 0.0) for s in segments), default=0.0)

            logger.info("音声認識完了: %s", audio_file_path)
            return {
                "success": True,
                "text": result.get("text", ""),
                "language": result.get("language", language),
                "file_path": audio_file_path,
                "segments": result.get("segments", []),
                "duration": duration,
            }

        except Exception as e:
            logger.error(f"音声認識エラー: {e}")
            raise WhisperTranscriptionError(f"音声認識に失敗しました: {e}")

    def get_supported_languages(self) -> List[str]:
        """サポートしている言語コードの簡易リスト"""
        return list(_SUPPORTED_LANGUAGES)

    def get_model_info(self) -> Dict[str, Any]:
        """ロード中のモデル情報"""
        return {
            "model_size": getattr(self.model, "name", self.model_name),
            "multilingual": True,
            "supported_languages": self.get_supported_languages(),
        }

    # ---------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------
    def _get_model(self, model_name: str):
        """
        呼び出し時だけ別サイズを使いたい場合にロードして返す。
        通常は __init__ でロードした self.model を使うので不要。
        """
        if not model_name or model_name == self.model_name:
            return self.model
        logger.info(f"別モデル読み込み: {model_name}")
        try:
            return whisper.load_model(model_name)
        except Exception as e:
            logger.error(f"別モデル読み込み失敗: {e}（fallback: {self.model_name}）")
            return self.model


# ---------------------------------------------------------------------
# 例外クラス（既存の実装互換）
# ---------------------------------------------------------------------
class WhisperTranscriptionError(Exception):
    def __init__(self, message: str, error_code: str = "WHISPER_TRANSCRIPTION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class WhisperModelLoadError(Exception):
    def __init__(self, message: str, error_code: str = "WHISPER_MODEL_LOAD_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class WhisperLanguageError(Exception):
    def __init__(self, message: str, error_code: str = "WHISPER_LANGUAGE_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)
