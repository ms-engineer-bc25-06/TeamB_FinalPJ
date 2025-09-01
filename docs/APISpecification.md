# API仕様書

## SwaggerUI

**詳細なAPI仕様はSwaggerUIで確認できます：**
```
http://localhost:8000/docs
```

## 主要APIエンドポイント

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

## API テスト方法

### Swagger UI でのテスト
- ブラウザで http://localhost:8000/docs にアクセス
- テストしたい API をクリックして展開
- 「Try it out」ボタンを押し、必要な情報を入力
- 「Execute」ボタンを押して API を実行

### curl でのテスト例

```bash
# 感情カード一覧取得
curl -X GET http://localhost:8000/emotion/cards

# 音声アップロードURL取得
curl -X POST http://localhost:8000/api/v1/voice/get-upload-url \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"file_type":"audio","file_format":"webm"}'

# ファイルアップロード
curl -X PUT "<upload_url>" \
  -H "Content-Type: audio/webm" \
  --data-binary "@path/to/file.webm"
```

⚠️ Content-Type を忘れると失敗するので注意！