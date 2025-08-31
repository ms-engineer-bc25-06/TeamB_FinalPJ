# 💗 プロジェクト概要

- 本プロジェクトの詳細は [PRD](docs/PRD.md) を参照してください。

## 📁 プロジェクト構成

```
TeamB_FinalPJ/
├── frontend/                 # Next.js フロントエンド
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # 再利用可能なUIコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # ユーティリティ・API
│   │   ├── styles/         # グローバルスタイル・テーマ
│   │   └── types/          # TypeScript型定義
│   ├── public/              # 静的ファイル（画像・音声）
│   └── tests/               # テストファイル
├── backend/                  # FastAPI バックエンド
│   ├── app/                 # メインアプリケーション
│   │   ├── api/            # APIエンドポイント
│   │   ├── services/       # ビジネスロジック
│   │   └── models/         # データベースモデル
│   ├── migrations/          # データベースマイグレーション
│   └── tests/               # テストファイル
├── docs/                     # プロジェクトドキュメント
│   ├── PRD.md              # プロダクト要件定義
│   ├── UIDesign.md         # UI設計書
│   ├── databaseDesign.md   # データベース設計
│   └── ...                 # その他設計書
└── scripts/                  # 開発用スクリプト
```

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

> ここでの説明は概要です。詳しいセットアップ手順は各ディレクトリの README を参照してください。

## ⚡️ Stripe CLI のセットアップ

**Stripe CLI**は、ローカル開発環境でStripeのWebhook通知をテストするために必要です。

### 自動セットアップ

開発用スクリプトを使用して、OSに応じた自動セットアップが可能です：

```bash
# macOS
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh

# Windows
scripts\dev-setup.bat
```

### 手動インストール

**macOS**
```bash
# Homebrewを使用（推奨）
brew install stripe/stripe-cli/stripe

# または、公式サイトからダウンロード
# https://stripe.com/docs/stripe-cli
```

**Windows**
```bash
# Chocolateyを使用
choco install stripe-cli

# または、公式サイトからダウンロード
# https://stripe.com/docs/stripe-cli
```

### ログイン設定
```bash
# Stripeアカウントにログイン
stripe login
```

## 📂 ディレクトリ別 README

- [frontend/README.md](frontend/README.md) : フロントエンドセットアップ手順
- [backend/README.md](backend/README.md) : バックエンドセットアップ手順

## 📚 Documentation

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
