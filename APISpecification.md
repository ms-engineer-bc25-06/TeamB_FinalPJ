# API仕様書

## 音声ファイル管理API

### 概要
子供の音声入力と文字起こしテキストファイルをAWS S3に安全に保存し、データベースで管理するAPI

### ベースURL
```
http://localhost:8000
```

---

## 1. アップロード用Presigned URL取得

### エンドポイント
```
POST /voice/get-upload-url
```

### 説明
S3に直接アップロードするための署名付きURLを発行するAPI

### リクエスト
```json
{
  "user_id": 1,
  "file_type": "audio",  // "audio" または "text"
  "file_format": "webm"  // "webm", "wav", "mp3" など（オプション、デフォルト: "webm"）
}
```

### レスポンス
```json
{
  "success": true,
  "upload_url": "https://bucket-name.s3.ap-northeast-1.amazonaws.com/...",
  "file_path": "audio/1/audio_20241201_143022_abc123.webm",
  "s3_url": "s3://bucket-name/audio/1/audio_20241201_143022_abc123.webm",
  "content_type": "audio/webm"
}
```

### 使用例（MediaRecorder API）
```javascript
// 1. アップロードURLを取得
const response = await fetch('/voice/get-upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    user_id: 1, 
    file_type: 'audio',
    file_format: 'webm'  // MediaRecorderでWebM形式を使用
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

---

## 2. ファイルパス保存

### エンドポイント
```
POST /voice/save-record
```

### 説明
音声・文字ファイルのパスをDBに保存するAPI

### リクエスト
```json
{
  "user_id": 1,
  "audio_file_path": "s3://bucket-name/audio/1/audio_20241201_143022_abc123.webm",
  "text_file_path": "s3://bucket-name/text/1/text_20241201_143022_abc123.txt"
}
```

### レスポンス
```json
{
  "success": true,
  "record_id": 123,
  "message": "Record saved successfully"
}
```

---

## 3. 記録一覧取得

### エンドポイント
```
GET /voice/records/{user_id}
```

### 説明
指定ユーザーのファイル情報とダウンロード用Presigned URLを返すAPI

### パラメータ
- `user_id` (path): ユーザーID

### レスポンス
```json
{
  "success": true,
  "records": [
    {
      "id": 123,
      "audio_path": "s3://bucket-name/audio/1/audio_20241201_143022_abc123.webm",
      "text_path": "s3://bucket-name/text/1/text_20241201_143022_abc123.txt",
      "audio_download_url": "https://bucket-name.s3.ap-northeast-1.amazonaws.com/...",
      "text_download_url": "https://bucket-name.s3.ap-northeast-1.amazonaws.com/...",
      "created_at": ["20241201", "143022"]
    }
  ]
}
```

---

## ファイルパス形式

### 音声ファイル（WebM対応）
```
s3://{bucket-name}/audio/{user_id}/audio_{YYYYMMDD}_{HHMMSS}_{unique_id}.webm
```

### テキストファイル
```
s3://{bucket-name}/text/{user_id}/text_{YYYYMMDD}_{HHMMSS}_{unique_id}.txt
```

### 対応ファイル形式
- **WebM**: `audio/webm` (MediaRecorder API推奨)
- **WAV**: `audio/wav`
- **MP3**: `audio/mpeg`

### 日時情報
- ファイル名に作成日時を含む（例: `audio_20241201_143022_abc123.webm`）
- データベースには別途日時カラムを保存しない

---

## エラーレスポンス

### 400 Bad Request
```json
{
  "detail": "Invalid file type"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to generate upload URL"
}
```

---

## セキュリティ

- **Presigned URL**: 一時的なアクセス権限（デフォルト1時間）
- **直接アップロード**: バックエンドを経由せずS3に直接アップロード
- **認証情報保護**: AWS認証情報をフロントエンドに露出しない
