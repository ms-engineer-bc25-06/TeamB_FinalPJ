# ⚡️ Backend 詳細セットアップガイド

このドキュメントでは、バックエンドの詳細なセットアップ手順を説明します。

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

## 🔧 詳細セットアップ手順

### 1. Firebase サービスアカウントキーの配置

Firebase プロジェクトからダウンロードしたサービスアカウントの秘密鍵（JSON ファイル）を、Notion の㊙️ページに掲載しておりますのでそちらをまずはダウンロードしてください。

上記ダウンロードしたファイルを`backend`ディレクトリ直下に配置し、ファイル名を`firebase-service-account.json`に変更してください。

**注意**: このファイルは`.gitignore`によって Git の管理対象外となっています。

### 2. 環境変数ファイルの設定

`backend`ディレクトリにある`.env.example`ファイルを使い、`.env`という名前のファイルを作成します。

`.env`ファイルを開き、`POSTGRES_USER`や`POSTGRES_PASSWORD`など、Notion の㊙️ページを参考に、ご自身の環境に合わせて値を設定してください。

**Stripe Webhook設定**: 以下の環境変数も設定してください：
```bash
STRIPE_WEBHOOK_SECRET=開発用スクリプト実行後に自動設定される
```

**注意**: `STRIPE_WEBHOOK_SECRET`は、開発用スクリプト実行時に自動で設定されます。手動で設定する必要はありません。

### 3. 待機スクリプトに実行権限を付与

`backend`ディレクトリに移動し、以下のコマンドを実行して、データベースの起動を待つためのシェルスクリプトに実行権限を与えます。**この手順は初回のみ必要です。**

シェルスクリプトを使用する背景は、DB が接続可能になるまで FAST API の起動を止めるためです。この設定がないと、backend（FastAPI）が起動直後に DB 接続を試みようとし、DB はまだ初期化中（テーブル作成や WAL リカバリ中）で接続できない問題が発生する可能性があります。

```bash
chmod +x wait-for-db.sh
```

### 4. backend/ に compose.override.yaml を配置

中身については Notion の㊙️ページに掲載しておりますので確認のうえ作成してください。

### 5. コンテナのビルドと起動

`backend`ディレクトリで、以下のコマンドを実行します。

```bash
docker compose up --build -d
```

`--build`は初回や`Dockerfile`に変更があった場合に必要です。`-d`はバックグラウンドで起動するオプションです。

### 6. マイグレーション適用（初回 or モデル更新時）

`backend`ディレクトリで、以下のコマンドを実行します。

```bash
docker compose exec backend alembic upgrade head
```

Alembic によって DB スキーマをコードと同期させます。

初回セットアップ時 または models.py などスキーマ変更後 のみ実行します。

**適用確認**
```bash
docker compose exec backend alembic current
```

上記コマンドを実行し、`initial migration`など、最新版のリビジョン ID が表示されれば OK。

### 7. 動作確認

`docker compose ps`コマンドを実行し、`teamb_backend`と`teamb_db`の 2 つのコンテナが`Up (healthy)`または`running`状態であることを確認します。

`docker compose exec backend alembic current`コマンドを実行し、以下の確認を行います。
- DB の状態が最新のマイグレーションファイルと一致している
- DB に適用されているマイグレーションが存在している

Web ブラウザで `http://localhost:8000/docs` にアクセスし、FastAPI の Swagger UI が表示されれば成功です。

**Swagger UI の使い方補足**:
表示されたページで、テストしたい API（例: POST /api/v1/login）をクリックして展開。「Try it out」ボタンを押し、必要な情報（ID トークンなど）を入力して「Execute」ボタンを押すと、実際に API を実行して結果を確認できます。

### 8. Stripe Webhook の設定（決済機能テスト用）

開発用スクリプトを実行済みの場合、Webhook設定は自動で完了しています。

手動で設定する場合は、別のターミナルで以下のコマンドを実行してStripe Webhookをローカル環境に転送します：

```bash
stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
```

このコマンドを実行すると、以下のような出力が表示されます：

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef1234567890abcdef1234567890abcdef
> Forwarding events to http://localhost:8000/api/v1/stripe/webhook
```

表示された`whsec_...`の文字列を`backend/.env`ファイルの`STRIPE_WEBHOOK_SECRET`に設定してください。

**重要**: このWebhook転送は、ローカル開発環境での決済機能テストに必要です。

**推奨**: 開発用スクリプトを使用することで、これらの設定が自動化されます。

## 🐳 DevContainer 詳細ガイド

### DevContainer を使用する場合の整形・Lint 実行方法

`.devcontainer/devcontainer.json` により、**DevContainer 初回起動時に自動で以下のコマンドが実行されます**：

```bash
pip install -r requirements-dev.txt
```

VSCode 側では `.devcontainer/devcontainer.json` により以下の設定が自動で適用されます：

- 保存時に自動で `black` による整形が実行される
- `pylint` による Lint が有効になる

### 初回セットアップ手順

1. VSCode 拡張「Dev Containers」をインストールする
2. プロジェクトを VSCode で開く
3. 左下の緑色のボタン 🟢 から「Reopen in Container」を選ぶ
4. 自動的にコンテナがビルドされ、開発環境（black, pylint など）がセットアップされます

> 💡 初回ビルドには 5〜10 分かかることがあります。2 回目以降は高速に起動します。

### Dev Container を使用しない場合の整形・Lint 実行方法

```bash
docker compose exec backend pip install -r requirements-dev.txt
```

開発中に 1 回実行すれば OK です（本番環境や CI では使用されません）

その後、整形や Lint は以下のように実行できます：

```bash
docker compose exec backend black app
docker compose exec backend pylint app
```

`app`：整形対象ディレクトリ（例：`app schemas utils` など複数指定も OK）

Python（3.10 以降）がローカルにインストールされている場合は、以下でも整形可能です。

```bash
pip install -r backend/requirements-dev.txt
cd backend
black app
```

## ⚠️ 再セットアップが必要になるケース

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

## 🗄️ S3 連携の詳細

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

## 🛠️ 利用可能なコマンド

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

## 📚 技術スタック詳細

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

## 🔧 開発環境

- **Python**: 3.11-slim
- **PostgreSQL**: 17.5-alpine
- **Docker**: コンテナ化環境
