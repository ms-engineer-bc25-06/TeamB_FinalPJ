# データベース設計

## 目的

本ドキュメントは、感情教育アプリ『きもちみっけ！』のデータベース設計を明確に定義し、開発チームがデータモデルを理解し、適切なクエリ設計とデータ管理を実現することを目的としています。

## このドキュメントの使い方

データベースのテーブル構成やER図を確認したい時に参照してください。データモデルの理解やクエリ設計に使用します。

![ER図](./images/teamb_db2.png)

本システムでは以下のテーブルを用いて、保護者および子どもの感情記録を管理しています。

## テーブル概要

- `users`：Firebase 認証でログインする保護者データを格納
- `children`：兄弟それぞれのプロフィールを格納
- `emotion_logs`：子どもの感情記録（音声/テキストファイルパス含む）を格納
- `emotion_cards`：感情カードのマスターデータ
- `intensity`：感情の強度（色変化等に使用）
- `daily_reports`：日ごとの LLM 生成レポート
- `weekly_reports`：週ごとの LLM 生成レポート
- `report_notifications`：週次レポートの通知設定
- `subscriptions`：課金・トライアル情報

## 各テーブルの定義とインデックス・制約

## 以下は、本アプリにおける主要なデータベーステーブルの構造、インデックス、制約の定義です。

## `users`（保護者）

### テーブル定義

| カラム名       | データ型 | NULL                       | 説明                       |
| -------------- | -------- | -------------------------- | -------------------------- |
| id             | UUID     | NOT NULL                   | 主キー                     |
| uid            | String   | NOT NULL                   | Firebase UID（ユニーク）   |
| email          | String   | NOT NULL                   | メールアドレス（ユニーク） |
| email_verified | Boolean  | NOT NULL                   | メールアドレスの検証状態   |
| nickname       | String   | NULL                       | 表示名                     |
| last_login_at  | DateTime | NULL                       | 最終ログイン日時           |
| login_count    | Integer  | NOT NULL（default=0）      | ログイン回数               |
| role           | String   | NOT NULL（default='user'） | 権限                       |
| created_at     | DateTime | NOT NULL                   | 登録日時                   |
| updated_at     | DateTime | NOT NULL                   | 更新日時                   |
| deleted_at     | DateTime | NULL                       | 退会日時                   |

### インデックス・制約

- `uid`, `email`: 一意制約・インデックスあり
- `id`: プライマリキー

---

## `subscriptions`（課金情報）

### テーブル定義

| カラム名            | データ型 | NULL                      | 説明                       |
| ------------------- | -------- | ------------------------- | -------------------------- |
| id                  | UUID     | NOT NULL                  | 主キー                     |
| user_id             | UUID     | NOT NULL                  | ユーザー ID（ユニーク）    |
| stripe_customer_id  | String   | NULL                      | Stripe 顧客 ID（ユニーク） |
| subscription_status | String   | NULL                      | Stripe サブスク状態        |
| is_trial            | Boolean  | NOT NULL（default=True）  | トライアル中かどうか       |
| is_paid             | Boolean  | NOT NULL（default=False） | 有料会員かどうか           |
| trial_started_at    | DateTime | NULL                      | トライアル開始日時         |
| trial_expires_at    | DateTime | NULL                      | トライアル終了日時         |
| created_at          | DateTime | NOT NULL                  | 登録日時                   |
| updated_at          | DateTime | NOT NULL                  | 更新日時                   |

### インデックス・制約

- `user_id`: 一意制約・インデックスあり（ユーザーごとに 1 件）

---

## `children`（子どもプロフィール）

### テーブル定義

| カラム名   | データ型 | NULL     | 説明              |
| ---------- | -------- | -------- | ----------------- |
| id         | UUID     | NOT NULL | 主キー            |
| user_id    | UUID     | NOT NULL | 保護者ユーザー ID |
| nickname   | String   | NOT NULL | 子どもの表示名    |
| birth_date | Date     | NOT NULL | 生年月            |
| gender     | String   | NOT NULL | 性別              |
| created_at | DateTime | NOT NULL | 登録日時          |
| updated_at | DateTime | NOT NULL | 更新日時          |

### インデックス・制約

- `user_id`: インデックスあり

---

## `emotion_cards`（感情カードマスタ）

### テーブル定義

| カラム名  | データ型 | NULL     | 説明     |
| --------- | -------- | -------- | -------- |
| id        | UUID     | NOT NULL | 主キー   |
| label     | String   | NOT NULL | 感情名   |
| image_url | String   | NOT NULL | 画像パス |
| color     | String   | NOT NULL | 色情報   |

---

## `intensity`（感情の強度）

### テーブル定義

| カラム名       | データ型   | NULL     | 説明           |
| -------------- | ---------- | -------- | -------------- |
| id             | BigInteger | NOT NULL | 主キー         |
| color_modifier | Integer    | NOT NULL | 色の明度変更値 |

---

## `emotion_logs`（感情記録）

### テーブル定義

| カラム名        | データ型 | NULL     | 説明                     |
| --------------- | -------- | -------- | ------------------------ |
| id              | UUID     | NOT NULL | 主キー                   |
| user_id         | UUID     | NOT NULL | 保護者 ID                |
| child_id        | UUID     | NOT NULL | 子ども ID                |
| emotion_card_id | UUID     | NOT NULL | 感情カード ID            |
| intensity_id    | Integer  | NOT NULL | 感情の強度 ID            |
| voice_note      | Text     | NOT NULL | 音声入力のテキスト内容   |
| text_file_path  | String   | NOT NULL | テキストファイル S3 パス |
| audio_file_path | String   | NULL     | 音声ファイル S3 パス     |
| created_at      | Date     | NOT NULL | 記録日（1 日 1 件制約）  |

### インデックス・制約

- `child_id`, `created_at` にユニーク制約（1 日 1 回記録）

---

## `daily_reports`（日次レポート）

### テーブル定義

| カラム名       | データ型 | NULL     | 説明                    |
| -------------- | -------- | -------- | ----------------------- |
| id             | UUID     | NOT NULL | 主キー                  |
| user_id        | UUID     | NOT NULL | 保護者 ID               |
| child_id       | UUID     | NOT NULL | 子ども ID               |
| emotion_log_id | UUID     | NOT NULL | 感情記録 ID（ユニーク） |
| created_at     | DateTime | NOT NULL | 登録日時                |
| updated_at     | DateTime | NOT NULL | 更新日時                |

---

## `weekly_reports`（週次レポート）

### テーブル定義

| カラム名         | データ型 | NULL     | 説明                     |
| ---------------- | -------- | -------- | ------------------------ |
| id               | UUID     | NOT NULL | 主キー                   |
| user_id          | UUID     | NOT NULL | 保護者 ID                |
| child_id         | UUID     | NOT NULL | 子ども ID                |
| week_start_date  | Date     | NOT NULL | 対象週開始日             |
| week_end_date    | Date     | NOT NULL | 対象週終了日             |
| trend_summary    | Text     | NOT NULL | 感情の傾向（LLM 生成）   |
| advice_for_child | Text     | NOT NULL | 声かけ例（LLM 生成）     |
| growth_points    | Text     | NOT NULL | 成長ポイント（LLM 生成） |
| created_at       | DateTime | NOT NULL | 登録日時                 |
| updated_at       | DateTime | NOT NULL | 更新日時                 |

---

## `report_notifications`（レポート通知設定）

### テーブル定義

| カラム名         | データ型 | NULL     | 説明                       |
| ---------------- | -------- | -------- | -------------------------- |
| id               | UUID     | NOT NULL | 主キー                     |
| user_id          | UUID     | NOT NULL | 保護者 ID                  |
| child_id         | UUID     | NOT NULL | 子ども ID                  |
| notification_day | String   | NOT NULL | 曜日文字列（例：'sunday'） |
| enabled          | Boolean  | NOT NULL | 通知有効フラグ             |
| created_at       | DateTime | NOT NULL | 登録日時                   |
| updated_at       | DateTime | NOT NULL | 更新日時                   |

---

## 音声処理フロー

### 概要
本システムでは、子どもの音声を録音し、AIによる音声認識を経て感情記録として保存する処理フローを実装しています。

### 処理フロー詳細

#### 1. 音声録音
- **フロントエンド**: MediaRecorder APIを使用してWebM形式で録音
- **録音設定**: 16kHz/モノラル/16bit
- **ファイル形式**: WebM（VP8/VP9）、WAV、MP3対応

#### 2. S3アップロード
- **方式**: Presigned URLを使用した直接アップロード
- **セキュリティ**: 一時的な権限（1時間有効）による安全なアップロード
- **パス構造**: `s3://{bucket}/audio/{user_id}/audio_{YYYYMMDD}_{HHMMSS}_{unique_id}.{extension}`

#### 3. 音声正規化
- **ツール**: FFmpegを使用
- **変換**: 16kHz/モノラル/16bitに統一
- **効果**: ファイルサイズ約70%削減、Whisper処理の最適化

#### 4. テキスト保存
- **保存先**: S3（`s3://{bucket}/text/{user_id}/text_{YYYYMMDD}_{HHMMSS}_{unique_id}.txt`）
- **データベース**: ファイルパスとテキスト内容を`emotion_logs`テーブルに保存

### ファイル管理

#### 音声ファイル・テキストファイルについての補足情報

- 音声ファイル: `s3://{bucket-name}/audio/{user_id}/audio_{YYYYMMDD}_{HHMMSS}_{unique_id}.wav`
- テキストファイル: `s3://{bucket-name}/text/{user_id}/text_{YYYYMMDD}_{HHMMSS}_{unique_id}.txt`

#### 日時情報

作成日時はファイル名に含まれるため、DB に別途保存しない

- 例: `audio_20241201_143022_abc123.wav` → 2024 年 12 月 1 日 14:30:22

#### 使用例

```sql
-- ユーザー1の音声記録を取得
SELECT * FROM emotion_logs WHERE user_id = 1 ORDER BY created_at DESC;

-- 最新の記録を取得
SELECT * FROM emotion_logs ORDER BY created_at DESC LIMIT 1;
```

#### 関連 API

- `POST /api/v1/voice/get-upload-url` - ファイルアップロード用 PresignedURL 取得
- `POST /api/v1/voice/transcribe` - 音声文字起こし実行
- `GET /emotion/logs/list` - 感情ログ一覧取得
