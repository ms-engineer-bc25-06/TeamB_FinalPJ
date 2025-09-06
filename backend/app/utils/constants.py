"""
アプリケーション全体で使用する定数定義

音声認識、S3設定、エラーメッセージなど、アプリケーション全体で
共通して使用される定数を一元管理する。
"""

import os

# 音声認識でサポートする言語コード（ISO 639-1形式）
SUPPORTED_LANGUAGES = {"ja", "en"}

# S3設定
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_UPLOAD_FOLDER = "voice-uploads"
S3_PRESIGNED_URL_EXPIRY = 3600

# 感情強度のマッピング
INTENSITY_MAPPING = {"low": 1, "medium": 2, "high": 3}

# エラーメッセージ
ERROR_MESSAGES = {
    "INVALID_UUID": "Invalid UUID format",
    "HTTP_URL_NOT_SUPPORTED": "HTTP(S) audio URLs are not supported. Please use S3 keys.",
    "REQUIRED_PARAMS_MISSING": "user_id, child_id, emotion_card_id, intensity_id are required",
    "TRANSCRIPTION_FAILED": "Transcription failed",
    "SAVE_RECORD_FAILED": "Failed to save record",
    "UPLOAD_URL_GENERATION_FAILED": "Failed to generate upload URL",
    "RECORDS_FETCH_FAILED": "Failed to fetch records",
    "UPLOAD_FAILED": "File upload failed",
    "S3_CONFIG_ERROR": "S3 configuration is not properly set",
}
