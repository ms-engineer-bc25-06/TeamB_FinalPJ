"""
音声ファイルのバリデーション処理
ファイル形式、サイズ、言語コード、ユーザーIDなどの検証を行う
"""

import os
import logging
from typing import Optional, Dict, Any
from pathlib import Path

from app.utils.constants import (
    MAX_FILE_SIZE,
    SUPPORTED_AUDIO_FORMATS,
    SUPPORTED_LANGUAGES,
    ERROR_MESSAGES
)
from app.utils.error_handlers import raise_voice_error

# ロガーの設定
logger = logging.getLogger(__name__)

class VoiceValidationService:
    """音声ファイルのバリデーションサービス"""
    
    def __init__(self):
        self.max_file_size = MAX_FILE_SIZE
        self.supported_formats = SUPPORTED_AUDIO_FORMATS
        self.supported_languages = SUPPORTED_LANGUAGES
    
    def validate_file_format(self, file_path: str) -> bool:
        """
        ファイル形式の検証
        
        Args:
            file_path: ファイルパス
            
        Returns:
            bool: 検証結果
            
        Raises:
            CustomHTTPException: サポートされていない形式の場合
        """
        try:
            # ファイル拡張子の取得
            file_extension = Path(file_path).suffix.lower().lstrip('.')
            
            if file_extension not in self.supported_formats:
                logger.warning(f"サポートされていないファイル形式: {file_extension}")
                raise_voice_error("INVALID_FILE_FORMAT")
            
            logger.info(f"ファイル形式検証完了: {file_extension}")
            return True
            
        except Exception as e:
            logger.error(f"ファイル形式検証エラー: {e}")
            raise
    
    def validate_file_size(self, file_path: str) -> bool:
        """
        ファイルサイズの検証
        
        Args:
            file_path: ファイルパス
            
        Returns:
            bool: 検証結果
            
        Raises:
            CustomHTTPException: サイズ制限を超える場合
        """
        try:
            if not os.path.exists(file_path):
                logger.error(f"ファイルが存在しません: {file_path}")
                raise_voice_error("FILE_NOT_FOUND")
            
            file_size = os.path.getsize(file_path)
            
            if file_size > self.max_file_size:
                logger.warning(f"ファイルサイズ制限超過: {file_size} bytes")
                raise_voice_error("FILE_TOO_LARGE")
            
            logger.info(f"ファイルサイズ検証完了: {file_size} bytes")
            return True
            
        except Exception as e:
            logger.error(f"ファイルサイズ検証エラー: {e}")
            raise
    
    def validate_language(self, language: str) -> bool:
        """
        言語コードの検証
        
        Args:
            language: 言語コード
            
        Returns:
            bool: 検証結果
            
        Raises:
            CustomHTTPException: サポートされていない言語の場合
        """
        try:
            if language not in self.supported_languages:
                logger.warning(f"サポートされていない言語: {language}")
                raise_voice_error("INVALID_LANGUAGE")
            
            logger.info(f"言語コード検証完了: {language}")
            return True
            
        except Exception as e:
            logger.error(f"言語コード検証エラー: {e}")
            raise
    
    def validate_user_id(self, user_id: str) -> bool:
        """
        ユーザーIDの検証
        
        Args:
            user_id: ユーザーID
            
        Returns:
            bool: 検証結果
            
        Raises:
            CustomHTTPException: 無効なユーザーIDの場合
        """
        try:
            # 基本的な形式チェック
            if not user_id or not isinstance(user_id, str):
                logger.warning("無効なユーザーID形式")
                raise_voice_error("INVALID_USER_ID")
            
            if len(user_id.strip()) == 0:
                logger.warning("空のユーザーID")
                raise_voice_error("INVALID_USER_ID")
            
            # 必要に応じて追加の検証ロジックを実装
            # 例: UUID形式チェック、データベース存在確認など
            
            logger.info(f"ユーザーID検証完了: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"ユーザーID検証エラー: {e}")
            raise
    
    def validate_upload_request(
        self,
        file_path: str,
        language: str = "ja",
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        アップロードリクエストの包括的検証
        
        Args:
            file_path: ファイルパス
            language: 言語コード
            user_id: ユーザーID（オプション）
            
        Returns:
            Dict[str, Any]: 検証結果とファイル情報
            
        Raises:
            CustomHTTPException: 検証失敗時
        """
        try:
            logger.info(f"アップロードリクエスト検証開始: {file_path}")
            
            # 各項目の検証
            self.validate_file_format(file_path)
            self.validate_file_size(file_path)
            self.validate_language(language)
            
            if user_id:
                self.validate_user_id(user_id)
            
            # ファイル情報の取得
            file_info = {
                "file_path": file_path,
                "file_name": Path(file_path).name,
                "file_size": os.path.getsize(file_path),
                "file_extension": Path(file_path).suffix.lower().lstrip('.'),
                "language": language,
                "user_id": user_id
            }
            
            logger.info(f"アップロードリクエスト検証完了: {file_path}")
            return {
                "success": True,
                "file_info": file_info
            }
            
        except Exception as e:
            logger.error(f"アップロードリクエスト検証エラー: {e}")
            raise
    
    def validate_transcription_request(
        self,
        file_path: str,
        language: str = "ja"
    ) -> Dict[str, Any]:
        """
        音声認識リクエストの検証
        
        Args:
            file_path: ファイルパス
            language: 言語コード
            
        Returns:
            Dict[str, Any]: 検証結果
            
        Raises:
            CustomHTTPException: 検証失敗時
        """
        try:
            logger.info(f"音声認識リクエスト検証開始: {file_path}")
            
            # 基本的な検証
            self.validate_file_format(file_path)
            self.validate_file_size(file_path)
            self.validate_language(language)
            
            # 音声認識に特化した検証
            # 例: ファイルの破損チェック、音声長チェックなど
            
            logger.info(f"音声認識リクエスト検証完了: {file_path}")
            return {
                "success": True,
                "file_path": file_path,
                "language": language
            }
            
        except Exception as e:
            logger.error(f"音声認識リクエスト検証エラー: {e}")
            raise

# 便利な関数
def get_file_extension(file_path: str) -> str:
    """ファイル拡張子を取得"""
    return Path(file_path).suffix.lower().lstrip('.')

def is_audio_file(file_path: str) -> bool:
    """音声ファイルかどうかを判定"""
    extension = get_file_extension(file_path)
    return extension in SUPPORTED_AUDIO_FORMATS

def get_file_size_mb(file_path: str) -> float:
    """ファイルサイズをMB単位で取得"""
    if os.path.exists(file_path):
        return os.path.getsize(file_path) / (1024 * 1024)
    return 0.0