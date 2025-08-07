# 👷 開発ガイドライン（dev-guidelines.md）

> **このドキュメントは、プロジェクトのチーム開発をスムーズに進めるための基本ルール・手順・ツールの使い方をまとめたものです。**
>
> チーム全員が「どこで連絡し、どう作業し、どんな命名やコミットルールを守るか」を明確にし、効率的な共同開発を目指します。

## 🗣️ コミュニケーションルール・ツール

- **連絡**
  - Discord チャンネル（全体連絡・雑談・ミーティング）
  - Discord プライベートチャット（個別連絡）
  - Google Meet（ミーティング）
- **ドキュメント管理**
  - Notion（議事録・タスク分担・マイルストーン等）[リンク](https://www.notion.so/ms-engineer/TeamB-23c8f7a036288041a541ce30344b295c)
  - GitHub リポジトリ（docs 配下の補足ドキュメント）
- **タスク管理**
  <!-- TODO:これからきめる -->
  - GitHub Projects（カンバン方式）

---

## 📅 定期ミーティング

＜毎日実施＞

- 朝会：9:00〜10:00（当日のタスク確認）
- 進捗共有・課題共有：適宜
- ラップアップ：夕会後（明日以降のタスク確認）

＜毎週実施＞

- スプリントビュー：火曜日 15:00~16:00（任意：木曜日　同時間）

---

## 📝 開発ルール

#### コミットメッセージ

- feat: 新機能
- fix: バグ修正
- docs: ドキュメント
- style: コードスタイル
- refactor: リファクタリング
- test: テスト追加

#### コーディング規約

<!-- TODO: これから整備 -->

- Python：PEP 8 準拠
- TypeScript：ESLint + Prettier
- 命名：英語、わかりやすい名前

#### その他のルール

- PR は必ずレビュワーを 1 人つける（⚠️ 自分でレビュー禁止）
- RR を出したらは Discord のプライベートチャットで報告する
- 上記報告の際、一番早くリアクションをつけた方をレビュワーに設定する
- 1 コミット 1 目的
  。複数の目的を 1 コミットにまとめない
- コンフリクトを最小限にするため、こまめに push/pull を行う
- 必ずレビュー＆承認後にマージする

---

## 🎯 開発フロー

### ブランチ戦略

- `main`：本番デプロイ用
- `develop`：開発メイン
- `xxxxxx`：下記の prefix 付きの各機能開発用ブランチを用意する。

### ブランチ用 prefix 一覧

| prefix      | 説明                     |
| ----------- | ------------------------ |
| `feature/`  | 新機能開発               |
| `fix/`      | バグ修正                 |
| `docs/`     | ドキュメント関連         |
| `style/`    | フォーマット・見た目調整 |
| `refactor/` | リファクタリング         |
| `test/`     | テストコード追加・修正   |
| `hotfix/`   | 緊急修正（本番バグ等）   |

タスク管理ツール（GitHub Issues）と連携していれば、その番号を入れることで PR とタスクの対応が明確になります。

### 命名規則ガイドライン

本プロジェクトでは、コードの可読性と保守性を高めるために、以下の命名規則を採用します。
| 用途 | 命名規則 | 形式 | 現在の例・備考 |
| ---------------------- | ------------------- | ------------------------------ | ----------------------------------------------------------- |
| **変数・関数名（JS/TS）** | キャメルケース（camelCase） | `camelCase` | `getUserData`, `decodedToken` など |
| **変数・関数名（Python）**<br> | スネークケース（snake_case） | `snake_case` | |
| **定数・環境変数名** | スネークケース（SNAKE_CASE） | `UPPER_SNAKE_CASE` | `.env` 内の `API_KEY`、`DATABASE_URL` など |
| **ファイル名（JS/TS/React）** | キャメルケース | `camelCase` | `page.tsx` |
| **ファイル名（Python）** | スネークケース（snake_case） | `snake_case.py` | `main.py`, `s3_service.py` |
| **コンポーネント名（React）** | パスカルケース（PascalCase） | `UserCard.tsx` | `UserCard.tsx` |
| **CSS モジュールファイル名** | ケバブケース（kebab-case） | `page.module.css` | 実際に `page.module.css` を確認 |
| **CSS クラス名** | ケバブケース（kebab-case） | `.form-group__input` | 一般的な BEM 記法に従うと仮定 |
| **ディレクトリ名** | 小文字＋単語区切り（スネークケース） | `app`, `contexts`, `voice_api` | `app`, `lib`, `types`など |
| **DB カラム名 / スキーマ** | スネークケース（snake_case） | `user_id`, `created_at` | `user_id`, `email_verified` などが想定される構成 |
| **API エンドポイント** | ケバブケース（kebab-case） | `/user-profile` | REST API を想定。FastAPI や Next API Routes と連携 |
| **Python のクラス名** | パスカルケース（PascalCase） | `UploadRequest`, `UserCreate` | |
| **ドキュメントファイル名** | キャメルケース（camelCase） | `devGuideline.md` | `APISpecification.md`, `UIDesign.md`, `PRD.md` など、既存スタイルを尊重 |
| **TypeScript 型定義** | パスカルケース（PascalCase） | `UserResponse`, `EmotionLog` | `type` / `interface` どちらでも共通 |

### 開発手順

<!-- TODO: GitHub IssuesやProjectを使わないのであれば該当箇所削除。 -->

1. `develop` ブランチから新しいフィーチャーブランチを作成
2. GitHub Issues で作業を管理（カンバン方式）
3. 実装完了後、PR を作成
4. PR 後、Discord プライベートチャットで報告。
5. 第三者のコードレビュー後、`develop` にマージ

## 📌 その他

- ルールやフローで困った場合は Discord で気軽に相談
- ドキュメント(GitHub および Notion)・コードに加筆したら、必ずコミット＆チームに共有
