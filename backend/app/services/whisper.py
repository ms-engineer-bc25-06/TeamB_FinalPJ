"""
Whisper音声認識サービス

OpenAIのWhisperモデルを使用して音声を文字起こしするサービス。
モデルキャッシュ機能により、初回読み込み後の処理を高速化する。
子ども向け語彙の初期プロンプトを自動適用し、認識精度を向上させる。
"""

import os
import logging
import tempfile
from typing import Dict, Any, Optional, List

import whisper
import boto3
from app.utils.child_vocabulary import (
    generate_whisper_prompt,
    generate_situation_prompt,
)
from app.utils.constants import SUPPORTED_LANGUAGES

logger = logging.getLogger(__name__)

# Whisper音声認識の品質設定定数
# 一貫性と高精度を重視した設定値
DEFAULT_TEMPERATURE = (
    0.0  # 一貫した結果のための温度パラメータ（0.0=最も一貫、1.0=最も創造的）
)
DEFAULT_FP16 = False  # 高精度のための浮動小数点設定（False=32bit精度、True=16bit高速）
DEFAULT_DURATION = 0.0  # 音声長さが不明な場合の安全な初期値

# 環境変数から取得する設定値（未設定時はデフォルト値を使用）
_DEFAULTS = {
    "model_name": os.getenv("WHISPER_MODEL_SIZE", "base"),
    "language": os.getenv("WHISPER_LANGUAGE", "ja"),
    "temperature": float(os.getenv("WHISPER_TEMPERATURE", "0.0")),
    "beam_size": int(os.getenv("WHISPER_BEAM_SIZE", "1")),
    "best_of": int(os.getenv("WHISPER_BEST_OF", "1")),
    "condition_on_previous_text": os.getenv("WHISPER_COND_PREV", "false").lower()
    == "true",
    "no_speech_threshold": float(os.getenv("WHISPER_NO_SPEECH_TH", "0.6")),
    "compression_ratio_threshold": float(os.getenv("WHISPER_COMP_RATIO_TH", "3.5")),
    "logprob_threshold": float(os.getenv("WHISPER_LOGPROB_TH", "-1.2")),
}

# サポート言語一覧（constants.pyから一元管理）
_SUPPORTED_LANGUAGES: List[str] = list(SUPPORTED_LANGUAGES)

# DEFAULT_INITIAL_PROMPT_JAの部分を更新
DEFAULT_INITIAL_PROMPT_JA = os.getenv(
    "WHISPER_INITIAL_PROMPT_JA", generate_whisper_prompt()  # 動的に生成
)


class WhisperService:
    """
    Whisper音声認識サービス

    OpenAIのWhisperモデルを使用して音声を文字起こしするサービス。
    モデルキャッシュ機能により、初回読み込み後の処理を高速化する。
    子ども向け語彙の初期プロンプトを自動適用し、認識精度を向上させる。
    """

    def __init__(self) -> None:
        if os.getenv("DEV_MODE", "false").lower() == "true":
            self.model_name = "base"
        else:
            self.model_name = os.getenv("WHISPER_MODEL_SIZE", "base")

        self._model_cache = None
        self._model_loaded = False
        # S3アクセス用のクライアントを初期化
        self.s3_client = boto3.client("s3")
        # 既存のS3設定と一致させる
        from app.utils.constants import S3_BUCKET_NAME

        self.bucket_name = S3_BUCKET_NAME
        if not self.bucket_name:
            raise ValueError("S3_BUCKET_NAME環境変数が設定されていません")
        logger.info(
            f"WhisperService初期化: {self.model_name}, S3バケット: {self.bucket_name}"
        )

    def _get_cached_model(self):
        """
        Whisperモデルをキャッシュして取得

        初回呼び出し時にモデルを読み込み、以降はキャッシュから取得する。
        これにより、複数回の音声認識処理でパフォーマンスを大幅に向上させる。

        Returns:
            whisper.Model: 読み込み済みのWhisperモデル

        Raises:
            WhisperError: モデル読み込みに失敗した場合
        """
        if not self._model_loaded:
            logger.info(f"Whisperモデル読み込み開始: {self.model_name}")
            try:
                self._model_cache = whisper.load_model(self.model_name)
                self._model_loaded = True
                logger.info(
                    f"Whisperモデル読み込み完了: {self.model_name}（キャッシュ済み）"
                )
            except Exception as e:
                logger.error(f"Whisperモデル読み込みエラー: {e}")
                raise WhisperModelLoadError(
                    f"Whisperモデルの読み込みに失敗しました: {e}"
                )
        else:
            logger.debug("キャッシュされたWhisperモデルを使用: 高速！")
        return self._model_cache

    def _preprocess_audio(self, src_path: str) -> str:
        """
        音声前処理（最適化済みファイルを受け取る）

        音声最適化は呼び出し元（voice.py）で実行済みのため、
        ここではファイルパスの検証のみを行う。

        Args:
            src_path: 音声ファイルパス

        Returns:
            str: 処理済み音声ファイルパス
        """
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
        """
        平均ログ確率を計算

        Whisperの認識結果から各セグメントの平均ログ確率を計算する。
        この値は音声認識の信頼度を示し、値が高いほど認識精度が高い。

        Args:
            result: Whisperの認識結果辞書

        Returns:
            Optional[float]: 平均ログ確率、計算できない場合はNone
        """
        segs = result.get("segments") or []
        vals = [
            s.get("avg_logprob")
            for s in segs
            if isinstance(s.get("avg_logprob"), (int, float))
        ]
        if not vals:
            return None
        return float(sum(vals) / len(vals))

    def _transcribe_once(self, model, audio_path: str, **kwargs) -> Dict[str, Any]:
        """1回の音声認識実行（最速設定）"""
        try:
            # 最速設定で実行
            result = model.transcribe(
                audio_path,
                **kwargs,
                # 最速設定
                temperature=0.0,  # 決定的
                best_of=1,  # 最小値
                beam_size=1,  # 最小値
                condition_on_previous_text=False,
                no_speech_threshold=0.6,  # 緩和（処理軽量化）
                compression_ratio_threshold=3.5,  # 緩和（処理軽量化）
                logprob_threshold=-1.2,  # 緩和（処理軽量化）
                fp16=False,  # CPU環境
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
    ) -> Dict[str, Any]:
        """
        音声認識のメイン処理

        S3に保存された音声ファイルをWhisper AIで文字起こしする。
        日本語の場合は子ども向け語彙の初期プロンプトを自動適用し、
        認識精度を向上させる。

        Args:
            audio_file_path: 音声ファイルパス（S3キー）
            initial_prompt: 初期プロンプト（未指定時は自動生成）
            language: 認識言語（デフォルト: 日本語）

        Returns:
            Dict[str, Any]: 音声認識結果
                - success: 処理成功フラグ
                - text: 認識されたテキスト
                - language: 認識された言語
                - file_path: 処理したファイルパス
                - segments: セグメント情報
                - duration: 音声長さ
                - avg_logprob: 平均ログ確率（信頼度）

        Raises:
            WhisperError: 音声認識に失敗した場合
        """
        if language not in self.get_supported_languages():
            raise WhisperLanguageError(
                f"サポートされていない言語です: {language}. サポート: {self.get_supported_languages()}"
            )

        # キャッシュされたモデルを使用
        model_to_use = self._get_cached_model()

        # 初期プロンプト（未指定なら子ども向け語彙を適用）
        # 日本語音声の認識精度向上のため、子ども向け語彙の初期プロンプトを自動適用
        if language == "ja" and not initial_prompt:
            # 音声ファイル名から状況を推測して適切なプロンプトを選択
            if "audio" in audio_file_path:
                # 音声ファイルの場合は状況別プロンプト（おもちゃ喧嘩など）
                initial_prompt = generate_situation_prompt("おもちゃ 喧嘩")
            else:
                # その他の場合は一般的な子ども向け語彙プロンプト
                initial_prompt = generate_whisper_prompt()

        preprocessed = self._preprocess_audio(audio_file_path)
        remove_tmp = preprocessed != audio_file_path

        try:
            logger.info(
                f"音声認識開始: {audio_file_path} (lang={language}, fp16={DEFAULT_FP16})"
            )

            # 最速設定で実行
            # temperature=0.0で一貫した結果、fp16=Falseで高精度を確保
            try:
                result = model_to_use.transcribe(
                    preprocessed,
                    language=language,
                    initial_prompt=initial_prompt,
                    temperature=DEFAULT_TEMPERATURE,  # 0.0=最も一貫した結果
                    fp16=DEFAULT_FP16,  # False=32bit精度で高品質
                )
            except Exception as e:
                logger.error(f"音声認識エラー: {e}")
                raise WhisperTranscriptionError(f"音声認識に失敗しました: {e}")

            avg_lp = self._compute_avg_logprob(result)
            logger.info(f"avg_logprob={avg_lp}")

            # duration が None の場合はセグメント情報から計算
            # Whisperが音声長さを正確に取得できない場合のフォールバック処理
            duration = result.get("duration")
            if duration is None:
                segs = result.get("segments") or []
                # 各セグメントの終了時間の最大値を音声長さとして使用
                duration = max(
                    (s.get("end", 0.0) for s in segs), default=DEFAULT_DURATION
                )

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
            # 一時ファイルのクリーンアップ
            # 前処理で一時ファイルが作成された場合のみ削除
            if remove_tmp and os.path.exists(preprocessed):
                try:
                    os.remove(preprocessed)
                except Exception:
                    # 削除に失敗しても処理は継続（ログは出力しない）
                    pass

    async def transcribe_from_s3(
        self,
        s3_key: str,
        *,
        initial_prompt: Optional[str] = None,
        language: str = _DEFAULTS["language"],
    ) -> Dict[str, Any]:
        """
        S3から音声ファイルをダウンロードして音声認識を実行

        Args:
            s3_key: S3キー
            initial_prompt: 初期プロンプト
            language: 認識言語

        Returns:
            Dict[str, Any]: 音声認識結果
        """
        temp_file_path = None
        try:
            # S3から一時ファイルにダウンロード
            temp_file_path = await self._download_from_s3(s3_key)

            # 音声認識を実行
            result = self.transcribe(
                audio_file_path=temp_file_path,
                initial_prompt=initial_prompt,
                language=language,
            )

            return result

        finally:
            # 一時ファイルを削除
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                    logger.debug(f"一時ファイルを削除しました: {temp_file_path}")
                except Exception as e:
                    logger.warning(f"一時ファイル削除に失敗: {e}")

    async def _download_from_s3(self, s3_key: str) -> str:
        """S3からファイルをダウンロードして一時ファイルに保存"""
        temp_file_path = None
        try:
            # まずファイルの存在確認
            logger.info(f"S3ファイル存在確認: bucket={self.bucket_name}, key={s3_key}")
            try:
                self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
                logger.info(f"S3ファイル存在確認OK: {s3_key}")
            except Exception as head_error:
                logger.error(f"S3ファイル存在確認失敗: {head_error}")
                raise head_error

            # 一時ファイルを作成
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
            temp_file_path = temp_file.name
            temp_file.close()

            logger.info(
                f"S3からダウンロード開始: bucket={self.bucket_name}, key={s3_key} -> {temp_file_path}"
            )

            # S3からダウンロード
            self.s3_client.download_file(
                Bucket=self.bucket_name, Key=s3_key, Filename=temp_file_path
            )

            logger.info(f"S3ダウンロード完了: {temp_file_path}")
            return temp_file_path

        except Exception as e:
            # エラー時は一時ファイルを削除
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except Exception:
                    pass
            logger.error(
                f"S3ダウンロードエラー: bucket={self.bucket_name}, key={s3_key}, error={e}"
            )
            raise e

    def get_supported_languages(self) -> List[str]:
        """
        サポート言語一覧を取得

        constants.pyで定義されたALLOWED_LANGUAGESから
        サポート言語一覧を取得する。

        Returns:
            List[str]: サポート言語コードのリスト
        """
        return list(_SUPPORTED_LANGUAGES)

    def _get_model(self, model_name: str):
        if not model_name or model_name == self.model_name:
            return self._get_cached_model()
        logger.info(f"別モデル読み込み: {model_name}")
        try:
            return whisper.load_model(model_name)
        except Exception as e:
            logger.error(f"別モデル読み込み失敗: {e}（fallback: {self.model_name}）")
            return self._get_cached_model()


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
