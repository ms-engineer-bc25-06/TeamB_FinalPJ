import os
import boto3
from botocore.exceptions import ClientError
from typing import Optional


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
        """ファイルをS3にアップロード"""
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_path,
                Body=file_content,
                ContentType=content_type,
            )
            return True
        except ClientError as e:
            print(f"S3 upload error: {e}")
            return False

    def get_file_url(self, file_path: str) -> str:
        """S3ファイルのURLを取得"""
        return f"s3://{self.bucket_name}/{file_path}"

    def generate_presigned_upload_url(
        self,
        file_path: str,
        content_type: str = "application/octet-stream",
        expiration: int = 3600,
    ) -> Optional[str]:
        """署名付きアップロードURLを生成（有効期限：デフォルト1時間）"""
        try:
            url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": file_path,
                    "ContentType": content_type,
                },
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            print(f"Presigned upload URL error: {e}")
            return None

    def generate_presigned_download_url(
        self, file_path: str, expiration: int = 3600
    ) -> Optional[str]:
        """署名付きダウンロードURLを生成"""
        try:
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": file_path,
                },
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            print(f"Presigned download URL error: {e}")
            return None
