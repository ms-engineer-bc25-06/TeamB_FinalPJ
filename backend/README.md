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

## 10. 主要APIエンドポイント

### 感情関連API
- `GET /emotion/cards` - 感情カード一覧取得
- `GET /emotion/intensities` - 強度一覧取得
- `POST /emotion/logs` - 感情記録作成
- `GET /emotion/logs/list` - 感情ログ一覧取得
- `GET /emotion/logs/monthly/{year}/{month}` - 月次感情ログ取得

### 感情色API
- `GET /emotion/colors/cards` - 感情カード色情報取得
- `GET /emotion/colors/intensities` - 強度色調整情報取得
- `GET /emotion/colors/combinations/{emotion_id}/{intensity_id}` - 色組み合わせ計算

### 音声処理API
- `POST /api/v1/voice/get-upload-url` - S3アップロードURL取得
- `POST /api/v1/voice/transcribe` - 音声文字起こし実行

### 決済API
- `POST /api/v1/stripe/checkout-session` - Stripe Checkoutセッション作成
- `POST /api/v1/stripe/session-status` - 決済状態確認

詳細なAPI仕様は [API Specification](../docs/APISpecification.md) を参照してください。

## 11. 技術スタック詳細

### フレームワーク・ライブラリ
- **FastAPI**: 0.111.0
- **Uvicorn**: 0.35.0 (ASGIサーバー)
- **SQLAlchemy**: 2.0.42 (ORM)
- **Pydantic**: 2.7.4 (データバリデーション)
- **PostgreSQL**: 17.5-alpine (データベース)
- **Alembic**: データベースマイグレーション

### AI・音声処理
- **OpenAI Whisper**: 20231117 (音声認識)
- **PyTorch**: 2.1.0 (CPU版)
- **FFmpeg**: 音声処理（16kHz/モノラル変換）
- **Pydub**: 0.25.1 (音声操作)

### 外部サービス連携
- **Firebase Admin**: 7.1.0 (認証)
- **AWS S3 (boto3)**: 1.34.0 (ファイルストレージ)
- **Stripe**: 12.4.0 (決済)

## 12. 開発環境

- **Python**: 3.11-slim
- **PostgreSQL**: 17.5-alpine
- **Docker**: コンテナ化環境

## 13. 利用可能なコマンド

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

## 14. データベース設計

### 主要テーブル
- `users` - ユーザー情報（Firebase認証連携）
- `children` - 子どもプロフィール
- `emotion_cards` - 感情カードマスタ（13種類）
- `intensity` - 強度マスタ（3段階）
- `emotion_logs` - 感情記録（音声ファイルパス含む）
- `daily_reports` - 日次レポート
- `weekly_reports` - 週次レポート
- `subscriptions` - サブスクリプション情報

### 音声処理フロー
1. **音声録音** → フロントエンドでWebM形式で録音
2. **S3アップロード** → Presigned URLで安全にアップロード
3. **音声正規化** → FFmpegで16kHz/モノラル/16bitに変換
4. **Whisper処理** → PyTorch環境で音声認識実行
5. **テキスト保存** → 認識結果をデータベースに保存

詳細なデータベース設計は [Database Design](../docs/databaseDesign.md) を参照してください。

## 15. 再セットアップが必要なケース

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

## 16. S3 連携の詳細

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

性能設計の詳細は [Performance Design](../docs/performanceDesign.md) を、セキュリティ設計の詳細は [Security Design](../docs/securityDesign.md) を参照してください。
