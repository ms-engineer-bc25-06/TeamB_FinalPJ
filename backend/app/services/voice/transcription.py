"""
音声認識フロー制御
Whisper連携、処理時間測定、結果保存を行う
"""

import os
import time
import logging
import tempfile
from typing import Optional, Dict, Any, List
from pathlib import Path

from app.services.whisper import WhisperService
from app.services.voice.file_ops import VoiceFileService
from app.services.voice.validation import VoiceValidationService
from app.utils.constants import SUPPORTED_LANGUAGES
from app.utils.error_handlers import raise_voice_error

# ロガーの設定
logger = logging.getLogger(__name__)


class VoiceTranscriptionService:
    """音声認識フロー制御サービス"""

    def __init__(self):
        self.whisper_service = WhisperService()
        self.file_service = VoiceFileService()
        self.validation_service = VoiceValidationService()

    def transcribe_audio_file(
        self,
        audio_file_path: str,
        user_id: str,
        language: str = "ja",
        save_text_file: bool = True,
        cleanup_temp: bool = True,
    ) -> Dict[str, Any]:
        """
        音声ファイルの文字起こしを実行

        Args:
            audio_file_path: 音声ファイルパス
            user_id: ユーザーID
            language: 言語コード
            save_text_file: テキストファイルをS3に保存するか
            cleanup_temp: 一時ファイルを削除するか

        Returns:
            Dict[str, Any]: 文字起こし結果
        """
        start_time = time.time()
        temp_file_path = None

        try:
            logger.info(
                f"音声認識開始: {audio_file_path}, ユーザー: {user_id}, 言語: {language}"
            )

            # 入力値の検証
            validation_result = self.validation_service.validate_transcription_request(
                file_path=audio_file_path, language=language
            )

            # 音声認識の実行
            transcription_result = self._execute_transcription(
                audio_file_path=audio_file_path, language=language
            )

            # 結果の後処理
            processed_result = self._process_transcription_result(
                transcription_result=transcription_result,
                user_id=user_id,
                language=language,
                save_text_file=save_text_file,
            )

            # 処理時間の計算
            processing_time = time.time() - start_time

            # 最終結果の構築
            final_result = {
                "success": True,
                "user_id": user_id,
                "language": language,
                "transcription": processed_result,
                "processing_time": processing_time,
                "file_info": {
                    "original_file": audio_file_path,
                    "file_size": os.path.getsize(audio_file_path),
                    "file_extension": Path(audio_file_path).suffix.lower().lstrip("."),
                },
            }

            logger.info(
                f"音声認識完了: {audio_file_path}, 処理時間: {processing_time:.2f}秒"
            )
            return final_result

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"音声認識エラー: {e}, 処理時間: {processing_time:.2f}秒")
            raise_voice_error("TRANSCRIPTION_FAILED")

        finally:
            # 一時ファイルのクリーンアップ
            if cleanup_temp and temp_file_path and os.path.exists(temp_file_path):
                self._cleanup_temp_file(temp_file_path)

    def transcribe_from_s3(
        self,
        s3_key: str,
        user_id: str,
        language: str = "ja",
        save_text_file: bool = True,
    ) -> Dict[str, Any]:
        """
        S3上の音声ファイルを文字起こし

        Args:
            s3_key: S3キー
            user_id: ユーザーID
            language: 言語コード
            save_text_file: テキストファイルをS3に保存するか

        Returns:
            Dict[str, Any]: 文字起こし結果
        """
        temp_file_path = None

        try:
            logger.info(f"S3音声認識開始: {s3_key}, ユーザー: {user_id}")

            # S3からファイルをダウンロード
            temp_file_path = self._download_from_s3(s3_key)

            # 文字起こしを実行
            result = self.transcribe_audio_file(
                audio_file_path=temp_file_path,
                user_id=user_id,
                language=language,
                save_text_file=save_text_file,
                cleanup_temp=False,  # 手動でクリーンアップ
            )

            # S3キー情報を追加
            result["s3_key"] = s3_key

            logger.info(f"S3音声認識完了: {s3_key}")
            return result

        except Exception as e:
            logger.error(f"S3音声認識エラー: {e}")
            raise_voice_error("TRANSCRIPTION_FAILED")

        finally:
            # 一時ファイルのクリーンアップ
            if temp_file_path and os.path.exists(temp_file_path):
                self._cleanup_temp_file(temp_file_path)

    def batch_transcribe(
        self, file_list: List[Dict[str, Any]], user_id: str, language: str = "ja"
    ) -> List[Dict[str, Any]]:
        """
        複数ファイルの一括文字起こし

        Args:
            file_list: ファイル情報のリスト
            user_id: ユーザーID
            language: 言語コード

        Returns:
            List[Dict[str, Any]]: 文字起こし結果のリスト
        """
        try:
            logger.info(f"一括音声認識開始: {len(file_list)}件, ユーザー: {user_id}")

            results = []
            for file_info in file_list:
                try:
                    file_path = file_info.get("file_path")
                    if file_path and os.path.exists(file_path):
                        result = self.transcribe_audio_file(
                            audio_file_path=file_path,
                            user_id=user_id,
                            language=language,
                        )
                        results.append(result)
                    else:
                        logger.warning(f"ファイルが存在しません: {file_info}")

                except Exception as e:
                    logger.error(f"ファイル処理エラー: {file_info}, エラー: {e}")
                    results.append(
                        {"success": False, "file_info": file_info, "error": str(e)}
                    )

            logger.info(f"一括音声認識完了: {len(results)}件処理")
            return results

        except Exception as e:
            logger.error(f"一括音声認識エラー: {e}")
            raise_voice_error("BATCH_TRANSCRIPTION_FAILED")

    def _execute_transcription(
        self, audio_file_path: str, language: str
    ) -> Dict[str, Any]:
        """
        Whisperを使用して音声認識を実行

        Args:
            audio_file_path: 音声ファイルパス
            language: 言語コード

        Returns:
            Dict[str, Any]: Whisperの認識結果
        """
        try:
            logger.info(f"Whisper音声認識実行開始: {audio_file_path}")

            # Whisperで文字起こし
            result = self.whisper_service.transcribe_audio(
                audio_file_path=audio_file_path, language=language
            )

            logger.info(f"Whisper音声認識実行完了: {audio_file_path}")
            return result

        except Exception as e:
            logger.error(f"Whisper音声認識実行エラー: {e}")
            raise_voice_error("WHISPER_TRANSCRIPTION_ERROR")

    def _process_transcription_result(
        self,
        transcription_result: Dict[str, Any],
        user_id: str,
        language: str,
        save_text_file: bool,
    ) -> Dict[str, Any]:
        """
        音声認識結果の後処理

        Args:
            transcription_result: Whisperの認識結果
            user_id: ユーザーID
            language: 言語コード
            save_text_file: テキストファイルを保存するか

        Returns:
            Dict[str, Any]: 処理済みの結果
        """
        try:
            logger.info("音声認識結果の後処理開始")

            # 基本情報の抽出
            text = transcription_result.get("text", "")
            segments = transcription_result.get("segments", [])
            duration = transcription_result.get("duration", 0)

            # 結果の構築
            processed_result = {
                "text": text,
                "language": language,
                "duration": duration,
                "segments": segments,
                "word_count": len(text.split()) if text else 0,
                "character_count": len(text) if text else 0,
                "confidence_score": self._calculate_confidence_score(segments),
            }

            # テキストファイルをS3に保存
            if save_text_file and text:
                text_file_result = self.file_service.upload_text_file(
                    text_content=text,
                    user_id=user_id,
                    original_audio_key="local_file",  # ローカルファイルの場合
                    language=language,
                )
                processed_result["text_file"] = text_file_result

            logger.info("音声認識結果の後処理完了")
            return processed_result

        except Exception as e:
            logger.error(f"音声認識結果後処理エラー: {e}")
            raise_voice_error("RESULT_PROCESSING_ERROR")

    def _download_from_s3(self, s3_key: str) -> str:
        """
        S3からファイルをダウンロード

        Args:
            s3_key: S3キー

        Returns:
            str: ダウンロードしたファイルのパス
        """
        try:
            logger.info(f"S3ファイルダウンロード開始: {s3_key}")

            # 一時ファイルの作成
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
            temp_file_path = temp_file.name
            temp_file.close()

            # S3からダウンロード
            self.file_service.s3_service.download_file(
                s3_key=s3_key,
                local_file_path=temp_file_path,
                bucket_name=self.file_service.bucket_name,
            )

            logger.info(f"S3ファイルダウンロード完了: {s3_key}")
            return temp_file_path

        except Exception as e:
            logger.error(f"S3ファイルダウンロードエラー: {e}")
            raise_voice_error("S3_DOWNLOAD_ERROR")

    def _cleanup_temp_file(self, file_path: str) -> bool:
        """
        一時ファイルを削除

        Args:
            file_path: ファイルパス

        Returns:
            bool: 削除結果
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"一時ファイル削除完了: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"一時ファイル削除エラー: {e}")
            return False

    def _calculate_confidence_score(self, segments: List[Dict[str, Any]]) -> float:
        """
        信頼度スコアを計算

        Args:
            segments: Whisperのセグメント情報

        Returns:
            float: 平均信頼度スコア
        """
        try:
            if not segments:
                return 0.0

            # 各セグメントの信頼度を取得
            confidence_scores = []
            for segment in segments:
                if "avg_logprob" in segment:
                    # logprobを確率に変換
                    confidence = 2 ** segment["avg_logprob"]
                    confidence_scores.append(confidence)

            if not confidence_scores:
                return 0.0

            # 平均信頼度を計算
            avg_confidence = sum(confidence_scores) / len(confidence_scores)
            return round(avg_confidence, 3)

        except Exception as e:
            logger.warning(f"信頼度スコア計算エラー: {e}")
            return 0.0

    def get_transcription_status(
        self, user_id: str, file_type: str = "audio"
    ) -> Dict[str, Any]:
        """
        ユーザーの音声認識状況を取得

        Args:
            user_id: ユーザーID
            file_type: ファイルタイプ

        Returns:
            Dict[str, Any]: 音声認識状況
        """
        try:
            logger.info(f"音声認識状況取得開始: {user_id}")

            # ユーザーのファイル一覧を取得
            files = self.file_service.list_user_files(user_id, file_type)

            # 統計情報を計算
            total_files = len(files)
            total_size = sum(file.get("file_size", 0) for file in files)

            status = {
                "user_id": user_id,
                "total_files": total_files,
                "total_size": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "files": files,
            }

            logger.info(f"音声認識状況取得完了: {user_id}")
            return status

        except Exception as e:
            logger.error(f"音声認識状況取得エラー: {e}")
            raise_voice_error("STATUS_RETRIEVAL_ERROR")


# 便利な関数
def format_processing_time(seconds: float) -> str:
    """処理時間を人間が読みやすい形式に変換"""
    if seconds < 60:
        return f"{seconds:.2f}秒"
    elif seconds < 3600:
        minutes = seconds / 60
        return f"{minutes:.1f}分"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}時間"


def validate_language_code(language: str) -> bool:
    """言語コードが有効かどうかを判定"""
    return language in SUPPORTED_LANGUAGES
