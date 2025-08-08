import os
import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import firebase_admin
from firebase_admin import credentials, auth
from app import crud
from app import schemas
from app.models import Base


from app.voice_api import router as voice_router
from api.v1.endpoints.voice import router as new_voice_router

load_dotenv()

from app.emotion_color_api import router as emotion_color_router
DATABASE_URL = os.getenv("DATABASE_URL")

#  Firebase Adminの初期化し秘密鍵を読み込む
cred_path = os.getenv(
    "GOOGLE_APPLICATION_CREDENTIALS", "/firebase-service-account.json"
)
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# SQLAlchemyの非同期DBセッションを設定
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


# lifespanを登録して、起動時の処理を有効化
app = FastAPI(lifespan=lifespan)

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

# 入力音声から作られたファイルを管理するAPIを追加
app.include_router(voice_router)

app.include_router(new_voice_router, prefix="/api/v1")

app.include_router(emotion_color_router)



# DBセッションを依存関係として定義
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        yield session


# --- APIエンドポイント ---
@app.post("/api/v1/login", response_model=schemas.UserResponse)
async def login(token: schemas.Token, db: AsyncSession = Depends(get_db)):
    try:
        decoded_token = auth.verify_id_token(token.id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    uid = decoded_token["uid"]
    email = decoded_token.get("email")
    email_verified = decoded_token.get("email_verified", False)
    nickname = decoded_token.get("name")

    user = await crud.get_or_create_user(
        db, uid=uid, email=email, email_verified=email_verified, nickname=nickname
    )

    if user is None:
        raise HTTPException(status_code=500, detail="Could not process user.")

    return user
