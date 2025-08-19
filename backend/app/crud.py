from __future__ import annotations

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from app import models

logger = logging.getLogger(__name__)

UTC = timezone.utc
def now_utc() -> datetime:
    return datetime.now(UTC)

# UIDでユーザーを1件取得
async def get_user_by_uid(db: AsyncSession, uid: str) -> Optional[models.User]:
    try:
        stmt = (
            select(models.User)
            .where(models.User.uid == uid)
            .options(selectinload(models.User.subscriptions))
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("get_user_by_uid failed", exc_info=e)
        return None

# UIDでユーザーをUPSERT（なければ作成・あれば更新）
async def upsert_user_by_uid(
    db: AsyncSession,
    *,
    uid: str,
    email: Optional[str],
    email_verified: bool,
    nickname: Optional[str],
) -> Optional[models.User]:
    try:
        update_set: dict = {
            "last_login_at": func.now(),
            "login_count": models.User.login_count + 1,
            "email_verified": email_verified,
        }
        if email is not None:
            update_set["email"] = email
        if nickname is not None:
            update_set["nickname"] = nickname

        stmt = (
            insert(models.User)
            .values(
                uid=uid,
                email=email,
                email_verified=email_verified,
                nickname=nickname,
                last_login_at=func.now(), 
                login_count=1,
            )
            .on_conflict_do_update(
                index_elements=[models.User.uid],
                set_=update_set,
            )
            .returning(models.User.id)
        )

        res = await db.execute(stmt)
        user_id = res.scalar_one()
        await db.commit()

        return await db.get(models.User, user_id)

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("upsert_user_by_uid failed", exc_info=e)
        return None


async def get_or_create_user(
    db: AsyncSession,
    uid: str,
    email: Optional[str],
    email_verified: bool,
    nickname: Optional[str],
) -> Optional[models.User]:
    return await upsert_user_by_uid(
        db,
        uid=uid,
        email=email,
        email_verified=email_verified,
        nickname=nickname,
    )

# ユーザーに紐づくSubscriptionレコードの作成/更新
async def upsert_subscription_customer_id(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,             
    stripe_customer_id: str,
) -> Optional[models.Subscription]:
    try:
        stmt = (
            insert(models.Subscription)
            .values(
                user_id=user_id,
                stripe_customer_id=stripe_customer_id,
                trial_started_at=func.now(),
            )
            .on_conflict_do_update(
                index_elements=[models.Subscription.user_id],
                set_={"stripe_customer_id": stripe_customer_id},
            )
            .returning(models.Subscription.id)
        )
        res = await db.execute(stmt)
        sub_id = res.scalar_one()
        await db.commit()
        return await db.get(models.Subscription, sub_id)

    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("upsert_subscription_customer_id failed", exc_info=e)
        return None

# 上のUPSERTを使い、必要なら user をリフレッシュ   
async def update_stripe_customer_id(
    db: AsyncSession, user: models.User, stripe_customer_id: str
) -> Optional[models.User]:
    sub = await upsert_subscription_customer_id(
        db, user_id=user.id, stripe_customer_id=stripe_customer_id
    )
    if sub is None:
        return None
    try:
        # user.subscriptions を直後に使うなら明示的に最新化
        await db.refresh(user)
    except SQLAlchemyError as e:
        logger.warning("refresh user after subscription upsert failed", exc_info=e)
    return user

async def get_user_by_stripe_customer_id(
    db: AsyncSession, 
    stripe_customer_id: str
) -> Optional[models.User]:
    """Stripe顧客IDからユーザーを取得"""
    try:
        stmt = (
            select(models.User)
            .join(models.Subscription)
            .where(models.Subscription.stripe_customer_id == stripe_customer_id)
        )
        res = await db.execute(stmt)
        return res.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("get_user_by_stripe_customer_id failed", exc_info=e)
        return None

async def update_subscription_status(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    subscription_status: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
    is_trial: Optional[bool] = None,
    trial_started_at: Optional[datetime] = None,
    trial_expires_at: Optional[datetime] = None,
    is_paid: Optional[bool] = None,
) -> Optional[models.Subscription]:
    """サブスクリプション状態を更新"""
    try:
        # 既存のサブスクリプションレコードを取得
        stmt = select(models.Subscription).where(models.Subscription.user_id == user_id)
        result = await db.execute(stmt)
        subscription = result.scalar_one_or_none()
        
        if not subscription:
            # 新規作成
            subscription = models.Subscription(
                user_id=user_id,
                subscription_status=subscription_status,
                stripe_subscription_id=stripe_subscription_id,
                is_trial=is_trial,
                trial_started_at=trial_started_at,
                trial_expires_at=trial_expires_at,
                is_paid=is_paid,
            )
            db.add(subscription)
        else:
            # 既存レコードの更新
            if subscription_status is not None:
                subscription.subscription_status = subscription_status
            if stripe_subscription_id is not None:
                subscription.stripe_subscription_id = stripe_subscription_id
            if is_trial is not None:
                subscription.is_trial = is_trial
            if trial_started_at is not None:
                subscription.trial_started_at = trial_started_at
            if trial_expires_at is not None:
                subscription.trial_expires_at = trial_expires_at
            if is_paid is not None:
                subscription.is_paid = is_paid
        
        await db.commit()
        await db.refresh(subscription)
        return subscription
        
    except SQLAlchemyError as e:
        await db.rollback()
        logger.error("update_subscription_status failed", exc_info=e)
        return None

async def get_subscription_by_user_id(
    db: AsyncSession, 
    user_id: uuid.UUID
) -> Optional[models.Subscription]:
    """ユーザーIDからサブスクリプション情報を取得"""
    try:
        stmt = select(models.Subscription).where(models.Subscription.user_id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("get_subscription_by_user_id failed", exc_info=e)
        return None