import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional
import logging


# カスタム例外
class S3DownloadError(Exception):
    """S3ダウンロード関連のエラー"""

    def __init__(self, message: str, error_code: str = "S3_DOWNLOAD_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class S3PresignedUrlError(Exception):
    """S3 Presigned URL生成関連のエラー"""

    def __init__(self, message: str, error_code: str = "S3_PRESIGNED_URL_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class S3DeleteError(Exception):
    """S3オブジェクト削除関連のエラー"""

    def __init__(self, message: str, error_code: str = "S3_DELETE_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


logger = logging.getLogger(__name__)


class S3Service:
    """
    AWS S3操作サービス

    S3への基本的な操作（URL生成、Presigned URL生成、削除）を提供する。
    Presigned URL方式を採用し、クライアントがS3と直接通信できるようにする。
    """

    def __init__(self):
        # AWS認証情報を環境変数から取得
        # デフォルトリージョンはap-northeast-1（東京）
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "ap-northeast-1"),
        )
        self.bucket_name = os.getenv("S3_BUCKET_NAME")

    def get_file_url(self, file_path: str) -> str:
        """
        S3ファイルのHTTPS URLを取得

        パブリックアクセス可能なHTTPS URLを生成する。
        Presigned URLとは異なり、有効期限の制限はない。

        Args:
            file_path: S3キー

        Returns:
            str: HTTPS URL
        """
        return f"https://{self.bucket_name}.s3.amazonaws.com/{file_path}"

    def generate_presigned_upload_url(
        self,
        file_path: str,
        content_type: str = "application/octet-stream",
        expiration: int = 3600,
    ) -> Optional[str]:
        """
        署名付きアップロードURL（PUT）を生成

        クライアントがS3に直接アップロードするための署名付きURLを生成する。
        サーバーを経由せずにファイルをアップロードできるため、パフォーマンスが向上する。

        Args:
            file_path: S3キー
            content_type: コンテンツタイプ
            expiration: 有効期限（秒）

        Returns:
            Optional[str]: Presigned URL、またはNone

        Raises:
            S3PresignedUrlError: URL生成に失敗した場合
        """
        try:
            return self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": file_path,
                    "ContentType": content_type,
                },
                ExpiresIn=expiration,
            )
        except ClientError as e:
            logger.error("Presigned upload URL error: %s", e)
            raise S3PresignedUrlError(
                f"署名付きアップロードURLの生成に失敗しました: {e}"
            ) from e

    def generate_presigned_download_url(
        self, file_path: str, expiration: int = 3600
    ) -> Optional[str]:
        """
        署名付きダウンロードURL（GET）を生成

        クライアントがS3から直接ダウンロードするための署名付きURLを生成する。
        一時的なアクセス権限により、セキュリティを保ちながらファイル共有を実現する。

        Args:
            file_path: S3キー
            expiration: 有効期限（秒）

        Returns:
            Optional[str]: Presigned URL、またはNone

        Raises:
            S3PresignedUrlError: URL生成に失敗した場合
        """
        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=expiration,
            )
        except ClientError as e:
            logger.error("Presigned download URL error: %s", e)
            raise S3PresignedUrlError(
                f"署名付きダウンロードURLの生成に失敗しました: {e}"
            ) from e

    def delete_object(self, s3_key: str, bucket_name: Optional[str] = None) -> bool:
        """
        S3オブジェクトを削除

        指定されたS3キーのオブジェクトを削除する。
        バケット名が指定されていない場合は、デフォルトバケットを使用する。

        Args:
            s3_key: S3キー
            bucket_name: バケット名（オプション）

        Returns:
            bool: 削除結果（True: 成功、False: 失敗）

        Raises:
            S3DownloadError: バケット名が設定されていない場合
            S3DeleteError: 削除に失敗した場合
        """
        bucket = bucket_name or self.bucket_name
        if not bucket:
            raise S3DownloadError("S3 バケット名が設定されていません")

        try:
            self.s3_client.delete_object(Bucket=bucket, Key=s3_key)
            logger.info("S3オブジェクト削除完了: %s", s3_key)
            return True
        except ClientError as e:
            logger.error("S3 delete_object error (key=%s): %s", s3_key, e)
            raise S3DeleteError(f"オブジェクト削除に失敗しました: {e}") from e
