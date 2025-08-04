# データベース設計

## 音声記録テーブル (voice_records)

### テーブル概要
子供の音声入力と文字起こしテキストのファイルパスを保存するテーブル

### テーブル定義

| カラム名 | データ型 | NULL | 説明 |
|---------|---------|------|------|
| id | Integer | NOT NULL | 主キー、自動採番 |
| user_id | Integer | NOT NULL | ユーザーID |
| audio_file_path | String | NOT NULL | 音声ファイルのS3パス |
| text_file_path | String | NULL | テキストファイルのS3パス |

### インデックス
- `id` (Primary Key)
- `user_id` (検索用)

### ファイルパス形式
- 音声ファイル: `s3://{bucket-name}/audio/{user_id}/audio_{YYYYMMDD}_{HHMMSS}_{unique_id}.wav`
- テキストファイル: `s3://{bucket-name}/text/{user_id}/text_{YYYYMMDD}_{HHMMSS}_{unique_id}.txt`

### 日時情報
作成日時はファイル名に含まれるため、DBに別途保存しない
- 例: `audio_20241201_143022_abc123.wav` → 2024年12月1日 14:30:22

### 使用例
```sql
-- ユーザー1の音声記録を取得
SELECT * FROM voice_records WHERE user_id = 1 ORDER BY id DESC;

-- 最新の記録を取得
SELECT * FROM voice_records ORDER BY id DESC LIMIT 1;
```

### 関連API
- `POST /voice/upload` - ファイルアップロードとDB保存
- `GET /voice/records/{user_id}` - ユーザーの記録一覧取得
