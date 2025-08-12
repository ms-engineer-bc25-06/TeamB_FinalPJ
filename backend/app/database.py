import os
from typing import AsyncGenerator
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# .envファイルの環境変数を読み込む
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# DBへの接続を管理するエンジンを作成
engine = create_async_engine(DATABASE_URL, echo=True)

# DB操作のための「セッション」を作成
async_session_local = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)

# APIリクエストごとに新しいセッションを作り、処理終了後に自動でクローズ
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_local() as session:
        yield session