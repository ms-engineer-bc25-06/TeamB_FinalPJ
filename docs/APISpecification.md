# API 仕様書

## 目的

本ドキュメントは、感情教育アプリ『きもちみっけ！』の API 仕様を明確に定義し、フロントエンドとバックエンドの開発チームが効率的に API 連携を実装できるようにすることを目的としています。

## このドキュメントの使い方

API の詳細仕様やエンドポイントを確認したい時に参照してください。

## SwaggerUI

**詳細な API 仕様は SwaggerUI で確認できます：**

```
{NEXT_PUBLIC_API_BASE_URL}/docs
```

## 主要 API エンドポイント

### 認証 API

- `POST /api/v1/auth/login` - Firebase 認証によるログイン

### 感情関連 API

- `GET /emotion/cards` - 感情カード一覧取得
- `GET /emotion/intensities` - 強度一覧取得
- `POST /emotion/logs` - 感情記録作成
- `GET /emotion/logs/list` - 感情ログ一覧取得
- `GET /emotion/logs/daily/{date}` - 感情ログ取得

### 感情色 API

- `GET /emotion/colors/cards` - 感情カード色情報取得
- `GET /emotion/colors/intensities` - 強度色調整情報取得
- `GET /emotion/colors/combinations/{emotion_id}/{intensity_id}` - 色組み合わせ計算

### 音声処理 API

- `GET /voice/health` - 音声 API ヘルスチェック
- `POST /voice/get-upload-url` - S3 アップロード URL 取得
- `POST /voice/transcribe` - 音声文字起こし実行
- `POST /voice/save-record` - 音声記録保存
- `GET /voice/files/{user_id}` - ユーザー音声ファイル一覧取得

### 子ども管理 API

- `POST /children` - 子どもプロフィール作成
- `GET /children` - 子どもプロフィール一覧取得
- `GET /children/count` - 子ども人数取得
- `PUT /children/{child_id}` - 子どもプロフィール更新

### 決済 API

- `POST /api/v1/stripe/checkout-session` - Stripe Checkout セッション作成
- `POST /api/v1/stripe/session-status` - 決済状態確認
- `POST /api/v1/stripe/webhook` - Stripe Webhook 受信
- `GET /api/v1/stripe/subscription-status` - サブスクリプション状態確認
- `POST /api/v1/stripe/cancel-subscription` - サブスクリプション解約

## API テスト方法

### Swagger UI でのテスト

- ブラウザで `{NEXT_PUBLIC_API_BASE_URL}/docs` にアクセス
- テストしたい API をクリックして展開
- 「Try it out」ボタンを押し、必要な情報を入力
- 「Execute」ボタンを押して API を実行

### curl でのテスト例

```bash
# 認証（Firebase ID Tokenが必要）
curl -X POST ${NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id_token":"your_firebase_id_token"}'

# 感情カード一覧取得
curl -X GET ${NEXT_PUBLIC_API_BASE_URL}/emotion/cards \
  -H "Authorization: Bearer your_firebase_id_token"

# 音声アップロードURL取得
curl -X POST ${NEXT_PUBLIC_API_BASE_URL}/voice/get-upload-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_firebase_id_token" \
  -d '{"user_id":"uuid","file_type":"audio","file_format":"webm"}'

# 音声文字起こし実行
curl -X POST ${NEXT_PUBLIC_API_BASE_URL}/voice/transcribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_firebase_id_token" \
  -d '{"audio_file_path":"audio/uuid/audio_20241201_143022_abc123.webm"}'

# 感情記録作成
curl -X POST ${NEXT_PUBLIC_API_BASE_URL}/emotion/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_firebase_id_token" \
  -d '{"child_id":"uuid","emotion_card_id":"uuid","intensity_id":1}'

# Stripe Checkoutセッション作成
curl -X POST ${NEXT_PUBLIC_API_BASE_URL}/api/v1/stripe/checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_firebase_id_token" \
  -d '{"price_id":"price_xxx","success_url":"https://example.com/success"}'
```

⚠️ 注意事項：

- 認証が必要な API には Firebase ID Token が必要
- Content-Type を忘れると失敗するので注意
- 音声ファイルは S3 に直接アップロード（Presigned URL 使用）
- `NEXT_PUBLIC_API_BASE_URL` は環境変数ファイルに記載してあります。
