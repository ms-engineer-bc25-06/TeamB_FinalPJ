"""
音声ファイルの操作処理
S3パス構築、ファイルアップロード、メタデータ管理を行う
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from app.services.s3 import S3Service, S3DeleteError, S3PresignedUrlError
from app.utils.constants import (
    S3_BUCKET_NAME,
    S3_UPLOAD_FOLDER,
    S3_PRESIGNED_URL_EXPIRY,
)
from app.utils.error_handlers import raise_voice_error

logger = logging.getLogger(__name__)


class VoiceFileService:
    """音声ファイルの操作サービス"""

    def __init__(self):
        self.s3_service = S3Service()
        self.bucket_name = S3_BUCKET_NAME
        self.upload_folder = S3_UPLOAD_FOLDER
        self.default_expiry = S3_PRESIGNED_URL_EXPIRY

        self._validate_config()

    def _validate_config(self):
        """設定の検証"""
        if not self.bucket_name:
            logger.error("S3_BUCKET_NAMEが設定されていません")
            raise_voice_error("S3_CONFIG_ERROR")

        if not self.upload_folder:
            logger.error("S3_UPLOAD_FOLDERが設定されていません")
            raise_voice_error("S3_CONFIG_ERROR")

        logger.info(
            f"VoiceFileService初期化完了: bucket={self.bucket_name}, folder={self.upload_folder}"
        )

    def _calculate_expiry(self, s3_key: str) -> int:
        """
        ファイルタイプに基づいて有効期限を計算

        ファイルタイプに応じて適切な有効期限を設定する。
        テキストファイルは長期間保存される可能性が高いため、有効期限を2倍に設定する。
        """
        file_type = self._extract_file_type(s3_key)

        # ファイルタイプ別の有効期限設定
        # テキストファイルは長期間保存される可能性が高いため、有効期限を2倍に設定
        expiry_mapping = {
            "audio": self.default_expiry,
            "text": self.default_expiry * 2,  # テキストファイルは長め
            "unknown": self.default_expiry,
        }

        return expiry_mapping.get(file_type, self.default_expiry)

    def generate_s3_key(
        self, user_id: str, file_name: str, file_type: str = "audio"
    ) -> str:
        """
        S3キーを生成

        ユーザー別、日付別、ファイルタイプ別に整理されたS3キーを生成する。
        ファイルの重複を防ぐため、UUIDを付与してユニーク性を保証する。

        Args:
            user_id: ユーザーID
            file_name: ファイル名
            file_type: ファイルタイプ（audio, text等）

        Returns:
            str: S3キー（例: voice-uploads/audio/user123/2024/01/15/uuid_filename.webm）
        """
        try:
            unique_id = str(uuid.uuid4())
            current_date = datetime.now().strftime("%Y/%m/%d")
            s3_key = f"{self.upload_folder}/{file_type}/{user_id}/{current_date}/{unique_id}_{file_name}"

            logger.info(f"S3キー生成完了: {s3_key}")
            return s3_key

        except Exception as e:
            logger.error(f"S3キー生成エラー: {e}")
            raise_voice_error("S3_KEY_GENERATION_ERROR")

    def generate_download_url(self, s3_key: str, expiry: Optional[int] = None) -> str:
        """
        ダウンロード用のPresigned URLを生成

        ファイルタイプに応じて適切な有効期限を自動設定し、
        セキュアな一時アクセスURLを生成する。

        Args:
            s3_key: S3キー
            expiry: 有効期限（秒、Noneの場合は自動計算）

        Returns:
            str: Presigned URL（一時的なダウンロード用URL）
        """
        try:
            logger.info(f"ダウンロードURL生成開始: {s3_key}")

            if expiry is None:
                expiry = self._calculate_expiry(s3_key)

            download_url = self.s3_service.generate_presigned_download_url(
                file_path=s3_key, expiration=expiry
            )

            logger.info(f"ダウンロードURL生成完了: {s3_key}, expiry={expiry}s")
            return download_url

        except S3PresignedUrlError as e:
            logger.error(f"Presigned URL生成エラー: {e}")
            raise_voice_error("DOWNLOAD_URL_GENERATION_ERROR")
        except Exception as e:
            logger.error(f"予期しないエラー: {e}")
            raise_voice_error("UNEXPECTED_ERROR")

    def delete_object(self, s3_key: str) -> bool:
        """
        S3オブジェクトを削除

        S3Serviceのdelete_objectをラップし、エラーハンドリングを提供する。
        削除に失敗した場合は警告ログを出力し、Falseを返す。

        Args:
            s3_key: S3キー

        Returns:
            bool: 削除結果（True: 成功、False: 失敗）
        """
        try:
            logger.info(f"S3オブジェクト削除開始: {s3_key}")

            self.s3_service.delete_object(s3_key)

            logger.info(f"S3オブジェクト削除完了: {s3_key}")
            return True

        except S3DeleteError as e:
            logger.warning(f"S3オブジェクト削除失敗: key={s3_key}, エラー: {e}")
            return False
        except Exception as e:
            logger.error(f"予期しないエラー: key={s3_key}, エラー: {e}")
            raise_voice_error("UNEXPECTED_ERROR")

    def _extract_file_type(self, s3_key: str) -> str:
        """
        S3キーからファイルタイプを抽出

        S3キーの構造からファイルタイプ（audio, text等）を抽出する。
        キーの形式: upload_folder/file_type/user_id/date/filename

        Args:
            s3_key: S3キー

        Returns:
            str: ファイルタイプ（audio, text, unknown）
        """
        try:
            # S3キーの構造: upload_folder/file_type/user_id/date/filename
            parts = s3_key.split("/")
            if len(parts) >= 3:
                return parts[1]  # file_type部分
            return "unknown"
        except Exception:
            return "unknown"
