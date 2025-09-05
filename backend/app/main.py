import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
import firebase_admin
from firebase_admin import credentials, auth
import stripe

from app.config.database import engine, async_session_local

from app.api.v1.endpoints.voice import router as new_voice_router
from app.api.v1.endpoints.children import router as children_router
from app.api.v1.endpoints.auth import router as auth_router
from app.utils.error_handlers import register_error_handlers
from app.api.v1.endpoints.emotion_color_api import router as emotion_color_router
from app.api.v1.endpoints.emotion_api import router as emotion_router
from app.api.v1.endpoints.stripe_api import router as stripe_router

logging.basicConfig(level=logging.INFO, force=True)
logging.getLogger().setLevel(logging.INFO)


load_dotenv()

#  Firebase Adminの初期化し秘密鍵を読み込む
# Firebase認証の初期化（テスト環境ではスキップ）
if os.getenv("SKIP_FIREBASE_AUTH", "false").lower() != "true":
    cred_path = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS", "/firebase-service-account.json"
    )
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

# Stripe APIキーの設定
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # TODO:本番は Alembic マイグレーションでDBを用意する
    # 開発用にどうしても必要なら、環境変数で切り替え
    # if os.getenv("DEV_CREATE_ALL") == "1":
    #     async with engine.begin() as conn:
    #         await conn.run_sync(Base.metadata.create_all)
    yield


security_schemes = {"bearerAuth": {"type": "http", "scheme": "bearer"}}

# lifespanを登録して、起動時の処理を有効化
app = FastAPI(
    lifespan=lifespan, openapi_components={"securitySchemes": security_schemes}
)

# エラーハンドラの登録
register_error_handlers(app)

# CORSミドルウェア設定
origins = [
    "http://localhost:3000",
    # TODO:本番用ドメインを後で追加,
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(auth_router, prefix="/api/v1")
app.include_router(new_voice_router, prefix="/api/v1")
app.include_router(children_router, prefix="/api/v1/children")
app.include_router(emotion_router)
app.include_router(emotion_color_router)
app.include_router(stripe_router)


