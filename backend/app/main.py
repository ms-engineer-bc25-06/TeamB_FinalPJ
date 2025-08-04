import os
import logging
from typing import AsyncGenerator
from dotenv import load_dotenv
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from voice_api import router as voice_router

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI()

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

# DBセッションを依存関係として定義
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        yield session

# ルートエンドポイント
# DB接続テスト
# TODO: 開発初期のDB接続確認用。実際のAPIルートが完成したら削除または置き換えること！
@app.get("/")
async def read_root(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(text("SELECT 1"))
        row = result.scalar_one_or_none()
        if row == 1:
            return {"db_status": "ok", "message": "Database connection successful!"}
        else:
            return {"db_status": "error", "message": "Database connection test failed."}
    except Exception as e:
        logging.error(f"Database connection error: {e}")
        return {"db_status": "error", "message": "Database connection error"}
