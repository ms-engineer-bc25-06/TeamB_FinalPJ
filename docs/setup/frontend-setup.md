# 🌐 Frontend 詳細セットアップガイド

このドキュメントでは、フロントエンドの詳細なセットアップ手順を説明します。

## 🔧 詳細セットアップ手順

### 1. 環境変数ファイルの設定

`frontend`ディレクトリに移動し、`.env.example`ファイルを使って`.env.local`という名前のファイルを作成します。

`.env.local`の中身については Notion の㊙️ページをご覧ください。

### 2. 依存パッケージのインストール

`frontend`ディレクトリで、以下のコマンドを実行します。

```bash
npm install
```

### 3. 開発サーバーの起動

`npm install`が完了したら、以下のコマンドで開発サーバーを起動します。

```bash
npm run dev
```

### 4. 動作確認

Web ブラウザで `http://localhost:3000` にアクセスし、アプリケーションのトップページが表示されれば成功です。

## 🧪 テスト実行

### 全テスト実行

```bash
npm test
```

### 特定のテストファイル実行

```bash
npm test -- EmotionSelectionPage.test.tsx
```

### テストカバレッジ

```bash
npm run test:coverage
```

## 🏗️ ビルド・リンター

### 本番ビルド

```bash
npm run build
```

### リンター実行

```bash
npm run lint
```

### 型チェック

```bash
npx tsc --noEmit
```

## 🔧 今回の修正内容

### ESLint警告の修正

- 未使用の変数・インポートの削除
- `any`型の適切な型への置き換え
- 未使用の関数の削除

### コンポーネントの最適化

- `AudioPlayer`のエクスポート問題を修正
- `HamburgerMenu`の使用方法を簡素化
- `SpeechBubble`の未使用インポートを削除

### フックの最適化

- `useAudio`フックの簡素化
- 未使用の型定義の削除

## 🗄️ S3 連携

### 概要

音声・テキストファイルは S3 に保存

Presigned URL を使用して安全にアップロード

### アップロード例

```javascript
const res = await fetch("/voice/get-upload-url", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: 1, file_type: "audio", file_format: "webm" }),
});
const { upload_url, content_type } = await res.json();

await fetch(upload_url, {
  method: "PUT",
  headers: { "Content-Type": content_type },
  body: fileBlob,
});
```

## 🛠️ 利用可能なスクリプト

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint実行
```

## ⚙️ 設定ファイル

- **ESLint**: `eslint.config.mjs` (Next.js推奨設定)
- **Prettier**: `.prettierrc.json` (コード整形)
- **TypeScript**: `tsconfig.json` (型チェック設定)
- **Next.js**: `next.config.ts` (フレームワーク設定)

## 📚 開発環境

- **Node.js**: v18.17.0+
- **Next.js**: 15.4.5
- **React**: 19.1.0
- **TypeScript**: 5.x
- **ESLint**: 9.x
- **Prettier**: 3.6.2
- **MUI**: 7.2.0 (Material-UI)
- **Firebase**: 12.0.0
- **Stripe**: 7.8.0

## 🎨 主要ライブラリ

### UI フレームワーク
- **Material-UI (MUI)**: 7.2.0 - モダンなUIコンポーネントライブラリ
- **Emotion**: 11.14.0 - CSS-in-JSライブラリ

### 状態管理・データフェッチング
- **SWR**: 2.3.4 - データフェッチングライブラリ
- **React Hooks**: カスタムフックによる状態管理

### 外部サービス連携
- **Firebase**: 12.0.0 - 認証・データベース
- **Stripe**: 7.8.0 - 決済処理
- **Day.js**: 1.11.13 - 日付処理

### 開発ツール
- **ESLint**: 9.x - コード品質チェック
- **Prettier**: 3.6.2 - コード整形
- **TypeScript**: 5.x - 型安全性

## 🚀 開発フロー

### 1. 開発開始
```bash
cd frontend
npm install
npm run dev
```

### 2. 開発中
- コード編集
- ブラウザで確認
- ESLint・Prettierで自動整形

### 3. テスト
```bash
npm test
npm run test:coverage
```

### 4. 本番ビルド
```bash
npm run build
npm run start
```

## 🔍 トラブルシューティング

### よくある問題

#### 1. 依存関係のエラー
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 2. TypeScriptエラー
```bash
npx tsc --noEmit
```

#### 3. ESLintエラー
```bash
npm run lint
```

#### 4. ビルドエラー
```bash
npm run build
```

### デバッグ方法

1. ブラウザの開発者ツールでコンソールエラーを確認
2. ネットワークタブでAPI通信を確認
3. React Developer Toolsでコンポーネントの状態を確認
4. TypeScriptの型エラーを確認
