# ⚡️ Backend セットアップ (FastAPI + PostgreSQL)

> **このREADMEの使い方**: バックエンドの開発環境構築やセットアップ手順を確認したい時に参照してください。FastAPI開発の開始時に使用します。

この README では `backend` ディレクトリで必要なセットアップ手順をまとめています。

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

## 🔧 セットアップ手順

### 前提条件

1. **Firebase サービスアカウントキーの配置**
   - Notion からダウンロードした JSON ファイルを `backend/firebase-service-account.json` に配置

2. **環境変数ファイル設定**
   - `.env.example` をコピーして `.env` を作成
   - 環境変数を設定

### 起動手順

3. **待機スクリプトに実行権限付与（初回のみ）**
   ```bash
   chmod +x wait-for-db.sh
   ```

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

9. **動作確認**
   - `docker compose ps` でコンテナの状態確認
   - ブラウザで http://localhost:8000/docs を開き Swagger UI で API をテスト

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

## 📚 関連ドキュメント

### API・開発関連
- **Swagger UI**: http://localhost:8000/docs
- **API仕様について**: [API Specification](../docs/APISpecification.md) で詳細を確認してください
- **技術スタック詳細について**: [Tech Stack](../docs/techStack.md) で詳細を確認してください
- **テスト方法について**: [Test Plan](../docs/testPlan.md) で詳細を確認してください

### 設計・運用関連
- **データベース設計について**: [Database Design](../docs/databaseDesign.md) で詳細を確認してください
- **セキュリティ設計について**: [Security Design](../docs/securityDesign.md) で詳細を確認してください
- **性能設計について**: [Performance Design](../docs/performanceDesign.md) で詳細を確認してください
- **運用設計について**: [Operations Plan](../docs/operationsPlan.md) で詳細を確認してください
- **開発ガイドラインについて**: [Dev Guideline](../docs/devGuideline.md) で詳細を確認してください
