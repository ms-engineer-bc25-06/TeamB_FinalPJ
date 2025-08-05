## 1. 💗 プロジェクト概要

- [PRD](docs/PRD.md)を参照ください。

## 2. 👷 開発ガイドライン（dev-guidelines.md）

- [PRD](docs/devGuideline.md)

## 3. 🚀 Getting Started

開発を始める前に、お使いのコンピュータに以下のツールがインストールされていることをご確認ください。

### 事前準備

| ツール                                                          | 目的                                     | インストール方法・情報源                                                                                                                               |
| --------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Git**                                                         | ソースコードのバージョン管理             | [公式サイト](https://git-scm.com/downloads) からダウンロード。                                                                                         |
| **Node.js** (v18.17.0 以降)                                     | フロントエンドの実行環境・パッケージ管理 | [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) や [nvm-windows](https://github.com/coreybutler/nvm-windows) を使ったバージョン管理を強く推奨します。 |
| **Python** (v3.10 以降)                                         | バックエンドの実行環境                   | [pyenv](https://github.com/pyenv/pyenv) を使ったバージョン管理を推奨します。                                                                           |
| **Docker** & **Docker Compose**                                 | コンテナ技術による環境の分離・再現性向上 | [Docker Desktop 公式サイト](https://www.docker.com/products/docker-desktop/) からインストールします。Docker Compose V2 が含まれています。              |
| **Visual Studio Code**                                          | コードエディタ                           | [公式サイト](https://code.visualstudio.com/) からダウンロード。以下の拡張機能を入れておくと便利です。                                                  |
| └ **ESLint**, **Prettier**, **Python**, **Pylance**, **Docker** | コーディング支援、静的解析、フォーマット | VSCode の拡張機能マーケットプレイスからインストールします。                                                                                            |

### ⚡️ バックエンドのセットアップ

バックエンドサーバー (FastAPI) とデータベース (PostgreSQL) を Docker コンテナで起動します。

**手順:**

1. **Firebase サービスアカウントキーの配置**

   - Firebase プロジェクトからダウンロードしたサービスアカウントの秘密鍵（JSON ファイル）を、Notion の㊙️ページに掲載しておりますのでそちらをまずはダウンロードしてください。
   - 上記ダウンロードしたファイルを`backend`ディレクトリ直下に配置し、ファイル名を`firebase-service-account.json`に変更してください。
   - **注意**: このファイルは`.gitignore`によって Git の管理対象外となっています。

2. **環境変数ファイルの設定**
   - `backend`ディレクトリにある`.env.example`ファイルを使い、`.env`という名前のファイルを作成します。
   - `.env`ファイルを開き、`POSTGRES_USER`や`POSTGRES_PASSWORD`など、Notion の㊙️ページを参考に、ご自身の環境に合わせて値を設定してください。
3. **待機スクリプトに実行権限を付与**

   - `backend`ディレクトリに移動し、以下のコマンドを実行して、データベースの起動を待つためのシェルスクリプトに実行権限を与えます。**この手順は初回のみ必要です。**

     > シェルスクリプトを使用する背景は、DB が接続可能になるまで FAST API の起動を止めるためです。この設定がないと、backend（FastAPI）が起動直後に DB 接続を試みようとし、DB はまだ初期化中（テーブル作成や WAL リカバリ中）で接続できない問題が発生する可能性があります。

     ```
     chmod +x wait-for-db.sh
     ```

4. **コンテナのビルドと起動**

   - `backend`ディレクトリで、以下のコマンドを実行します。
     ```
     docker compose up --build -d
     ```
   - `--build`は初回や`Dockerfile`に変更があった場合に必要です。`-d`はバックグラウンドで起動するオプションです。

5. **動作確認**

   - `docker compose ps`コマンドを実行し、`teamb_backend`と`teamb_db`の 2 つのコンテナが`Up (healthy)`または`running`状態であることを確認します。
   - Web ブラウザで `http://localhost:8000/docs` にアクセスし、FastAPI の Swagger UI が表示されれば成功です。

### 🌐 フロントエンドのセットアップ

フロントエンドの Web アプリケーション (Next.js) をローカルの開発サーバーで起動します。

**手順:**

1. **環境変数ファイルの設定**

   - `frontend`ディレクトリに移動し、`.env.example`ファイルを使って`.env.local`という名前のファイルを作成します。
   - `.env.local`の中身については Notion の㊙️ページをご覧ください。

2. **依存パッケージのインストール**

   - `frontend`ディレクトリで、以下のコマンドを実行します。
     ```
     npm install
     ```

3. **開発サーバーの起動**

   - `npm install`が完了したら、以下のコマンドで開発サーバーを起動します。
     ```
     npm run dev
     ```

4. **動作確認**

   - Web ブラウザで `http://localhost:3000` にアクセスし、アプリケーションのトップページが表示されれば成功です。

### 🗄️ ストレージ（S3）連携

#### 1. 概要

- 音声・テキストファイルは S3 に保存
- S3 へのパスは DB に保存
- サーバーはファイルを保持しない構成
- **対応形式**: WebM, WAV, MP3 (音声), TXT (テキスト)
- **セキュリティ**: Presigned URL による安全なアップロード
- **スケーラビリティ**: S3 直接アップロードによるサーバー負荷軽減

#### 2. アップロード手順

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

#### 3. API テスト方法

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
