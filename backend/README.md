# ⚡️ Backend セットアップ (FastAPI + PostgreSQL)

この README では `backend` ディレクトリで必要なセットアップ手順をまとめています。

## 📁 ディレクトリ構成

```
backend/
├── app/                        # メインアプリケーション
│   ├── __init__.py
│   ├── main.py                # FastAPI アプリケーションエントリーポイント
│   ├── models.py              # SQLAlchemy データベースモデル
│   ├── schemas.py             # Pydantic データバリデーションスキーマ
│   ├── crud.py                # データベース操作関数
│   ├── database.py            # データベース接続設定
│   ├── children.py            # 子供情報管理API
│   ├── emotion_api.py         # 感情API（感情カード、強度、記録）
│   ├── emotion_color_api.py   # 感情色API（色管理、透明度調整）
│   ├── stripe_api.py          # Stripe決済API
│   ├── seed_data.py           # 初期データ投入
│   ├── api/                   # APIエンドポイント
│   │   └── v1/
│   │       └── endpoints/
│   │           └── voice.py   # 音声関連API（録音、文字起こし）
│   ├── services/              # ビジネスロジック
│   │   ├── whisper.py         # Whisper音声認識サービス
│   │   ├── s3.py              # S3ファイル管理サービス
│   │   └── voice/             # 音声処理関連
│   │       ├── file_ops.py    # ファイル操作
│   │       └── transcription.py # 音声文字起こし
│   ├── utils/                  # ユーティリティ
│   │   ├── audio.py           # 音声処理ユーティリティ（FFmpeg）
│   │   ├── child_vocabulary.py # 子ども向け語彙生成
│   │   ├── constants.py       # 定数定義
│   │   ├── error_handlers.py  # エラーハンドラー
│   │   ├── prompt_loader.py   # プロンプト読み込み
│   │   └── quality.py         # 品質管理
│   └── config/                 # 設定ファイル
│       └── prompt_base.txt    # 基本プロンプト
├── migrations/                 # データベースマイグレーション
│   └── versions/              # マイグレーションファイル
├── alembic/                   # Alembic設定
│   ├── env.py                 # Alembic環境設定
│   ├── README                 # Alembic説明
│   └── script.py.mako         # マイグレーションテンプレート
├── tests/                      # テストファイル
│   └── mocks/                 # モックファイル
├── scripts/                    # 開発用スクリプト
├── postgres/                   # PostgreSQL設定
├── .devcontainer/              # DevContainer設定
├── alembic.ini                # Alembic設定
├── requirements.txt            # 本番依存関係
├── requirements-dev.txt        # 開発依存関係
├── Dockerfile                  # Dockerイメージ定義
├── compose.yaml                # Docker Compose設定
├── compose.override.yaml       # Docker Compose上書き設定
├── firebase-service-account.json # Firebase認証設定
├── seed_db.py                  # データベース初期化
└── wait-for-db.sh             # データベース起動待機スクリプト
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
