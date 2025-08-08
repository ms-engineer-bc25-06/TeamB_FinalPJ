import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.seed_data import run_seeds

load_dotenv()

async def main():
    """メイン関数"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URLが設定されていません")
        return
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    async with async_session_local() as session:
        try:
            await run_seeds(session)
        except Exception as e:
            print(f"❌ シード実行中にエラーが発生しました: {e}")
            await session.rollback()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
