from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VoiceUploadRequest(BaseModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    file_type: str = Field(..., description="ファイルタイプ", example="audio")
    file_format: Optional[str] = Field(default="webm", description="ファイル形式")


class VoiceSaveRequest(BaseModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    audio_file_path: str = Field(..., description="音声ファイルのS3パス")
    text_file_path: Optional[str] = Field(None, description="テキストファイルのS3パス")


class VoiceUploadResponse(BaseModel):
    success: bool = Field(..., description="処理成功フラグ")
    upload_url: str = Field(..., description="アップロード用URL")
    file_path: str = Field(..., description="ファイルパス")
    s3_url: str = Field(..., description="S3ファイルURL")
    content_type: str = Field(..., description="ファイルのContent-Type")


class VoiceSaveResponse(BaseModel):
    success: bool = Field(..., description="処理成功フラグ")
    record_id: int = Field(..., description="保存されたレコードID")
    message: str = Field(..., description="処理結果メッセージ")