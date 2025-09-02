# 🌐 Frontend セットアップ (Next.js)

> **このREADMEの使い方**: フロントエンドの開発環境構築やセットアップ手順を確認したい時に参照してください。Next.js開発の開始時に使用します。

この README では `frontend` ディレクトリで必要なセットアップ手順をまとめています。

## 🚀 TL;DR（最短クイックスタート）

> **⚡ すぐに始めたい方はこちら！**
> 
> ```bash
> cd frontend
> cp .env.example .env.local  # Notion㊙️ページで値を設定
> npm install
> npm run dev
> # http://localhost:3000 でアクセス
> ```
> 
> これだけで開発環境が起動します！

## 📋 前提条件

### Node.js バージョン
- **Node.js**: v18.17.0 以降（Next.js 15.4.5の要件）
- **npm**: v9.0.0 以降（Node.jsに同梱）

### 主要フレームワーク・ライブラリ
- **Next.js**: 15.4.5（package.jsonで指定）
- **React**: 19.1.0（package.jsonで指定）
- **TypeScript**: ^5（package.jsonで指定）
- **Firebase**: ^12.0.0（package.jsonで指定）

### パッケージマネージャ
- **npm**: 標準パッケージマネージャ
- **yarn**: 使用可能（`yarn install`で代替）

## 🔐 環境変数（.env.local）

> **設定方法**: `.env.example`をコピーして`.env.local`を作成し、Notion㊙️ページの値を設定してください。

## 🔧 セットアップ手順

1. **環境変数ファイル設定**
   - `.env.example` をコピーして `.env.local` を作成
   - Notion ㊙️ページを参照し値を設定

2. **依存パッケージインストール**
   ```bash
   npm install
   ```

3. **開発サーバー起動**
   ```bash
   npm run dev
   ```

4. **動作確認**
   - ブラウザで http://localhost:3000 を開き動作確認

## 🛠️ よく使用するコマンド

```bash
# 開発
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動

# 品質管理
npm run lint     # ESLint実行
npx tsc --noEmit # 型チェック
```

## 📁 ディレクトリ構成

```
frontend/
├── src/
│   ├── app/           # Next.js App Router（認証済み・公開ページ）
│   ├── components/    # UIコンポーネント（Kokoron、ボタン等）
│   ├── hooks/         # カスタムフック（音声、認証等）
│   ├── lib/           # API通信・Firebase設定
│   ├── styles/        # グローバルスタイル・テーマ
│   ├── types/         # TypeScript型定義
│   ├── utils/         # ユーティリティ関数
│   └── contexts/      # React Context（認証状態管理）
├── public/            # 静的ファイル（画像・音声）
│   ├── images/        # 感情アイコン・キャラクター画像
│   └── sounds/        # 音声ファイル
└── tests/             # テストファイル
```

## 🔧 トラブルシュート

### よくある問題と解決方法

1. **`npm install`でエラーが発生する**
   - Node.jsのバージョンを確認（v18.17.0以降推奨）
   - `npm cache clean --force`でキャッシュをクリア

2. **`npm run dev`でポート3000が使用中**
   - 他のプロセスがポート3000を使用している可能性
   - `lsof -ti:3000 | xargs kill -9`でプロセスを終了

3. **環境変数が読み込まれない**
   - `.env.local`ファイルが正しい場所にあるか確認
   - ファイル名が`.env.local`（拡張子なし）になっているか確認

4. **TypeScriptエラーが発生する**
   - `npx tsc --noEmit`で型チェックを実行
   - `node_modules`を削除して`npm install`を再実行

5. **ビルドエラーが発生する**
   - `npm run build`で詳細なエラー情報を確認
   - 依存関係のバージョン競合がないか確認

## 📚 関連ドキュメント

### 開発・設計関連
- **技術スタック詳細について**: [Tech Stack](../docs/techStack.md) で詳細を確認してください
- **UI設計について**: [UI Design](../docs/UIDesign.md) で詳細を確認してください
- **テスト方法について**: [Test Plan](../docs/testPlan.md) で詳細を確認してください
- **API仕様について**: [API Specification](../docs/APISpecification.md) で詳細を確認してください

### 設定・運用関連
- **開発ガイドラインについて**: [Dev Guideline](../docs/devGuideline.md) で詳細を確認してください
- **セキュリティ設計について**: [Security Design](../docs/securityDesign.md) で詳細を確認してください
- **性能設計について**: [Performance Design](../docs/performanceDesign.md) で詳細を確認してください