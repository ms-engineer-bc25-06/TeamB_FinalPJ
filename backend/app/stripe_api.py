import os
import stripe
import logging
from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from firebase_admin import auth

from app import crud, schemas
from app.models import User
from app.database import get_db
    
# Stripe関連のAPIルーター設定
router = APIRouter(
    prefix="/api/v1/stripe",
    tags=["stripe"],
)

# HTTPヘッダーのBearerトークンからFirebaseのUIDを取得
async def get_uid(
    cred: HTTPAuthorizationCredentials = Security(HTTPBearer()),
) -> str:
    token = cred.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        logging.error(f"Token verification failed", exc_info=e)
        raise HTTPException(status_code=401, detail="Invalid or expired token")

# UIDからDBのユーザー情報を取得
async def get_current_user(
    uid: str = Depends(get_uid),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await crud.get_user_by_uid(db, uid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found in database")
    return user

# Stripe Checkoutセッション作成
@router.post(
    "/checkout-session", 
    summary="Stripe CheckoutセッションURLを取得",
    description="""
    フロントエンドでStripeの決済画面に遷移するためのCheckout Sessionを作成する。
    - 初回利用時はStripe顧客（Customer）を作成してDBに保存
    - 7日間のトライアル付き定期課金を設定
    """,
    response_model=schemas.CheckoutSessionResponse,
)
async def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    price_id = os.getenv("STRIPE_PRICE_ID")
    success_url = "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}"
    cancel_url = "http://localhost:3000/payment/cancel"
    # DBからStripe顧客IDを取得
    stripe_customer_id = current_user.subscriptions.stripe_customer_id if current_user.subscriptions else None
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
        # フロントエンドが利用するセッションIDを返す
        return {"sessionId": checkout_session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))