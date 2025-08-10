import os
import logging
import tempfile
from typing import Optional, Dict, Any
import whisper
from app.services.s3 import S3Service, S3UploadError

# ロガーの設定
logger = logging.getLogger(__name__)

class WhisperService:
    def __init__(self):
        # Whisperモデルの読み込み
        model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
        logger.info(f"Whisperモデル読み込み開始: {model_size}")
        
        try:
            self.model = whisper.load_model(model_size)
            logger.info(f"Whisperモデル読み込み完了: {model_size}")
        except Exception as e:
            logger.error(f"Whisperモデル読み込みエラー: {e}")
            raise WhisperModelLoadError(f"Whisperモデルの読み込みに失敗しました: {e}")
        
        # S3サービスの初期化
        self.s3_service = S3Service()
    
    def transcribe_audio(
        self, 
        audio_file_path: str, 
        language: str = "ja"
    ) -> Dict[str, Any]:
        """
        音声ファイルを文字起こし
        
        Args:
            audio_file_path: 音声ファイルのパス
            language: 言語コード (ja, en)
        
        Returns:
            Dict[str, Any]: 文字起こし結果
        """
        # 言語検証を追加
        if language not in self.get_supported_languages():
            raise WhisperLanguageError(f"サポートされていない言語です: {language}. サポート言語: {self.get_supported_languages()}")
        
        try:
            logger.info(f"音声認識開始: {audio_file_path}, 言語: {language}")
            
            # ローカルWhisperで文字起こし
            result = self.model.transcribe(
                audio_file_path,
                language=language
            )
            
            logger.info(f"音声認識完了: {audio_file_path}")
            
            return {
                "success": True,
                "text": result["text"],
                "language": result["language"],
                "file_path": audio_file_path,
                "segments": result.get("segments", []),
                "duration": result.get("duration", 0)
            }
            
        except Exception as e:
            logger.error(f"音声認識エラー: {e}")
            raise WhisperTranscriptionError(f"音声認識に失敗しました: {e}")

    def cleanup_temp_file(self, file_path: str) -> bool:
        """一時ファイルの削除"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"一時ファイル削除完了: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"一時ファイル削除エラー: {e}")
            return False

    def get_supported_languages(self) -> list:
        """サポートされている言語の一覧を取得"""
        return ["ja", "en"]

    def get_model_info(self) -> Dict[str, Any]:
        """Whisperモデルの情報を取得"""
        return {
            "model_size": self.model.name,
            "multilingual": True,
            "supported_languages": self.get_supported_languages()
        }

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