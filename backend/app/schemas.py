from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, AnyUrl, HttpUrl, ConfigDict, field_validator


# -------------------
# 認証・ユーザー系
# -------------------
class Token(BaseModel):
    id_token: str


class UserBase(BaseModel):
    email: EmailStr
    nickname: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    uid: str
    email_verified: bool
    role: str
    created_at: datetime
    updated_at: datetime

    # Pydantic v2: orm_mode 相当
    model_config = ConfigDict(from_attributes=True)


# -------------------
# 子供系スキーマ
# -------------------
class ChildBase(BaseModel):
    nickname: str
    birth_date: str  # YYYY-MM-DD形式
    gender: str


class ChildResponse(ChildBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckoutSessionResponse(BaseModel):
    sessionId: str


# -------------------
# 音声系スキーマ
# -------------------

# 固定値は Literal で縛る
AllowedFileType = Literal["audio"]
AllowedAudioFormat = Literal["webm", "wav", "mp3", "m4a"]


class StrictModel(BaseModel):
    """余計なフィールドを拒否（タイプミスを早期検知）"""
    model_config = ConfigDict(extra="forbid")


# ===== Request =====
class VoiceUploadRequest(StrictModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    file_type: AllowedFileType = Field(..., description="ファイルタイプ", example="audio")
    file_format: AllowedAudioFormat = Field(
        default="wav", description="ファイル形式（webm/wav/mp3/m4a）"
    )


class VoiceSaveRequest(StrictModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    audio_file_path: str = Field(..., description="音声ファイルのS3/HTTPSパス（例: s3://bucket/key.webm または https://...）")
    text_file_path: Optional[str] = Field(
        None, description="テキストファイルのS3/HTTPSパス（例: s3://bucket/key.txt）（任意）"
    )


class VoiceTranscribeRequest(StrictModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    audio_file_path: str = Field(..., description="音声ファイルのS3/HTTPSパス（例: s3://bucket/key.webm または https://...）")
    language: Literal["ja", "en", "auto"] = Field(
        default="ja", description="言語コード (ja: 日本語, en: 英語, auto: 自動検出)"
    )

    @field_validator("audio_file_path")
    @classmethod
    def validate_audio_file_path(cls, v: str) -> str:
        if not v.startswith(("s3://", "https://")):
            raise ValueError("audio_file_path は s3:// または https:// で指定してください")
        return v


# ===== Response =====
class VoiceUploadResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ")
    upload_url: HttpUrl = Field(..., description="アップロード用URL（署名付きHTTPS推奨）")
    file_path: str = Field(..., description="保存用の一意なパス（例: bucket/key.webm）")
    s3_url: AnyUrl = Field(..., description="S3上/HTTPSのファイルURL（https:// または s3://）")
    content_type: str = Field(..., description="ファイルのContent-Type（例: audio/webm）")

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, v: str) -> str:
        # “最低限”のガード：audio/* しか受けない
        if "/" not in v:
            raise ValueError("content_type は 'type/subtype' 形式（例: audio/webm）で指定してください")
        if not v.startswith("audio/"):
            raise ValueError("audio 系のMIMEタイプのみ許可（例: audio/webm, audio/wav）")
        return v


class VoiceSaveResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ")
    record_id: int = Field(..., description="保存されたレコードID")
    message: str = Field(..., description="処理結果メッセージ")
    saved_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="保存時刻（UTC, timezone-aware）"
    )


class VoiceTranscribeResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ")
    transcription_id: int = Field(..., description="音声認識ID")
    text: str = Field(..., description="認識されたテキスト")
    confidence: float = Field(..., ge=0.0, le=1.0, description="認識精度（0.0〜1.0）")
    language: str = Field(..., description="認識された言語")
    duration: float = Field(..., ge=0.0, description="音声の長さ（秒）")
    processed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="処理完了時刻（UTC, timezone-aware）"
    )


class SessionStatusRequest(BaseModel):
    session_id: str
