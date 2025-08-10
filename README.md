## 1. 💗 プロジェクト概要

- [PRD](docs/PRD.md)を参照ください。

## 2. 👷 開発ガイドライン（dev-guidelines.md）

- [dev-guidelines.md](docs/devGuideline.md)

## 3. 🚀 Getting Started

開発を始める前に、お使いのコンピュータに以下のツールがインストールされていることをご確認ください。

### 事前準備

このプロジェクトでは、**フロントエンドはローカルで開発**し、**バックエンドとデータベースは Docker コンテナで開発**しています。

バックエンドの整形（Black）や静的解析（pylint）などをローカルに環境構築せずに実行できるよう、**VSCode の Dev Container 機能の利用を推奨**しています。

Dev Container を使うことで、チーム全体で共通の開発環境（パッケージ、フォーマッターなど）を使い、保存時整形や import 整理などをローカルに依存せず行えます。
| ツール | 目的 | インストール方法・情報源 |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Git** | ソースコードのバージョン管理 | [公式サイト](https://git-scm.com/downloads) からダウンロード。 |
| **Node.js** (v18.17.0 以降) | フロントエンドの実行環境・パッケージ管理 | [nvm](https://github.com/nvm-sh/nvm) などでのバージョン管理を推奨 |
| **Docker** & **Docker Compose** | コンテナ技術による環境の分離・再現性向上 | [Docker Desktop 公式サイト](https://www.docker.com/products/docker-desktop/) からインストール |
| **Visual Studio Code** | コードエディタ | [公式サイト](https://code.visualstudio.com/) より。以下の拡張機能も併せて導入。 |
| └ **ESLint**, **Prettier**, **Python**, **Pylance**, **Docker**, **Dev Containers（推奨）** | コーディング支援、保存時整形、Lint、DevContainer 接続など | VSCode の拡張機能マーケットプレイスからインストール |

## ⚡️ バックエンドのセットアップ（DevContainer あり・なし共通）

バックエンドサーバー（FastAPI）とデータベース（PostgreSQL）を Docker コンテナで起動します。  
本プロジェクトでは、DevContainer あり・なし 2 通りの開発方法が選べます。Docker 環境で Black や Pylint の自動整形を行いたい場合は DevContainer を使用することを推奨します。

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

5. **マイグレーション適用（初回 or モデル更新時）**

   - `backend`ディレクトリで、以下のコマンドを実行します。

     ```
     docker compose exec backend alembic upgrade head

     ```

   - Alembic によって DB スキーマをコードと同期させます。
   - 初回セットアップ時 または models.py などスキーマ変更後 のみ実行します。
   - 適用確認
     ```
     docker compose exec backend alembic current
     ```
   - 上記コマンドを実行し、`initial migration`など、最新版のリビジョン ID が表示されれば OK。

6. **動作確認**

   - `docker compose ps`コマンドを実行し、`teamb_backend`と`teamb_db`の 2 つのコンテナが`Up (healthy)`または`running`状態であることを確認します。
   - Web ブラウザで `http://localhost:8000/docs` にアクセスし、FastAPI の Swagger UI が表示されれば成功です。
   - Swagger UI の使い方補足：
     > 表示されたページで、テストしたい API（例: POST /api/v1/login）をクリックして展開。「Try it out」ボタンを押し、必要な情報（ID トークンなど）を入力して「Execute」ボタンを押すと、実際に API を実行して結果を確認できます。

### ⚡️ バックエンドのセットアップ続き（DevContainer あり）

**Dev Container を使用する場合の整形・Lint 実行方法**

- `.devcontainer/devcontainer.json` により、**DevContainer 初回起動時に自動で以下のコマンドが実行されます：**

```
pip install -r requirements-dev.txt
```

- VSCode 側では `.devcontainer/devcontainer.json` により以下の設定が自動で適用されます：

  - 保存時に自動で `black` による整形が実行される
  - `pylint` による Lint が有効になる

- 初回セットアップ手順：
  1. VSCode 拡張「Dev Containers」をインストールする
  2. プロジェクトを VSCode で開く
  3. 左下の緑色のボタン 🟢 から「Reopen in Container」を選ぶ
  4. 自動的にコンテナがビルドされ、開発環境（black, pylint など）がセットアップされます
     > 💡 初回ビルドには 5〜10 分かかることがあります。2 回目以降は高速に起動します。

### ⚡️ バックエンドのセットアップ続き（DevContainer なし）

**Dev Container を使用しない場合の整形・Lint 実行方法**

```bash
docker compose exec backend pip install -r requirements-dev.txt
```

開発中に 1 回実行すれば OK です（本番環境や CI では使用されません）
その後、整形や Lint は以下のように実行できます：

```bash
docker compose exec backend black app
docker compose exec backend pylint app
```

- `app`：整形対象ディレクトリ（例：`app schemas utils` など複数指定も OK）

Python（3.10 以降）がローカルにインストールされている場合は、以下でも整形可能です。

```
pip install -r backend/requirements-dev.txt
cd backend
black app
```

### ❗️ 再セットアップ**が必要になるケース**

| ケース                                                                                    | 再セットアップ必要？ | 理由                                                                        |
| ----------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------- |
| `--build`付きで `docker compose up --build` を実行した場合                                | ✅ **必要**          | イメージが再生成されるため、開発パッケージが消える（`black`, `pylint`など） |
| コンテナや volume を削除した (`docker compose down -v`)                                   | ✅ **必要**          | volume ごと削除されるため、インストール済みパッケージが失われる             |
| `.devcontainer/devcontainer.json` の `postCreateCommand` が何らかの理由で実行されなかった | ✅ **必要**          | コマンドが失敗するとパッケージが入っていない可能性がある                    |
| VSCode の DevContainer 再構築時に `Rebuild Container` を選択                              | ✅ **必要**          | ベースイメージから再構築されるため開発パッケージが未インストール            |

---

#### 🛠 再セットアップが必要かどうかの**確認方法**

```
docker compose exec backend which black
```

- パスが表示されれば OK（例： `/usr/local/bin/black`）
- 表示されなければ再インストールが必要：

```
docker compose exec backend pip install -r requirements-dev.txt
```

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
