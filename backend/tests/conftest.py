import pytest
import asyncio
import os
import subprocess
from pathlib import Path
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import event
from app.main import app
from app.database import get_db
from app.models import Base

# テスト用PostgreSQLデータベースURL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:password@db:5432/test_teamb_db"

# テスト用非同期データベースエンジン
# CI環境では無効、ローカルでは環境変数で制御
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=os.getenv("TEST_DB_ECHO", "false").lower() == "true",  
)

def restart_savepoint(sess, transaction):
    """session.commit()でSAVEPOINTが消えた場合の自動再作成
    
    Args:
        sess: SQLAlchemy session
        transaction: 終了したトランザクション
    """
    if transaction.nested and not transaction._parent.nested:
        # 非同期接続の同期版でSAVEPOINTを再作成
        sess.get_bind().sync_connection.begin_nested()

@pytest.fixture(scope="session")
def event_loop():
    """イベントループのフィクスチャ"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

def run_alembic_upgrade():
    """Alembic upgrade head を実行してスキーマを最新に更新"""
    # プロジェクトルートディレクトリを取得
    backend_dir = Path(__file__).parent.parent
    
    # 環境変数でテスト用データベースURLを設定
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    
    try:
        # Alembic upgrade head を実行
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=backend_dir,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Alembic upgrade completed: {result.stdout}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Alembic upgrade failed: {e.stderr}")
        raise

def run_alembic_downgrade():
    """Alembic downgrade base を実行してスキーマを削除"""
    backend_dir = Path(__file__).parent.parent
    
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    
    try:
        result = subprocess.run(
            ["alembic", "downgrade", "base"],
            cwd=backend_dir,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Alembic downgrade completed: {result.stdout}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Alembic downgrade failed: {e.stderr}")
        # downgradeの失敗は警告レベル（テスト環境の初期化なので）
        print("⚠️ Downgrade failure ignored for test cleanup")

@pytest.fixture(scope="session", autouse=True)
async def setup_test_database():
    """テストセッション開始時にAlembicでスキーマ作成、終了時に削除とクリーンアップ"""
    # Alembic upgrade head でテスト用スキーマを作成
    run_alembic_upgrade()
    
    yield  # テスト実行
    
    # Alembic downgrade base でスキーマを削除
    run_alembic_downgrade()
    
    # 接続プールを完全にクリーンアップ（ポート握りっぱなし防止）
    await test_engine.dispose()

@pytest.fixture(scope="function")
async def db_session():
    """接続レベルトランザクション + SAVEPOINTによる非同期データベースセッションのフィクスチャ"""
    # 接続を直接取得
    conn = await test_engine.connect()
    
    try:
        # 明示的にトランザクション開始
        trans = await conn.begin()
        
        try:
            # この接続にバインドしたセッションを作成（本番環境と同じ設定）
            session = AsyncSession(
                bind=conn, 
                expire_on_commit=False,  # テスト用：オブジェクト再読み込み回避
                autocommit=False,        # 本番環境と同じ
                autoflush=False          # 本番環境と同じ
            )
            
            # SAVEPOINTを作成（ネストトランザクション）
            nested_trans = await conn.begin_nested()
            
            # SAVEPOINTの自動再作成リスナーを設定
            event.listens_for(session.sync_session, "after_transaction_end")(restart_savepoint)
            
            try:
                yield session
            finally:
                # イベントリスナーを削除（メモリリーク防止）
                event.remove(session.sync_session, "after_transaction_end", restart_savepoint)
                
                # テスト終了時にSAVEPOINTまでロールバック
                await nested_trans.rollback()
                await session.close()
        finally:
            # 外側のトランザクションを明示的にロールバック
            await trans.rollback()
    finally:
        # 接続を閉じる
        await conn.close()

@pytest.fixture(scope="function")
async def client(db_session):
    """テスト用HTTPクライアントのフィクスチャ"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()

@pytest.fixture
def mock_settings(monkeypatch):
    """モック設定のフィクスチャ（monkeypatchで安全な環境変数設定）"""
    # テスト用環境変数を設定（自動クリーンアップ付き）
    monkeypatch.setenv("DATABASE_URL", TEST_DATABASE_URL)
    monkeypatch.setenv("FIREBASE_CREDENTIALS", "mock_credentials")
    monkeypatch.setenv("STRIPE_SECRET_KEY", "sk_test_mock")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "mock_access_key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "mock_secret_key")
    monkeypatch.setenv("S3_BUCKET_NAME", "test-bucket")
    
    # 将来的にget_settings関数が導入された場合の対応
    # @lru_cache回避のための関数差し替えパターン
    def mock_get_settings():
        """テスト用設定を返すモック関数"""
        return {
            "database_url": TEST_DATABASE_URL,
            "firebase_credentials": "mock_credentials", 
            "stripe_secret_key": "sk_test_mock",
            "aws_access_key_id": "mock_access_key",
            "aws_secret_access_key": "mock_secret_key",
            "s3_bucket_name": "test-bucket",
        }
    
    # 設定関数が存在する場合は差し替え（現在は未使用だが将来対応）
    try:
        from app.config.settings import get_settings
        # monkeypatch.setattr による関数差し替え（@lru_cache回避）
        monkeypatch.setattr("app.config.settings.get_settings", mock_get_settings)
        
        # FastAPI dependency_overrides による差し替えも可能
        # app.dependency_overrides[get_settings] = lambda: mock_get_settings()
    except ImportError:
        # get_settings関数が存在しない場合はスキップ
        pass
    
    # テスト用環境変数が設定されたことを確認するため、DATABASE_URLを返す
    return TEST_DATABASE_URL 