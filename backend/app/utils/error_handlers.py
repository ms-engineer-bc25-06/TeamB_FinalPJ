"""
統一エラーハンドラ
HTTPException → JSON変換、カスタムエラーレスポンス、ログ出力などを統合管理
"""

import logging
import traceback
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

from .constants import ERROR_MESSAGES

# ロガーの設定
logger = logging.getLogger(__name__)


class CustomHTTPException(HTTPException):
    """
    カスタムHTTPExceptionクラス
    エラーコードと詳細情報を含む
    """

    def __init__(
        self,
        status_code: int,
        error_code: str,
        detail: str = None,
        headers: Optional[Dict[str, str]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


class ErrorResponse:
    """
    統一エラーレスポンス形式
    """

    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        """エラーレスポンスを辞書形式で返す"""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "status_code": self.status_code,
                "details": self.details,
            },
            "success": False,
        }


# エラーコード定義
ERROR_CODES = {
    # 音声ファイル関連エラー
    "FILE_TOO_LARGE": "VOICE_001",
    "RECORDING_TOO_LONG": "VOICE_002",
    "INVALID_FILE_FORMAT": "VOICE_003",
    "UPLOAD_FAILED": "VOICE_004",
    # 音声認識関連エラー
    "TRANSCRIPTION_FAILED": "VOICE_005",
    "INVALID_LANGUAGE": "VOICE_006",
    # 認証・権限エラー
    "UNAUTHORIZED": "AUTH_001",
    "FORBIDDEN": "AUTH_002",
    "INVALID_TOKEN": "AUTH_003",
    # データベースエラー
    "DATABASE_ERROR": "DB_001",
    "RECORD_NOT_FOUND": "DB_002",
    # S3関連エラー
    "S3_CONFIG_ERROR": "S3_001",
    "S3_UPLOAD_ERROR": "S3_002",
    "S3_DOWNLOAD_ERROR": "S3_003",
    # バリデーションエラー
    "VALIDATION_ERROR": "VAL_001",
    # システムエラー
    "INTERNAL_ERROR": "SYS_001",
    "SERVICE_UNAVAILABLE": "SYS_002",
    # 404エラー用
    "NOT_FOUND": "NOT_FOUND_001",
}


def create_error_response(
    error_code: str,
    message: str,
    status_code: int = 400,
    details: Optional[Dict[str, Any]] = None,
) -> ErrorResponse:
    """
    エラーレスポンスを作成

    Args:
        error_code: エラーコード（ERROR_CODESのキー）
        message: エラーメッセージ
        status_code: HTTPステータスコード
        details: 詳細情報

    Returns:
        ErrorResponse: エラーレスポンスオブジェクト
    """
    return ErrorResponse(
        error_code=ERROR_CODES.get(error_code, "UNKNOWN_ERROR"),
        message=message,
        status_code=status_code,
        details=details,
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    HTTPExceptionの統一ハンドラ

    Args:
        request: FastAPIリクエストオブジェクト
        exc: HTTPException

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    # エラーログの出力
    logger.error(
        f"HTTPException: {exc.status_code} - {exc.detail}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": exc.status_code,
            "detail": exc.detail,
        },
    )

    # ステータスコードに基づいてエラーコードを決定
    error_code = "HTTP_ERROR"
    if exc.status_code == 401:
        error_code = "INVALID_TOKEN"
    elif exc.status_code == 403:
        error_code = "FORBIDDEN"
    elif exc.status_code == 404:
        error_code = "NOT_FOUND"
    elif exc.status_code == 500:
        error_code = "INTERNAL_ERROR"

    # エラーレスポンスの作成
    error_response = create_error_response(
        error_code=error_code,  # ✅ 変数 error_code を使用
        message=str(exc.detail) if exc.detail else "HTTPエラーが発生しました",
        status_code=exc.status_code,
    )

    return JSONResponse(status_code=exc.status_code, content=error_response.to_dict())


async def not_found_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    """
    404エラーの統一ハンドラ

    Args:
        request: FastAPIリクエストオブジェクト
        exc: HTTPException

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    # 404エラーの場合のみ処理
    if exc.status_code == 404:
        # エラーログの出力
        logger.error(
            f"404 Not Found: {request.url.path}",
            extra={
                "path": request.url.path,
                "method": request.method,
                "status_code": 404,
            },
        )

        # エラーレスポンスの作成
        error_response = create_error_response(
            error_code="NOT_FOUND",
            message="リクエストされたリソースが見つかりません",
            status_code=404,
            details={"path": request.url.path},
        )

        return JSONResponse(status_code=404, content=error_response.to_dict())

    # その他のHTTPエラーは既存のハンドラに委譲
    return await http_exception_handler(request, exc)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    バリデーションエラーの統一ハンドラ

    Args:
        request: FastAPIリクエストオブジェクト
        exc: RequestValidationError

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    # エラーログの出力
    logger.error(
        f"ValidationError: {exc.errors()}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "validation_errors": exc.errors(),
        },
    )

    # バリデーションエラーの詳細を整理
    error_details = {}
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        error_details[field] = {"type": error["type"], "message": error["msg"]}

    # エラーレスポンスの作成
    error_response = create_error_response(
        error_code="VALIDATION_ERROR",
        message="リクエストのバリデーションに失敗しました",
        status_code=422,
        details=error_details,
    )

    return JSONResponse(status_code=422, content=error_response.to_dict())


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    一般的な例外の統一ハンドラ

    Args:
        request: FastAPIリクエストオブジェクト
        exc: 例外オブジェクト

    Returns:
        JSONResponse: 統一されたエラーレスポンス
    """
    # エラーログの出力（スタックトレース含む）
    logger.error(
        f"Unexpected error: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__,
            "traceback": traceback.format_exc(),
        },
    )

    # エラーレスポンスの作成
    error_response = create_error_response(
        error_code="INTERNAL_ERROR",
        message="内部サーバーエラーが発生しました",
        status_code=500,
    )

    return JSONResponse(status_code=500, content=error_response.to_dict())


def register_error_handlers(app):
    """
    アプリケーションにエラーハンドラを登録

    Args:
        app: FastAPIアプリケーションインスタンス
    """
    # 404エラーハンドラを最初に登録（ステータスコード404を明示的に指定）
    app.add_exception_handler(404, not_found_exception_handler)

    # カスタムHTTPExceptionハンドラ
    app.add_exception_handler(CustomHTTPException, http_exception_handler)

    # バリデーションエラーハンドラ
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # 一般的な例外ハンドラ
    app.add_exception_handler(Exception, general_exception_handler)


# 便利な関数
def raise_voice_error(
    error_key: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None
):
    """
    音声関連エラーを発生させる

    Args:
        error_key: ERROR_MESSAGESのキー
        status_code: HTTPステータスコード
        details: 詳細情報

    Raises:
        CustomHTTPException: カスタムHTTP例外
    """
    message = ERROR_MESSAGES.get(error_key, "不明なエラーが発生しました")
    raise CustomHTTPException(
        status_code=status_code, error_code=error_key, detail=message
    )


def raise_auth_error(error_key: str, status_code: int = 401):
    """
    認証関連エラーを発生させる

    Args:
        error_key: エラーキー
        status_code: HTTPステータスコード

    Raises:
        CustomHTTPException: カスタムHTTP例外
    """
    messages = {
        "UNAUTHORIZED": "認証が必要です",
        "FORBIDDEN": "アクセス権限がありません",
        "INVALID_TOKEN": "無効なトークンです",
    }
    message = messages.get(error_key, "認証エラーが発生しました")
    raise CustomHTTPException(
        status_code=status_code, error_code=error_key, detail=message
    )
