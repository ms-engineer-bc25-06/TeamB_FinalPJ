"""
音声ファイルの操作処理
S3パス構築、ファイルアップロード、メタデータ管理を行う
"""

import os
import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

from app.services.s3 import S3Service
from app.utils.constants import (
    S3_BUCKET_NAME,
    S3_UPLOAD_FOLDER,
    S3_PRESIGNED_URL_EXPIRY
)
from app.utils.error_handlers import raise_voice_error

# ロガーの設定
logger = logging.getLogger(__name__)

class VoiceFileService:
    """音声ファイルの操作サービス"""
    
    def __init__(self):
        self.s3_service = S3Service()
        self.bucket_name = S3_BUCKET_NAME
        self.upload_folder = S3_UPLOAD_FOLDER
        
        if not self.bucket_name:
            logger.error("S3_BUCKET_NAMEが設定されていません")
            raise_voice_error("S3_CONFIG_ERROR")
    
    def generate_s3_key(
        self,
        user_id: str,
        file_name: str,
        file_type: str = "audio"
    ) -> str:
        """
        S3キーを生成
        
        Args:
            user_id: ユーザーID
            file_name: ファイル名
            file_type: ファイルタイプ（audio, text等）
            
        Returns:
            str: S3キー
        """
        try:
            # ユニークなIDを生成
            unique_id = str(uuid.uuid4())
            
            # 現在の日時を取得
            current_date = datetime.now().strftime("%Y/%m/%d")
            
            # S3キーを構築
            s3_key = f"{self.upload_folder}/{file_type}/{user_id}/{current_date}/{unique_id}_{file_name}"
            
            logger.info(f"S3キー生成完了: {s3_key}")
            return s3_key
            
        except Exception as e:
            logger.error(f"S3キー生成エラー: {e}")
            raise_voice_error("S3_KEY_GENERATION_ERROR")
    
    def upload_audio_file(
        self,
        local_file_path: str,
        user_id: str,
        language: str = "ja",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        音声ファイルをS3にアップロード
        
        Args:
            local_file_path: ローカルファイルパス
            user_id: ユーザーID
            language: 言語コード
            metadata: 追加メタデータ
            
        Returns:
            Dict[str, Any]: アップロード結果
        """
        try:
            logger.info(f"音声ファイルアップロード開始: {local_file_path}")
            
            # ファイル名を取得
            file_name = Path(local_file_path).name
            
            # S3キーを生成
            s3_key = self.generate_s3_key(user_id, file_name, "audio")
            
            # メタデータを構築
            file_metadata = {
                "user_id": user_id,
                "language": language,
                "file_type": "audio",
                "upload_date": datetime.now().isoformat(),
                "original_filename": file_name,
                "file_size": os.path.getsize(local_file_path),
                "file_extension": Path(local_file_path).suffix.lower().lstrip('.')
            }
            
            # 追加メタデータがあれば統合
            if metadata:
                file_metadata.update(metadata)
            
            # S3にアップロード
            upload_result = self.s3_service.upload_file(
                local_file_path=local_file_path,
                s3_key=s3_key,
                bucket_name=self.bucket_name,
                metadata=file_metadata
            )
            
            logger.info(f"音声ファイルアップロード完了: {s3_key}")
            
            return {
                "success": True,
                "s3_key": s3_key,
                "s3_url": f"s3://{self.bucket_name}/{s3_key}",
                "metadata": file_metadata,
                "upload_result": upload_result
            }
            
        except Exception as e:
            logger.error(f"音声ファイルアップロードエラー: {e}")
            raise_voice_error("UPLOAD_FAILED")
    
    def upload_text_file(
        self,
        text_content: str,
        user_id: str,
        original_audio_key: str,
        language: str = "ja"
    ) -> Dict[str, Any]:
        """
        音声認識結果のテキストファイルをS3にアップロード
        
        Args:
            text_content: テキスト内容
            user_id: ユーザーID
            original_audio_key: 元の音声ファイルのS3キー
            language: 言語コード
            
        Returns:
            Dict[str, Any]: アップロード結果
        """
        try:
            logger.info(f"テキストファイルアップロード開始: {original_audio_key}")
            
            # テキストファイル名を生成
            text_file_name = f"transcription_{Path(original_audio_key).stem}.txt"
            
            # S3キーを生成
            s3_key = self.generate_s3_key(user_id, text_file_name, "text")
            
            # メタデータを構築
            file_metadata = {
                "user_id": user_id,
                "language": language,
                "file_type": "text",
                "upload_date": datetime.now().isoformat(),
                "original_audio_key": original_audio_key,
                "content_type": "text/plain",
                "character_count": len(text_content)
            }
            
            # 一時的なテキストファイルを作成
            temp_file_path = f"/tmp/{text_file_name}"
            with open(temp_file_path, 'w', encoding='utf-8') as f:
                f.write(text_content)
            
            try:
                # S3にアップロード
                upload_result = self.s3_service.upload_file(
                    local_file_path=temp_file_path,
                    s3_key=s3_key,
                    bucket_name=self.bucket_name,
                    metadata=file_metadata
                )
                
                logger.info(f"テキストファイルアップロード完了: {s3_key}")
                
                return {
                    "success": True,
                    "s3_key": s3_key,
                    "s3_url": f"s3://{self.bucket_name}/{s3_key}",
                    "metadata": file_metadata,
                    "upload_result": upload_result
                }
                
            finally:
                # 一時ファイルを削除
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    
        except Exception as e:
            logger.error(f"テキストファイルアップロードエラー: {e}")
            raise_voice_error("UPLOAD_FAILED")
    
    def get_file_metadata(self, s3_key: str) -> Dict[str, Any]:
        """
        ファイルのメタデータを取得
        
        Args:
            s3_key: S3キー
            
        Returns:
            Dict[str, Any]: メタデータ
        """
        try:
            logger.info(f"ファイルメタデータ取得開始: {s3_key}")
            
            # S3からメタデータを取得
            metadata = self.s3_service.get_file_metadata(
                s3_key=s3_key,
                bucket_name=self.bucket_name
            )
            
            logger.info(f"ファイルメタデータ取得完了: {s3_key}")
            return metadata
            
        except Exception as e:
            logger.error(f"ファイルメタデータ取得エラー: {e}")
            raise_voice_error("METADATA_RETRIEVAL_ERROR")
    
    def list_user_files(
        self,
        user_id: str,
        file_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        ユーザーのファイル一覧を取得
        
        Args:
            user_id: ユーザーID
            file_type: ファイルタイプ（オプション）
            
        Returns:
            List[Dict[str, Any]]: ファイル一覧
        """
        try:
            logger.info(f"ユーザーファイル一覧取得開始: {user_id}")
            
            # プレフィックスを構築
            prefix = f"{self.upload_folder}/"
            if file_type:
                prefix += f"{file_type}/{user_id}/"
            else:
                prefix += f"*/{user_id}/"
            
            # S3からファイル一覧を取得
            files = self.s3_service.list_files(
                bucket_name=self.bucket_name,
                prefix=prefix
            )
            
            # ファイル情報を整形
            file_list = []
            for file_info in files:
                file_list.append({
                    "s3_key": file_info.get("Key"),
                    "file_name": Path(file_info.get("Key", "")).name,
                    "file_size": file_info.get("Size", 0),
                    "last_modified": file_info.get("LastModified"),
                    "file_type": self._extract_file_type(file_info.get("Key", ""))
                })
            
            logger.info(f"ユーザーファイル一覧取得完了: {len(file_list)}件")
            return file_list
            
        except Exception as e:
            logger.error(f"ユーザーファイル一覧取得エラー: {e}")
            raise_voice_error("FILE_LIST_RETRIEVAL_ERROR")
    
    def generate_download_url(
        self,
        s3_key: str,
        expiry: int = S3_PRESIGNED_URL_EXPIRY
    ) -> str:
        """
        ダウンロード用のPresigned URLを生成
        
        Args:
            s3_key: S3キー
            expiry: 有効期限（秒）
            
        Returns:
            str: Presigned URL
        """
        try:
            logger.info(f"ダウンロードURL生成開始: {s3_key}")
            
            # Presigned URLを生成
            download_url = self.s3_service.generate_presigned_download_url(
                s3_key=s3_key,
                bucket_name=self.bucket_name,
                expiry=expiry
            )
            
            logger.info(f"ダウンロードURL生成完了: {s3_key}")
            return download_url
            
        except Exception as e:
            logger.error(f"ダウンロードURL生成エラー: {e}")
            raise_voice_error("DOWNLOAD_URL_GENERATION_ERROR")
    
    def delete_file(self, s3_key: str) -> bool:
        """
        ファイルを削除
        
        Args:
            s3_key: S3キー
            
        Returns:
            bool: 削除結果
        """
        try:
            logger.info(f"ファイル削除開始: {s3_key}")
            
            # S3からファイルを削除
            delete_result = self.s3_service.delete_file(
                s3_key=s3_key,
                bucket_name=self.bucket_name
            )
            
            logger.info(f"ファイル削除完了: {s3_key}")
            return delete_result
            
        except Exception as e:
            logger.error(f"ファイル削除エラー: {e}")
            raise_voice_error("FILE_DELETION_ERROR")
    
    def _extract_file_type(self, s3_key: str) -> str:
        """
        S3キーからファイルタイプを抽出
        
        Args:
            s3_key: S3キー
            
        Returns:
            str: ファイルタイプ
        """
        try:
            # S3キーの構造: upload_folder/file_type/user_id/date/filename
            parts = s3_key.split('/')
            if len(parts) >= 3:
                return parts[1]  # file_type部分
            return "unknown"
        except Exception:
            return "unknown"

# 便利な関数
def get_file_size_human_readable(file_size_bytes: int) -> str:
    """ファイルサイズを人間が読みやすい形式に変換"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if file_size_bytes < 1024.0:
            return f"{file_size_bytes:.1f} {unit}"
        file_size_bytes /= 1024.0
    return f"{file_size_bytes:.1f} TB"

def is_valid_s3_key(s3_key: str) -> bool:
    """S3キーが有効かどうかを判定"""
    if not s3_key or not isinstance(s3_key, str):
        return False
    
    # S3キーの基本的な形式チェック
    if s3_key.startswith('/') or s3_key.endswith('/'):
        return False
    
    # 禁止文字のチェック
    forbidden_chars = ['\\', ':', '|', '*', '?', '"', '<', '>']
    return not any(char in s3_key for char in forbidden_chars)