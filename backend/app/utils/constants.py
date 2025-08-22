# app/utils/constants.py
"""
音声認識API用の定数定義
"""

import os

# ファイルサイズ制限（5MB）
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_RECORDING_DURATION = 60       # 60秒

# 利用制限 NOTE: 開発用に無効化
# MAX_DAILY_UPLOADS = 5             # 1日5回
# MAX_MONTHLY_UPLOADS = 100         # 1ヶ月100回

# 音声品質設定
AUDIO_QUALITY = {
    "RECOMMENDED_SAMPLE_RATE": 16000,  # 16kHz
    "RECOMMENDED_BIT_DEPTH": 16,       # 16bit
    "RECOMMENDED_FORMAT": "wav"
}

# サポートする音声ファイル形式（既存実装に合わせる）
SUPPORTED_AUDIO_FORMATS = [
    "wav",   # 推奨（無圧縮、高品質）
    "mp3",   # 圧縮（サイズ削減）
    "webm",  # Web用（軽量）
    "m4a",   # iOS用
    "aac",   # 高圧縮
    "txt"    # 既存対応（テキストファイル）
]

# サポートする言語コード
SUPPORTED_LANGUAGES = [
    "ja",    # 日本語
    "en",    # 英語
]

# Whisper API設定
WHISPER_MODEL = "whisper-1"
WHISPER_MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB（Whisper制限）

# S3設定（既存実装に合わせる）
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")  # 環境変数から取得
S3_REGION = os.getenv("AWS_REGION", "ap-northeast-1")  # デフォルト: ap-northeast-1
S3_UPLOAD_FOLDER = "voice-uploads"
S3_PRESIGNED_URL_EXPIRY = 3600  # 60分（既存設定）

# エラーメッセージ
ERROR_MESSAGES = {
    "FILE_TOO_LARGE": "ファイルサイズが5MBを超えています",
    "RECORDING_TOO_LONG": "録音時間が60秒を超えています",
    "DAILY_LIMIT_EXCEEDED": "1日のアップロード制限（5回）を超えています",
    "INVALID_FILE_FORMAT": "サポートされていないファイル形式です",
    "INVALID_LANGUAGE": "サポートされていない言語です",
    "UPLOAD_FAILED": "ファイルのアップロードに失敗しました",
    "TRANSCRIPTION_FAILED": "音声認識に失敗しました",
    "S3_CONFIG_ERROR": "S3設定が正しく設定されていません",
}