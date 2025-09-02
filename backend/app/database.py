import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL, 
    echo=os.getenv("DB_ECHO", "false").lower() == "true"  # ローカル開発時のみSQLログ出力
)

async_session_local = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)

# APIリクエストごとに新しいセッションを作り、処理終了後に自動でクローズ
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        try:
            yield session
        except Exception:
            # 例外発生時は明示的にロールバック
            await session.rollback()
            raise
        finally:
            # セッションは async_session_local() の with文で自動クローズ
            pass