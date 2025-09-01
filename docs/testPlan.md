# テスト設計書

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
```

## フロントエンドテスト

### テスト実行

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- EmotionSelectionPage.test.tsx

# テストカバレッジ
npm run test:coverage
```
