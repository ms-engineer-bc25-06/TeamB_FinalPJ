import os
import logging
from typing import Dict, Any, Optional, List, Tuple
import tempfile
import subprocess
import shlex
import whisper

# 既存のimportに追加
from app.utils.child_vocabulary import generate_whisper_prompt, generate_situation_prompt

logger = logging.getLogger(__name__)

_DEFAULTS = {
    "model_name": os.getenv("WHISPER_MODEL_SIZE", "base"),
    "language": os.getenv("WHISPER_LANGUAGE", "ja"),
    "temperature": float(os.getenv("WHISPER_TEMPERATURE", "0.0")),
    "beam_size": int(os.getenv("WHISPER_BEAM_SIZE", "1")),
    "best_of": int(os.getenv("WHISPER_BEST_OF", "1")),
    "condition_on_previous_text": os.getenv("WHISPER_COND_PREV", "false").lower() == "true",
    "no_speech_threshold": float(os.getenv("WHISPER_NO_SPEECH_TH", "0.6")),
    "compression_ratio_threshold": float(os.getenv("WHISPER_COMP_RATIO_TH", "3.5")),
    "logprob_threshold": float(os.getenv("WHISPER_LOGPROB_TH", "-1.2")),
}

_SUPPORTED_LANGUAGES: List[str] = ["ja", "en"]

# DEFAULT_INITIAL_PROMPT_JAの部分を更新
DEFAULT_INITIAL_PROMPT_JA = os.getenv(
    "WHISPER_INITIAL_PROMPT_JA",
    generate_whisper_prompt()  # 動的に生成
)

class WhisperService:
    def __init__(self) -> None:
        self.model_name = _DEFAULTS["model_name"]
        logger.info(f"Whisperモデル読み込み開始: {self.model_name}")
        try:
            self.model = whisper.load_model(self.model_name)
            # CPU環境用の設定
            device = "cpu"
            logger.info(f"Whisperモデル読み込み完了: {self.model_name}（device={device}）")
        except Exception as e:
            logger.error(f"Whisperモデル読み込みエラー: {e}")
            raise WhisperModelLoadError(f"Whisperモデルの読み込みに失敗しました: {e}")

    # --- 前処理: 16kHz mono + 高速モード対応 ---
    def _preprocess_audio(self, src_path: str) -> str:
        # FFmpeg最適化が有効な場合のみ前処理を実行
        if os.getenv("ENABLE_AUDIO_OPTIMIZATION", "false").lower() == "true":
            from app.services.audio_optimizer import AudioOptimizer
            optimizer = AudioOptimizer()
            optimized_path = optimizer.optimize_for_whisper(src_path)
            if optimized_path:
                logger.info("FFmpeg最適化を適用")
                return optimized_path
        
        logger.info("前処理をスキップ")
        return src_path

    def _compute_avg_logprob(self, result: Dict[str, Any]) -> Optional[float]:
        segs = result.get("segments") or []
        vals = [s.get("avg_logprob") for s in segs if isinstance(s.get("avg_logprob"), (int, float))]
        if not vals:
            return None
        return float(sum(vals) / len(vals))

    def _transcribe_once(
        self,
        model,
        audio_path: str,
        **kwargs
    ) -> Dict[str, Any]:
        """1回の音声認識実行（最速設定）"""
        try:
            # 最速設定で実行
            result = model.transcribe(
                audio_path,
                **kwargs,
                # 最速設定
                temperature=0.0,          # 決定的
                best_of=1,                # 最小値
                beam_size=1,              # 最小値
                condition_on_previous_text=False,
                no_speech_threshold=0.6,  # 緩和（処理軽量化）
                compression_ratio_threshold=3.5,  # 緩和（処理軽量化）
                logprob_threshold=-1.2,   # 緩和（処理軽量化）
                fp16=False,               # CPU環境
            )
            
            return result
            
        except Exception as e:
            logger.error(f"音声認識エラー: {e}")
            raise

    def transcribe(
        self,
        audio_file_path: str,
        *,
        initial_prompt: Optional[str] = None,
        language: str = _DEFAULTS["language"],
        model_name: Optional[str] = None,
        temperature: float = _DEFAULTS["temperature"],
        best_of: int = _DEFAULTS["best_of"],
        condition_on_previous_text: bool = _DEFAULTS["condition_on_previous_text"],
        no_speech_threshold: float = _DEFAULTS["no_speech_threshold"],
        compression_ratio_threshold: float = _DEFAULTS["compression_ratio_threshold"],
        logprob_threshold: float = _DEFAULTS["logprob_threshold"],
        beam_size: int = _DEFAULTS["beam_size"],
    ) -> Dict[str, Any]:
        if language not in self.get_supported_languages():
            raise WhisperLanguageError(f"サポートされていない言語です: {language}. サポート: {self.get_supported_languages()}")

        model_to_use = self._get_model(model_name) if model_name else self.model

        # CPU環境用の設定（GPU設定を削除）
        fp16 = False

        # 初期プロンプト（未指定なら子ども向け語彙を適用）
        if language == "ja" and not initial_prompt:
            # 音声ファイル名から状況を推測
            if "audio" in audio_file_path:
                initial_prompt = generate_situation_prompt("おもちゃ 喧嘩")
            else:
                initial_prompt = generate_whisper_prompt()

        # --- 前処理 ---
        preprocessed = self._preprocess_audio(audio_file_path)
        remove_tmp = (preprocessed != audio_file_path)

        try:
            logger.info(
                "音声認識開始: %s (lang=%s, temp=%.2f, beam=%d, cond_prev=%s, fp16=%s)",
                audio_file_path, language, temperature, beam_size, condition_on_previous_text, fp16
            )

            # 最速設定で実行
            result = self._transcribe_once(
                model_to_use,
                preprocessed,
                language=language,
                initial_prompt=initial_prompt,
            )

            avg_lp = self._compute_avg_logprob(result)
            logger.info(f"avg_logprob={avg_lp}")

            # duration 補完
            duration = result.get("duration")
            if duration is None:
                segs = result.get("segments") or []
                duration = max((s.get("end", 0.0) for s in segs), default=0.0)

            return {
                "success": True,
                "text": result.get("text", "") or "",
                "language": result.get("language", language),
                "file_path": audio_file_path,
                "segments": result.get("segments", []),
                "duration": duration,
                "avg_logprob": avg_lp,
            }
        except Exception as e:
            logger.error(f"音声認識エラー: {e}")
            raise WhisperTranscriptionError(f"音声認識に失敗しました: {e}")
        finally:
            if remove_tmp and os.path.exists(preprocessed):
                try:
                    os.remove(preprocessed)
                except Exception:
                    pass

    def get_supported_languages(self) -> List[str]:
        return list(_SUPPORTED_LANGUAGES)

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "model_size": getattr(self.model, "name", self.model_name),
            "multilingual": True,
            "supported_languages": self.get_supported_languages(),
        }

    def _get_model(self, model_name: str):
        if not model_name or model_name == self.model_name:
            return self.model
        logger.info(f"別モデル読み込み: {model_name}")
        try:
            return whisper.load_model(model_name)
        except Exception as e:
            logger.error(f"別モデル読み込み失敗: {e}（fallback: {self.model_name}）")
            return self.model


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