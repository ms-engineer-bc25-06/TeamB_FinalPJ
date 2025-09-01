# 💗 プロジェクト概要

子どもの感情教育を支援するアプリ「きもちみっけ！」です。
感情カード選択、強度設定、音声入力による感情記録機能を提供し、レポートで子どもの感情の変化を追跡できます。

- 本プロジェクトの詳細は [PRD](docs/PRD.md) を参照してください。

## 📁 プロジェクト構成

```
TeamB_FinalPJ/
├── frontend/                 # Next.js フロントエンド
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   │   ├── (authed)/    # 認証済みユーザー用ルート
│   │   │   │   └── app/     # メインアプリ画面
│   │   │   │       ├── emotion-selection/    # 感情選択画面
│   │   │   │       ├── emotion-intensity/    # 強度選択画面
│   │   │   │       ├── emotion-confirmation/ # 感情確認画面
│   │   │   │       ├── voice/                # 音声入力画面
│   │   │   │       ├── report/               # レポート画面
│   │   │   │       └── ...                   # その他機能画面
│   │   │   └── (public)/    # 未認証ユーザー用ルート
│   │   ├── components/      # 再利用可能なUIコンポーネント
│   │   │   └── ui/          # 基本UIコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # ユーティリティ・API
│   │   ├── styles/         # グローバルスタイル・テーマ
│   │   ├── types/          # TypeScript型定義
│   │   ├── utils/          # ユーティリティ関数
│   │   └── contexts/       # React Context
│   ├── public/              # 静的ファイル（画像・音声）
│   │   ├── images/         # 画像ファイル
│   │   │   ├── emotions/   # 感情カード画像
│   │   │   └── kokoron/    # キャラクター画像
│   │   └── sounds/         # 音声ファイル
│   └── tests/               # テストファイル
├── backend/                  # FastAPI バックエンド
│   ├── app/                 # メインアプリケーション
│   │   ├── api/            # APIエンドポイント
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   │           └── voice.py  # 音声処理API
│   │   ├── services/       # ビジネスロジック
│   │   │   ├── whisper.py  # Whisper音声認識
│   │   │   ├── s3.py       # S3ファイル管理
│   │   │   └── voice/      # 音声処理関連
│   │   ├── models.py       # データベースモデル
│   │   ├── crud.py         # CRUD操作
│   │   ├── schemas.py      # Pydanticスキーマ
│   │   ├── emotion_api.py  # 感情API
│   │   ├── emotion_color_api.py # 感情色API
│   │   ├── stripe_api.py   # Stripe決済API
│   │   ├── children.py     # 子ども管理API
│   │   └── main.py         # FastAPIアプリケーション
│   ├── migrations/          # データベースマイグレーション
│   ├── alembic/            # Alembic設定
│   └── tests/               # テストファイル
├── docs/                     # プロジェクトドキュメント
│   ├── PRD.md              # プロダクト要件定義
│   ├── UIDesign.md         # UI設計書
│   ├── databaseDesign.md   # データベース設計
│   ├── setup/              # セットアップ手順
│   └── ...                 # その他設計書
└── scripts/                  # 開発用スクリプト
    ├── dev-setup.sh        # macOS/Linux用セットアップ
    └── dev-setup.bat       # Windows用セットアップ
```

## 🛠 技術スタック

詳細な技術スタックについては [Tech Stack](docs/techStack.md) を参照してください。

## 👷 開発ガイドライン

- 開発ルール・コーディング規約などは [dev-guidelines.md](docs/devGuideline.md) を参照してください。

## 🚀 開発開始前の前提環境

開発を始める前に、以下のツールがインストールされていることを確認してください。

| ツール | 目的 | インストール方法・情報源 |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Git** | ソースコードのバージョン管理 | [公式サイト](https://git-scm.com/downloads) からダウンロード。 |
| **Node.js** (v18.17.0 以降) | フロントエンドの実行環境・パッケージ管理 | [nvm](https://github.com/nvm-sh/nvm) などでのバージョン管理を推奨 |
| **Docker** & **Docker Compose** | コンテナ技術による環境の分離・再現性向上 | [Docker Desktop 公式サイト](https://www.docker.com/products/docker-desktop/) からインストール |
| **Visual Studio Code** | コードエディタ | [公式サイト](https://code.visualstudio.com/) より。以下の拡張機能も併せて導入。 |
| └ **ESLint**, **Prettier**, **Python**, **Pylance**, **Docker**, **Dev Containers（推奨）** | コーディング支援、保存時整形、Lint、DevContainer 接続など | VSCode の拡張機能マーケットプレイスからインストール |

ここでの説明は概要です。詳しいセットアップ手順は各ディレクトリの README を参照してください。

## 📂 ディレクトリ別 README

- [frontend/README.md](frontend/README.md) : フロントエンドセットアップ手順
- [backend/README.md](backend/README.md) : バックエンドセットアップ手順
- [docs/README.md](docs/README.md) : プロジェクトドキュメント一覧


## 📚 Documentation

### プロダクト設計
- [PRD](docs/PRD.md) - プロダクト要件定義
- [Requirements](docs/requirements.md) - 機能要件・非機能要件

### 技術設計
- [Tech Stack](docs/techStack.md) - 技術スタック詳細
- [API Specification](docs/APISpecification.md) - API仕様書
- [Performance Design](docs/performanceDesign.md) - 性能設計
- [Security Design](docs/securityDesign.md) - セキュリティ設計
- [Logging Design](docs/loggingDesign.md) - ログ設計
- [Operations Plan](docs/operationsPlan.md) - 運用計画

### 画面・UI設計
- [UI Design](docs/UIDesign.md) - 画面設計・UI仕様
- [Availability Design](docs/availabilityDesign.md) - 可用性設計

### データベース設計
- [Database Design](docs/databaseDesign.md) - データベース設計

### 非機能要件設計
- [Test Plan](docs/testPlan.md) - テスト戦略・ガイド

### 開発・運用
- [Dev Guideline](docs/devGuideline.md) - 開発ガイドライン

### セットアップ・開発環境
- [Backend Setup](docs/setup/backend-setup.md) - バックエンド詳細セットアップ
- [Frontend Setup](docs/setup/frontend-setup.md) - フロントエンド詳細セットアップ
- [Stripe Setup](docs/setup/stripe-setup.md) - Stripe詳細セットアップ
