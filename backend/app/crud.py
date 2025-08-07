from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
import models
from datetime import datetime, timedelta, timezone
from typing import Optional

JST = timezone(timedelta(hours=9))


def now_jst() -> datetime:
    return datetime.now(JST)


async def get_user_by_uid(db: AsyncSession, uid: str) -> Optional[models.User]:
    try:
        result = await db.execute(select(models.User).filter(models.User.uid == uid))
        return result.scalars().first()
    except SQLAlchemyError as e:
        print(f"[DB ERROR] get_user_by_uid: {e}")
        return None


async def create_user(
    db: AsyncSession,
    uid: str,
    email: str,
    email_verified: bool,
    nickname: Optional[str],
) -> Optional[models.User]:
    try:
        db_user = models.User(
            uid=uid,
            email=email,
            email_verified=email_verified,
            nickname=nickname,
            last_login_at=now_jst(),
            login_count=1,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except SQLAlchemyError as e:
        await db.rollback()
        print(f"[DB ERROR] create_user: {e}")
        return None


async def update_login_info(
    db: AsyncSession, user: models.User
) -> Optional[models.User]:
    try:
        user.last_login_at = now_jst()
        user.login_count += 1
        await db.commit()
        await db.refresh(user)
        return user
    except SQLAlchemyError as e:
        await db.rollback()
        print(f"[DB ERROR] update_login_info: {e}")
        return None


# 初回ログインかどうかを判定し、
# 既存ユーザーであればログイン情報を更新し、新規ユーザーであれば登録する
async def get_or_create_user(
    db: AsyncSession,
    uid: str,
    email: str,
    email_verified: bool,
    nickname: Optional[str],
) -> Optional[models.User]:
    user = await get_user_by_uid(db, uid)
    if user:
        return await update_login_info(db, user)
    return await create_user(db, uid, email, email_verified, nickname)
