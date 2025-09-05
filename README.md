# 💗 プロジェクト概要

> **この README の使い方**: プロジェクトの全体像やセットアップ手順を確認したい時に参照してください。新メンバーのオンボーディングや開発環境構築に使用します。

子どもの感情教育を支援するアプリ「きもちみっけ！」です。
感情カード選択、強度設定、音声入力による感情記録機能を提供し、レポートで子どもの感情の変化を追跡できます。

- 本プロジェクトの詳細は [PRD](docs/PRD.md) を参照してください。

## 📁 プロジェクト構成

```
TeamB_FinalPJ/
├── frontend/           # Next.js フロントエンド
│   ├── src/app/        # アプリ画面（感情選択、音声入力、レポート等）
│   ├── src/components/ # UIコンポーネント
│   ├── src/hooks/      # カスタムフック
│   ├── src/lib/        # API・ユーティリティ
│   └── public/         # 静的ファイル（画像・音声）
├── backend/            # FastAPI バックエンド
│   ├── app/            # メインアプリ（API、サービス、モデル）
│   ├── migrations/     # データベースマイグレーション
│   └── alembic/        # Alembic設定
├── docs/               # プロジェクトドキュメント
└── scripts/            # 開発用スクリプト
```

## 🛠 技術スタック

詳細な技術スタックについては [Tech Stack](docs/techStack.md) を参照してください。

## 👷 開発ガイドライン

- 開発ルール・コーディング規約などは [dev-guidelines.md](docs/devGuideline.md) を参照してください。

## 🚀 開発開始前の前提環境

開発を始める前に、以下のツールがインストールされていることを確認してください。

| ツール                                                                                      | 目的                                                      | インストール方法・情報源                                                                      |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Git**                                                                                     | ソースコードのバージョン管理                              | [公式サイト](https://git-scm.com/downloads) からダウンロード。                                |
| **Node.js**                                                                                 | フロントエンドの実行環境・パッケージ管理                  | [nvm](https://github.com/nvm-sh/nvm) などでのバージョン管理を推奨                             |
| **Docker** & **Docker Compose**                                                             | コンテナ技術による環境の分離・再現性向上                  | [Docker Desktop 公式サイト](https://www.docker.com/products/docker-desktop/) からインストール |
| **Visual Studio Code**                                                                      | コードエディタ                                            | [公式サイト](https://code.visualstudio.com/) より。以下の拡張機能も併せて導入。               |
| └ **ESLint**, **Prettier**, **Python**, **Pylance**, **Docker**, **Dev Containers（推奨）** | コーディング支援、保存時整形、Lint、DevContainer 接続など | VSCode の拡張機能マーケットプレイスからインストール                                           |

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
- [API Specification](docs/APISpecification.md) - API 仕様書
- [Performance Design](docs/performanceDesign.md) - 性能設計
- [Security Design](docs/securityDesign.md) - セキュリティ設計
- [Logging Design](docs/loggingDesign.md) - ログ設計
- [Operations Plan](docs/operationsPlan.md) - 運用計画

### 画面・UI 設計

- [UI Design](docs/UIDesign.md) - 画面設計・UI 仕様
- [Availability Design](docs/availabilityDesign.md) - 可用性設計

### データベース設計

- [Database Design](docs/databaseDesign.md) - データベース設計

### 非機能要件設計

- [Test Design](docs/testDesign.md) - テスト戦略・ガイド

### 開発・運用

- [Dev Guideline](docs/devGuideline.md) - 開発ガイドライン

### 🔧 トラブルシューティング

- **自動整形が効かない場合**：`./scripts/fix-formatting.sh` で診断・復旧

### セットアップ・開発環境

- [Backend Setup](backend/README.md) - バックエンド詳細セットアップ
- [Frontend Setup](frontend/README.md) - フロントエンド詳細セットアップ
- [Stripe Setup](docs/stripe-setup.md) - Stripe 詳細セットアップ
