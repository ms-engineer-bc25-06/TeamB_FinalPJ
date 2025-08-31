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
│   ├── children.py            # 子供情報管理
│   ├── emotion_api.py         # 感情API
│   ├── emotion_color_api.py   # 感情色API
│   ├── emotion_logs_service.py # 感情ログサービス
│   ├── stripe_api.py          # Stripe決済API
│   ├── api/                   # APIエンドポイント
│   │   └── v1/
│   │       └── endpoints/
│   │           └── voice.py   # 音声関連API
│   ├── services/              # ビジネスロジック
│   │   ├── emotion_logs/      # 感情ログサービス
│   │   ├── s3.py              # S3ファイル管理
│   │   ├── voice/             # 音声処理
│   │   │   ├── file_ops.py    # ファイル操作
│   │   │   └── transcription.py # 音声文字起こし
│   │   └── whisper.py         # Whisper音声認識
│   ├── utils/                  # ユーティリティ
│   │   ├── audio.py           # 音声処理ユーティリティ
│   │   ├── constants.py       # 定数定義
│   │   ├── error_handlers.py  # エラーハンドラー
│   │   ├── prompt_loader.py   # プロンプト読み込み
│   │   └── quality.py         # 品質管理
│   └── config/                 # 設定ファイル
│       └── prompt_base.txt    # 基本プロンプト
├── migrations/                 # データベースマイグレーション
│   └── versions/              # マイグレーションファイル
├── tests/                      # テストファイル
│   ├── unit/                  # ユニットテスト
│   └── integration/           # 統合テスト
├── alembic.ini                # Alembic設定
├── requirements.txt            # 本番依存関係
├── requirements-dev.txt        # 開発依存関係
├── Dockerfile                  # Dockerイメージ定義
├── compose.yaml                # Docker Compose設定
└── wait-for-db.sh             # データベース起動待機スクリプト
```

## 1. Firebase サービスアカウントキーの配置

- Notion からダウンロードした JSON ファイルを `backend/firebase-service-account.json` に配置

## 2. 環境変数ファイル設定

- `.env.example` をコピーして `.env` を作成
- Postgres や Stripe Webhook などの環境変数を設定

## 3. 待機スクリプトに実行権限付与（初回のみ）

```bash
chmod +x wait-for-db.sh
```

## 4. Docker コンテナ起動

```bash
docker compose up --build -d
```

## 5. マイグレーション適用（初回 or モデル更新時）

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
```

## 6. DevContainer 使用時（推奨）

`.devcontainer/devcontainer.json` により自動セットアップ

### DevContainer の利点
- チーム全体で共通の開発環境（パッケージ、フォーマッターなど）
- 保存時整形や import 整理などをローカルに依存せず実行
- 初回起動時に自動で以下のコマンドが実行される：
  ```bash
  pip install -r requirements-dev.txt
  ```

### VSCode での自動設定
- 保存時に自動で `black` による整形が実行される
- `pylint` による Lint が有効になる

### 初回セットアップ手順
1. VSCode 拡張「Dev Containers」をインストール
2. プロジェクトを VSCode で開く
3. 左下の緑色のボタン 🟢 から「Reopen in Container」を選択
4. 自動的にコンテナがビルドされ、開発環境がセットアップされる

> 💡 初回ビルドには 5〜10 分かかることがあります。2 回目以降は高速に起動します。

## 7. DevContainer 未使用時

```bash
docker compose exec backend pip install -r requirements-dev.txt
docker compose exec backend black app
docker compose exec backend pylint app
```

## 8. Stripe Webhook 設定

```bash
stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
```

## 9. 動作確認

- `docker compose ps` でコンテナの状態確認
- ブラウザで http://localhost:8000/docs を開き Swagger UI で API をテスト

## 10. 技術スタック詳細

### フレームワーク・ライブラリ
- **FastAPI**: 0.111.0
- **Uvicorn**: 0.35.0 (ASGIサーバー)
- **SQLAlchemy**: 2.0.42 (ORM)
- **Pydantic**: 2.7.4 (データバリデーション)
- **PostgreSQL**: 17.5-alpine (データベース)

### AI・音声処理
- **OpenAI Whisper**: 20231117 (音声認識)
- **PyTorch**: 2.1.0 (CPU版)
- **FFmpeg**: 音声処理
- **Pydub**: 0.25.1 (音声操作)

### 外部サービス連携
- **Firebase Admin**: 7.1.0 (認証)
- **AWS S3 (boto3)**: 1.34.0 (ファイルストレージ)
- **Stripe**: 12.4.0 (決済)

## 11. 開発環境

- **Python**: 3.11-slim
- **PostgreSQL**: 17.5-alpine
- **Docker**: コンテナ化環境

## 12. 利用可能なコマンド

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
```

## 13. 再セットアップが必要なケース

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

## 14. S3 連携の詳細

### 概要
- 音声・テキストファイルは S3 に保存
- S3 へのパスは DB に保存
- サーバーはファイルを保持しない構成
- **対応形式**: WebM, WAV, MP3 (音声), TXT (テキスト)
- **セキュリティ**: Presigned URL による安全なアップロード
- **スケーラビリティ**: S3 直接アップロードによるサーバー負荷軽減

### API テスト方法

#### curl でのテスト

```bash
# URL取得
curl -X POST http://localhost:8000/voice/get-upload-url \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"file_type":"audio","file_format":"webm"}'

# ファイルアップロード
curl -X PUT "<upload_url>" \
  -H "Content-Type: audio/webm" \
  --data-binary "@path/to/file.webm"
```

⚠️ Content-Type を忘れると失敗するので注意！
