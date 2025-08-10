import os
import logging
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import firebase_admin
from firebase_admin import credentials, auth
from app import crud, schemas
from app.models import Base, User
from app.database import engine, async_session_local
from app.voice_api import router as voice_router
import stripe


load_dotenv()

# --- 初期化処理 ---
from app.emotion_color_api import router as emotion_color_router
DATABASE_URL = os.getenv("DATABASE_URL")

#  Firebase Adminの初期化し秘密鍵を読み込む
cred_path = os.getenv(
    "GOOGLE_APPLICATION_CREDENTIALS", "/firebase-service-account.json"
)
cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)

# Stripe APIキーの設定
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# SQLAlchemyの非同期DBセッションを設定
engine = create_async_engine(DATABASE_URL, echo=True)
async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- Lifespan Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 本番は Alembic マイグレーションでDBを用意する
    # 開発用にどうしても必要なら、環境変数で切り替え
    # if os.getenv("DEV_CREATE_ALL") == "1":
    #     async with engine.begin() as conn:
    #         await conn.run_sync(Base.metadata.create_all)
    yield


# --- FastAPIアプリケーションのインスタンス化 ---
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
app.include_router(emotion_color_router)

# --- 依存関係 (DI) ---
# DBセッションを依存関係として定義
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        yield session

# 認証
bearer = HTTPBearer(auto_error=True)

async def get_uid(
    cred: HTTPAuthorizationCredentials = Security(HTTPBearer()),
) -> str:
    """
    Bearerトークンを検証し、Firebase UIDを返す
    """
    token = cred.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        logging.error(f"Token verification failed", exc_info=e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user(
    uid: str = Depends(get_uid),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    UIDからDBのユーザー情報を取得する
    """
    user = await crud.get_user_by_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
    return user

# --- APIエンドポイント ---
@app.post("/api/v1/login", response_model=schemas.UserResponse)
async def login(token: schemas.Token, db: AsyncSession = Depends(get_db)):
    try:
        decoded_token = auth.verify_id_token(token.id_token)
    except Exception as e:
        logging.warning("Login token invalid", exc_info=e)
        raise HTTPException(status_code=401, detail="Invalid token")

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

@app.post("/api/v1/stripe/checkout-session", response_model=schemas.CheckoutSessionResponse)
async def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stripeのチェックアウトセッションを作成し、決済ページのURLを返す
    """
    price_id = os.getenv("STRIPE_PRICE_ID")
    success_url = "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}"
    cancel_url = "http://localhost:3000/payment/cancel"

    # DBからStripe顧客IDを取得
    stripe_customer_id = current_user.subscription.stripe_customer_id if current_user.subscription else None

    # まだStripeの顧客でない場合は、新しく作成する
    if not stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.nickname,
        )
        stripe_customer_id = customer.id
        # 作成した顧客IDをDBに保存
        await crud.update_stripe_customer_id(db, user=current_user, stripe_customer_id=stripe_customer_id)

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            mode='subscription',
            subscription_data={'trial_period_days': 7},
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
