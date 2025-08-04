## 1. 💗 プロジェクト概要

- [PRD](docs/PRD.md)を参照ください。

## 2. 👷 開発ガイドライン（dev-guidelines.md）

- [PRD](docs/devGuideline.md)

## 3. 🚀 Getting Started

TODO: こちらの内容を環境構築完了後、完成させること！

```
1. `.env.example` を `.env.local` にコピー
2. 必要な値を設定(値についてはNotionに記載)
```

## 4. 📚 Documentation

### PRD・要件定義

- [PRD](docs/PRD.md)
- [Requirements Definition](docs/requirements.md)

### 技術選定

- [Tech Stack Selection](docs/techStack.md)

### 画面設計

- [UI Design](docs/UIDesign.md)


### DB 設計

- [Database Design (draw.io)](docs/databaseDesign.md)

### API 設計

- [API Specification (OpenAPI/Swagger)](docs/APISpecification.md)

### テスト設計

- [Test Plan](docs/testPlan.md)

### 非機能設計

## 運用設計

- [Operations Plan](docs/operationsPlan.md)

## 性能設計

- [Performance Design](docs/performanceDesign.md)

## ログ設計

- [Logging Design](docs/loggingDesign.md)

## 可用性設計

- [Availability Design](docs/availabilityDesign.md)

## セキュリティ設計

- [Security Design](docs/securityDesign.md)

## 5. ストレージ（S3）連携
### 5.1 概要

- 音声・テキストファイルは S3 に保存
- S3へのパスはDBに保存
- サーバーはファイルを保持しない構成
- **対応形式**: WebM, WAV, MP3 (音声), TXT (テキスト)
- **セキュリティ**: Presigned URLによる安全なアップロード
- **スケーラビリティ**: S3直接アップロードによるサーバー負荷軽減

### 5.2 .env へのS3設定
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=your_bucket_name
```

### 5.3 アップロード手順
```
// URLを取得
const res = await fetch("/voice/get-upload-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: 1, file_type: "audio", file_format: "webm" }),
});
const { upload_url, content_type } = await res.json();

// アップロード
await fetch(upload_url, {
  method: "PUT",
  headers: { "Content-Type": content_type },
  body: fileBlob,
});
```
⚠️ Content-Type を忘れると失敗するので注意！

### 5.4 APIテスト方法

curl
```
# URL取得
curl -X POST http://localhost:8000/voice/get-upload-url \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"file_type":"audio","file_format":"webm"}'

# ファイルアップロード
curl -X PUT "<upload_url>" \
  -H "Content-Type: audio/webm" \
  --data-binary "@path/to/file.webm"
```