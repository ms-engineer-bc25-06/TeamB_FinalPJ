from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, AnyUrl, HttpUrl, ConfigDict, field_validator

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
        default="webm", description="ファイル形式（webm/wav/mp3/m4a）"
    )

class VoiceSaveRequest(StrictModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    audio_file_path: str = Field(..., description="音声ファイルのS3パス（例: bucket/key.webm）")
    text_file_path: Optional[str] = Field(None, description="テキストファイルのS3パス（任意）")

class VoiceTranscribeRequest(StrictModel):
    user_id: int = Field(..., description="ユーザーID", example=1)
    audio_file_path: str = Field(..., description="音声ファイルのS3パス")
    language: Literal["ja", "en", "auto"] = Field(
        default="ja", description="言語コード (ja: 日本語, en: 英語, auto: 自動検出)"
    )

# ===== Response =====
class VoiceUploadResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ")
    upload_url: HttpUrl = Field(..., description="アップロード用URL（署名付きHTTPS推奨）")
    file_path: str = Field(..., description="保存用の一意なパス（例: bucket/key.webm）")
    s3_url: AnyUrl = Field(..., description="S3上のファイルURL（https:// または s3://）")
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
    saved_at: datetime = Field(default_factory=datetime.utcnow, description="保存時刻（UTC）")

class VoiceTranscribeResponse(StrictModel):
    success: bool = Field(..., description="処理成功フラグ")
    transcription_id: int = Field(..., description="音声認識ID")
    text: str = Field(..., description="認識されたテキスト")
    confidence: float = Field(..., ge=0.0, le=1.0, description="認識精度（0.0〜1.0）")
    language: str = Field(..., description="認識された言語")
    duration: float = Field(..., ge=0.0, description="音声の長さ（秒）")
    processed_at: datetime = Field(default_factory=datetime.utcnow, description="処理完了時刻（UTC）")
