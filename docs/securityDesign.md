# セキュリティ設計書

## 目的

本ドキュメントは、感情教育アプリ『きもちみっけ！』のセキュリティ設計について定義する。アプリケーションの機密性、完全性、可用性を確保し、ユーザーデータとシステムの保護を実現する。

## このドキュメントの使い方

セキュリティ要件や対策を確認したい時に参照してください。認証・認可の実装やセキュリティ監査に使用します。

## 1. 概要

### 1.2 対象システム
- フロントエンド: Next.js (TypeScript)
- バックエンド: FastAPI (Python)
- データベース: PostgreSQL
- 認証: Firebase Authentication
- ストレージ: AWS S3
- コンテナ: Docker

---

## 2. 現在実装済みのセキュリティ機能

### 2.1 認証・認可 

#### 2.1.1 Firebase Authentication
- **詳細**: Google OAuth2.0認証によるユーザー認証
- **実装箇所**: 
  - フロントエンド: `frontend/src/contexts/AuthContext.tsx`
  - バックエンド: `backend/app/main.py` (login endpoint)

#### 2.1.2 IDトークン検証

- **詳細**: Firebase Admin SDKによるIDトークンの検証
- **実装箇所**: `backend/app/main.py` の `login` 関数

### 2.2 API セキュリティ

#### 2.2.1 CORS設定
- **詳細**: 開発環境用のCORS設定
- **実装箇所**: `backend/app/main.py`
```python
origins = [
    "http://localhost:3000",
    # TODO:本番用ドメインを後で追加,
]
```

#### 2.2.2 入力値検証
- **詳細**: Pydanticモデルによる型安全性確保
- **実装箇所**: `backend/app/voice_api.py` の `UploadRequest`, `SaveRecordRequest`

#### 2.2.3 エラーハンドリング
- **詳細**: 適切なHTTPステータスコードとエラーメッセージ
- **実装箇所**: 各APIエンドポイント

### 2.3 データベースセキュリティ 

#### 2.3.1 環境変数管理
- **詳細**: 環境変数によるデータベース接続情報管理
- **実装箇所**: `backend/.env` ファイル

#### 2.3.2 SQLAlchemy ORM
- **詳細**: SQLインジェクション対策
- **実装箇所**: `backend/app/models.py`, `backend/app/crud.py`

### 2.4 ファイルアップロードセキュリティ 

#### 2.4.1 S3署名付きURL（Presigned URL）
- **詳細**: 一時的なアクセス権限付与（1時間有効期限）
- **セキュリティ効果**: 
  - サーバーを経由せずに直接S3にアップロード
  - 一時的な権限により、権限の最小化を実現
  - サーバーの負荷軽減とセキュリティ向上
- **実装箇所**: `backend/app/s3_service.py`

#### 2.4.2 ファイルパス分離
- **詳細**: ユーザー固有のファイルパス生成
- **セキュリティ効果**: 
  - ユーザー間のファイルアクセス分離
  - パス推測攻撃の防止
- **実装箇所**: `backend/app/voice_api.py`
```python
file_path = f"audio/{request.user_id}/audio_{timestamp}_{unique_id}.{file_extension}"
```

#### 2.4.3 ファイル形式制限
- **詳細**: 音声ファイル形式の制限（webm, wav, mp3）
- **セキュリティ効果**: 
  - 悪意のあるファイルのアップロード防止
  - システムの安定性確保
- **実装箇所**: `backend/app/voice_api.py`

#### 2.4.4 S3バケットポリシー
- **詳細**: 適切なバケットポリシーによるアクセス制御
- **セキュリティ効果**: 
  - 公開アクセスの制限
  - 暗号化の強制
  - バージョニングによるデータ保護

### 2.5 環境変数・シークレット管理 

#### 2.5.1 .gitignore設定
- **詳細**: 機密ファイルのGit管理除外
- **実装箇所**: `.gitignore`
```
.env
.env.*
backend/firebase-service-account.json
```

### 2.6 決済セキュリティ

#### 2.6.1 Stripe Webhook署名検証
- **詳細**: Webhook通知の正当性を検証し、なりすまし攻撃を防止
- **実装箇所**: `backend/app/stripe_api.py` のWebhookエンドポイント
- **セキュリティ機能**: HMAC-SHA256署名による検証

#### 2.6.2 Stripe環境変数の自動管理
- **詳細**: 開発用スクリプトによるWebhook Secretの自動設定
- **実装箇所**: `scripts/dev-setup.sh`, `scripts/dev-setup.bat`
- **セキュリティ効果**: 手動設定による設定ミスの防止

### 2.7 インフラストラクチャセキュリティ 

#### 2.7.1 Docker設定
- **詳細**: 基本的なDocker設定
- **実装箇所**: `backend/Dockerfile`, `backend/compose.yaml`

#### 2.7.2 データベースヘルスチェック
- **詳細**: PostgreSQLのヘルスチェック機能
- **実装箇所**: `backend/compose.yaml`

---

## 3. 今後実装が必要な最低限のセキュリティ項目

### 3.1 認可制御の実装 

#### 3.1.1 ユーザー固有データの保護
- **優先度**: 高
- **詳細**: ユーザーが自分のデータのみアクセスできるようにする
- **実装方法**: 
  - リクエストのユーザーIDとトークンのユーザーIDを比較
  - 一致しない場合はアクセス拒否
- **影響箇所**: `backend/app/voice_api.py` の各エンドポイント


### 3.2 ファイルサイズ制限 

#### 3.2.1 アップロードファイルサイズの制限
- **優先度**: 高
- **詳細**: 大きなファイルのアップロードを防ぐ
- **実装方法**: 
  - フロントエンドとバックエンドの両方でサイズチェック
  - 最大サイズ（例：10MB）を設定
- **影響箇所**: `backend/app/voice_api.py`, `frontend/src/`

**実装例**:
```python
# ファイルサイズ制限（10MB）
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

if file_size > MAX_FILE_SIZE:
    raise HTTPException(status_code=400, detail="File too large")
```

### 3.3 本番環境用CORS設定 

#### 3.3.1 本番環境のドメイン制限
- **優先度**: 高
- **詳細**: 本番環境では許可されたドメインのみアクセス可能にする
- **実装方法**: 
  - 環境変数で本番ドメインを指定
  - 開発環境と本番環境で異なる設定
- **影響箇所**: `backend/app/main.py`

**実装例**:
```python
# 環境に応じたCORS設定
if os.getenv("ENVIRONMENT") == "production":
    origins = [
        "https://yourdomain.com",
        "https://www.yourdomain.com"
    ]
else:
    origins = ["http://localhost:3000"]
```

### 3.4 基本的なログ機能 

#### 3.4.1 セキュリティイベントの記録
- **優先度**: 中
- **詳細**: 重要なセキュリティイベントをログに記録
- **実装方法**: 
  - ログイン試行の記録
  - エラーの記録
  - ファイルアップロードの記録
- **影響箇所**: `backend/app/main.py`, `backend/app/voice_api.py`

**実装例**:
```python
import logging

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ログ出力例
logger.info(f"User {user_id} uploaded file: {file_path}")
logger.warning(f"Failed login attempt for user: {email}")
```

## 4. S3連携のセキュリティ詳細

### 4.1 Presigned URLの仕組み
- **有効期限**: 1時間（3600秒）
- **権限**: 特定のファイルへのPUT操作のみ
- **セキュリティ効果**: 
  - 一時的な権限により、権限の最小化を実現
  - サーバーを経由せずに直接S3にアップロード
  - サーバーの負荷軽減とセキュリティ向上

### 4.2 ファイルパス設計
- **形式**: `{bucket}/{user_id}/{file_type}_{timestamp}_{unique_id}.{extension}`
- **セキュリティ効果**: 
  - ユーザー間のファイルアクセス分離
  - タイムスタンプとユニークIDによる推測困難性
  - ファイル名からの情報漏洩防止

### 4.3 暗号化
- **転送時暗号化**: HTTPS/TLSによる通信暗号化
- **保存時暗号化**: S3のサーバーサイド暗号化（SSE-S3）
- **セキュリティ効果**: 
  - 通信経路でのデータ漏洩防止
  - 保存データの暗号化による保護

## 5. 実装優先度

### 5.1 最優先
- [ ] **認可制御の実装** - ユーザー固有データの保護
- [ ] **ファイルサイズ制限** - 大きなファイルのアップロード防止
- [ ] **本番環境用CORS設定** - 本番環境のドメイン制限

### 5.2 中優先度
- [ ] **基本的なログ機能** - セキュリティイベントの記録


---

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - 基本的なセキュリティ脅威
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/) - FastAPIのセキュリティ機能
- [Firebase Security](https://firebase.google.com/docs/auth) - Firebase認証の詳細

