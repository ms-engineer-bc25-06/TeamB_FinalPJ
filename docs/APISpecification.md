# API仕様書

## 概要

TeamB音声変換アプリケーションのAPI仕様書です。

## SwaggerUI

**詳細なAPI仕様はSwaggerUIで確認できます：**
```
http://localhost:8000/docs
```

---

## 主要エンドポイント

### 1. ユーザー認証
```
POST /api/v1/login
```
Firebase IDトークンを使用したユーザー認証

### 2. 音声ファイル管理
```
POST /voice/get-upload-url    # アップロード用URL取得
POST /voice/save-record       # ファイルパス保存
GET  /voice/records/{user_id} # 記録一覧取得
```

---

## 使用フロー

### 1. 音声ファイルのアップロード
```javascript
// 1. アップロードURLを取得
const response = await fetch('/voice/get-upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    user_id: 1, 
    file_type: 'audio',
    file_format: 'webm'
  })
});

const { upload_url, content_type } = await response.json();

// 2. MediaRecorderで録音
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
});

mediaRecorder.ondataavailable = async (event) => {
  const audioBlob = event.data;
  
  // 3. 直接S3にアップロード
  await fetch(upload_url, {
    method: 'PUT',
    body: audioBlob,
    headers: { 'Content-Type': content_type }
  });
};
```

### 2. ファイルパスの保存
```javascript
// 4. ファイルパスをDBに保存
await fetch('/voice/save-record', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 1,
    audio_file_path: 's3://bucket-name/audio/1/audio_20241201_143022_abc123.webm'
  })
});
```

### 3. ファイル一覧の取得
```javascript
// 5. ファイル一覧を取得
const records = await fetch('/voice/records/1');
const { records } = await records.json();
```

---

## ファイルパス形式

### 音声ファイル
```
s3://{bucket-name}/audio/{user_id}/audio_{YYYYMMDD}_{HHMMSS}_{unique_id}.webm
```

### テキストファイル
```
s3://{bucket-name}/text/{user_id}/text_{YYYYMMDD}_{HHMMSS}_{unique_id}.txt
```

---

## 対応ファイル形式

| 形式 | Content-Type | 説明 |
|------|-------------|------|
| WebM | `audio/webm` | MediaRecorder API推奨 |
| WAV  | `audio/wav`  | 無圧縮音声 |
| MP3  | `audio/mpeg` | 圧縮音声 |

---

## セキュリティ

- **認証**: Firebase IDトークン
- **ファイルアクセス**: S3署名付きURL（1時間有効）
- **データ分離**: ユーザー固有のファイルパス
- **CORS**: 許可されたドメインのみアクセス可能

---

## 開発・テスト

### ローカル環境での起動
```bash
cd backend
docker compose up --build -d
```

### SwaggerUIアクセス
```
http://localhost:8000/docs
```

---

## 参考資料

- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-creating-buckets.html) 