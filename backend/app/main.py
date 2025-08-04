import os
import logging
from typing import AsyncGenerator
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import firebase_admin
from firebase_admin import credentials, auth
import crud, schemas

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

#  Firebase Adminの初期化し秘密鍵を読み込む
cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# SQLAlchemyの非同期DBセッションを設定
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)

# FastAPIアプリを初期化し、CORS許可ドメインを指定
app = FastAPI()
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

# DBセッションを依存関係として定義
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        yield session

# ルートエンドポイント
@app.post("/api/v1/login", response_model=schemas.UserResponse)
async def login(token: schemas.Token, db: AsyncSession = Depends(get_db)):
    try:
        decoded_token = auth.verify_id_token(token.id_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    uid = decoded_token['uid']
    email = decoded_token['email']
    email_verified = decoded_token['email_verified']
    nickname = decoded_token.get('name')

    user = await crud.get_or_create_user(
        db,
        uid=uid,
        email=email,
        email_verified=email_verified,
        nickname=nickname
    )

    if user is None:
        raise HTTPException(status_code=500, detail="Could not process user.")

    return user
