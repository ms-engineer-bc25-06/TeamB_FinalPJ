import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional
import logging

# カスタム例外
class S3UploadError(Exception):
    def __init__(self, message: str, error_code: str = "S3_UPLOAD_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class S3DownloadError(Exception):
    def __init__(self, message: str, error_code: str = "S3_DOWNLOAD_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

class S3PresignedUrlError(Exception):
    def __init__(self, message: str, error_code: str = "S3_PRESIGNED_URL_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION", "ap-northeast-1"),
        )
        self.bucket_name = os.getenv("S3_BUCKET_NAME")

    def upload_file(
        self,
        file_content: bytes,
        file_path: str,
        content_type: str = "application/octet-stream",
    ) -> bool:
        """ファイルをS3にアップロード（メモリ上のbytesをそのままPUT）"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_path,
                Body=file_content,
                ContentType=content_type,
            )
            return True
        except ClientError as e:
            logger.error(f"S3 upload error: {e}")
            raise S3UploadError(f"ファイルのアップロードに失敗しました: {e}")

    def get_file_url(self, file_path: str) -> str:
        """S3ファイルのURLを取得（s3:// 形式）"""
        return f"s3://{self.bucket_name}/{file_path}"

    def generate_presigned_upload_url(
        self,
        file_path: str,
        content_type: str = "application/octet-stream",
        expiration: int = 3600,
    ) -> Optional[str]:
        """署名付きアップロードURL（PUT）を生成"""
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
            logger.error(f"Presigned upload URL error: {e}")
            raise S3PresignedUrlError(f"署名付きアップロードURLの生成に失敗しました: {e}")

    def generate_presigned_download_url(
        self, file_path: str, expiration: int = 3600
    ) -> Optional[str]:
        """署名付きダウンロードURL（GET）を生成"""
        try:
            return self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket_name, "Key": file_path},
                ExpiresIn=expiration,
            )
        except ClientError as e:
            logger.error(f"Presigned download URL error: {e}")
            raise S3PresignedUrlError(f"署名付きダウンロードURLの生成に失敗しました: {e}")

    def download_file(
        self,
        s3_key: Optional[str] = None,
        local_file_path: Optional[str] = None,
        *,
        file_path: Optional[str] = None,
        bucket_name: Optional[str] = None,
    ) -> str:
        """
        S3のオブジェクトをローカルファイルに保存する。
        - voice.py の呼び出しに合わせて `s3_key`, `local_file_path`, `bucket_name` を受け付けます。
        - `file_path` は `s3_key` の別名（どちらか一方を指定）。
        戻り値: 保存先ローカルパス
        """
        key = s3_key or file_path
        bucket = bucket_name or self.bucket_name

        if not key:
            raise S3DownloadError("S3 key が指定されていません")
        if not bucket:
            raise S3DownloadError("S3 バケット名が設定されていません")
        if not local_file_path:
            raise S3DownloadError("保存先 local_file_path が指定されていません")

        # 保存先ディレクトリを作成
        directory = os.path.dirname(local_file_path)
        if directory:
            os.makedirs(directory, exist_ok=True)

        try:
            self.s3_client.download_file(bucket, key, local_file_path)
            return local_file_path
        except ClientError as e:
            logger.error(f"S3 download error (key={key}): {e}")
            raise S3DownloadError(f"ファイルのダウンロードに失敗しました: {e}")

    def download_bytes(
        self,
        s3_key: str,
        bucket_name: Optional[str] = None,
    ) -> bytes:
        """
        S3のオブジェクトを bytes で取得（メモリ上に展開）
        - 一時ファイルを作りたくない簡易確認/テスト向け
        """
        bucket = bucket_name or self.bucket_name
        if not bucket:
            raise S3DownloadError("S3 バケット名が設定されていません")
        try:
            res = self.s3_client.get_object(Bucket=bucket, Key=s3_key)
            return res["Body"].read()
        except ClientError as e:
            logger.error(f"S3 get_object error (key={s3_key}): {e}")
            raise S3DownloadError(f"オブジェクト取得に失敗しました: {e}")
