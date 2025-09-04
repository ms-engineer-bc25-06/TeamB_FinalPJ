# ⚡️ Backend セットアップ (FastAPI + PostgreSQL)

> **このREADMEの使い方**: バックエンドの開発環境構築やセットアップ手順を確認したい時に参照してください。FastAPI開発の開始時に使用します。

この README では `backend` ディレクトリで必要なセットアップ手順をまとめています。

## 🚀 TL;DR（最短クイックスタート）

> **⚡ すぐに始めたい方はこちら！**
> 
> ```bash
> cd backend
> cp .env.example .env  # 環境変数を設定
> docker compose up --build -d
> docker compose exec backend alembic upgrade head
> # http://localhost:8000/docs でAPI確認
> ```
> 
> これだけでバックエンドが起動します！

## 📋 前提条件 / 必要ツール

### 必須ツール
- **Docker**: v20.10.0 以降
- **Docker Compose**: v2.0.0 以降
- **Python**: 3.11（Dockerfileで指定）
- **PostgreSQL**: 17.5（compose.yamlで指定）
- **Git**: 最新版

### 推奨ツール
- **VSCode**: DevContainer拡張機能付き
- **Stripe CLI**: 決済機能テスト用

### システム要件
- **メモリ**: 4GB以上
- **ディスク**: 2GB以上の空き容量

## 🔐 環境変数（.env）

> **設定方法**: `.env.example`をコピーして`.env`を作成し、Notion㊙️ページの値を設定してください。

## 🔧 セットアップ手順

### 初回セットアップ

1. **Firebase サービスアカウントキーの配置**
   - Notion からダウンロードした JSON ファイルを `backend/firebase-service-account.json` に配置

2. **環境変数ファイル設定**
   - `.env.example` をコピーして `.env` を作成
   - 環境変数を設定

3. **待機スクリプトに実行権限付与（初回のみ）**
   ```bash
   chmod +x wait-for-db.sh
   ```

### 起動手順

4. **Docker コンテナ起動**
   ```bash
   docker compose up --build -d
   ```

5. **マイグレーション適用（初回 or モデル更新時）**
   ```bash
   docker compose exec backend alembic upgrade head
   docker compose exec backend alembic current
   ```

6. **DevContainer 使用時（推奨）**
   `.devcontainer/devcontainer.json` により自動セットアップ

   **初回セットアップ手順**
   1. VSCode 拡張「Dev Containers」をインストール
   2. プロジェクトを VSCode で開く
   3. 左下の緑色のボタン 🟢 から「Reopen in Container」を選択
   4. 自動的にコンテナがビルドされ、開発環境がセットアップされる

7. **DevContainer 未使用時**
   ```bash
   docker compose exec backend pip install -r requirements-dev.txt
   docker compose exec backend black app
   docker compose exec backend pylint app
   ```

8. **Stripe Webhook 設定**
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
   ```

### 動作確認

9. **動作確認**
   - `docker compose ps` でコンテナの状態確認
   - ブラウザで http://localhost:8000/docs を開き Swagger UI で API をテスト

## 🛠️ 開発ワークフロー

### DevContainer使用時
```bash
# コンテナ内で開発
docker compose exec backend bash
# 自動でblack、pylintが有効
```

### Lint・フォーマット
```bash
# コード整形
docker compose exec backend black app

# Lint実行
docker compose exec backend pylint app

# 型チェック
docker compose exec backend mypy app
```

### テスト実行
```bash
# 全テスト実行
docker compose exec backend python -m pytest

# 特定テスト実行
docker compose exec backend python -m pytest tests/test_api.py
```

### データベース操作
```bash
# マイグレーション作成
docker compose exec backend alembic revision --autogenerate -m "説明"

# マイグレーション適用
docker compose exec backend alembic upgrade head

# 初期データ投入
docker compose exec backend python seed_db.py
```

## 📊 運用ポイント

### Health Check
- **API Health**: `GET /health` エンドポイントで確認
- **DB接続**: `GET /health/db` でデータベース接続確認

### 監視・メトリクス
- **ログ**: Docker logsで確認 `docker compose logs backend`
- **メトリクス**: 将来的に `/metrics` エンドポイントを追加予定

### バックアップ方針
- **データベース**: 日次自動バックアップ（本番環境）
- **設定ファイル**: Git管理でバージョン管理

## 🔧 トラブルシュート

### よくある問題と解決方法

1. **Dockerコンテナが起動しない**
   - ポート8000が使用中: `lsof -ti:8000 | xargs kill -9`
   - メモリ不足: Docker Desktopのメモリ設定を4GB以上に

2. **データベース接続エラー**
   - PostgreSQLコンテナの状態確認: `docker compose ps`
   - 接続文字列の確認: `.env`の`DATABASE_URL`を確認

3. **マイグレーションエラー**
   - マイグレーション履歴確認: `docker compose exec backend alembic current`
   - 手動でマイグレーション適用: `docker compose exec backend alembic upgrade head`

4. **環境変数が読み込まれない**
   - `.env`ファイルの場所確認（backendディレクトリ直下）
   - ファイル名が`.env`（拡張子なし）になっているか確認

5. **Stripe Webhookが動作しない**
   - Stripe CLIの状態確認: `stripe listen --forward-to localhost:8000/api/v1/stripe/webhook`
   - Webhook Secretの設定確認: `.env`の`STRIPE_WEBHOOK_SECRET`

6. **自動整形（Black/Pylint）が効かない**
   - **即座に試す**：
     ```bash
     # プロジェクトルートで診断スクリプト実行
     ./scripts/fix-formatting.sh
     ```
   - **VS Code設定の確認**：
     - Dev Container接続確認
     - Ctrl+Shift+P → `Python: Select Interpreter` → `/usr/local/bin/python`
     - Ctrl+Shift+P → `Python: Refresh Language Server`
   - **手動整形テスト**：
     ```bash
     # Black実行
     docker exec teamb_backend python -m black --check .
     
     # Pylint実行  
     docker exec teamb_backend python -m pylint app/
     ```
   - **開発パッケージ再インストール**：
     ```bash
     docker compose exec backend pip install -r requirements-dev.txt
     ```
   - **設定ファイル確認**：
     - `.vscode/settings.json` - 自動整形設定
     - `pyproject.toml` - Black/Pylint設定

## ⚠️ 再セットアップが必要なケース

| ケース | 再セットアップ必要？ | 理由 |
| ------ | -------------------- | ---- |
| `--build`付きで `docker compose up --build` を実行した場合 | ✅ **必要** | イメージが再生成されるため、開発パッケージが消える（`black`, `pylint`など） |
| コンテナや volume を削除した (`docker compose down -v`) | ✅ **必要** | volume ごと削除されるため、インストール済みパッケージが失われる |
| `.devcontainer/devcontainer.json` の `postCreateCommand` が何らかの理由で実行されなかった | ✅ **必要** | コマンドが失敗するとパッケージが入っていない可能性がある |
| VSCode の DevContainer 再構築時に `Rebuild Container` を選択 | ✅ **必要** | ベースイメージから再構築されるため開発パッケージが未インストール |

### 再セットアップが必要かどうかの確認方法

```bash
docker compose exec backend which black
```

- パスが表示されれば OK（例： `/usr/local/bin/black`）
- 表示されなければ再インストールが必要：
  ```bash
  docker compose exec backend pip install -r requirements-dev.txt
  ```

## 🛠️ よく使用するコマンド

```bash
# コンテナ管理
docker compose up --build -d    # コンテナ起動
docker compose down             # コンテナ停止
docker compose ps               # 状態確認
docker compose logs backend     # ログ確認

# バックエンド操作
docker compose exec backend bash           # コンテナ内でbash実行
docker compose exec backend python -m pytest  # テスト実行
docker compose exec backend alembic upgrade head  # マイグレーション
docker compose exec backend python seed_db.py    # 初期データ投入
```

## 📁 ディレクトリ構成

```
backend/
├── app/                # メインアプリケーション
│   ├── api/           # APIエンドポイント（音声処理等）
│   ├── services/      # ビジネスロジック（Whisper、S3等）
│   ├── utils/         # ユーティリティ（音声処理、エラーハンドリング等）
│   ├── models.py      # データベースモデル
│   ├── schemas.py     # Pydanticスキーマ
│   ├── crud.py        # CRUD操作
│   └── main.py        # FastAPIアプリケーション
├── migrations/         # データベースマイグレーション
├── alembic/           # Alembic設定
└── tests/             # テストファイル
```

## 🔧 API 動作確認方法

### Swagger UI での動作確認
- ブラウザで http://localhost:8000/docs にアクセス
- 確認したい API をクリックして展開
- 「Try it out」ボタンを押し、必要な情報を入力
- 「Execute」ボタンを押して API を実行

### curl での動作確認例

```bash
# 感情カード一覧取得
curl -X GET http://localhost:8000/emotion/cards

# 音声アップロードURL取得
curl -X POST http://localhost:8000/api/v1/voice/get-upload-url \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"file_type":"audio","file_format":"webm"}'
```

## 📚 関連ドキュメント

### API・開発関連
- **Swagger UI**: http://localhost:8000/docs
- **API仕様について**: [API Specification](../docs/APISpecification.md) で詳細を確認してください
- **技術スタック詳細について**: [Tech Stack](../docs/techStack.md) で詳細を確認してください

### 設計・運用関連
- **データベース設計について**: [Database Design](../docs/databaseDesign.md) で詳細を確認してください
- **セキュリティ設計について**: [Security Design](../docs/securityDesign.md) で詳細を確認してください
- **性能設計について**: [Performance Design](../docs/performanceDesign.md) で詳細を確認してください
- **運用設計について**: [Operations Plan](../docs/operationsPlan.md) で詳細を確認してください
- **開発ガイドラインについて**: [Dev Guideline](../docs/devGuideline.md) で詳細を確認してください
- **テスト設計について**: [Test Design](../docs/testDesign.md) で詳細を確認してください