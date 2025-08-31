# 🌐 Frontend セットアップ (Next.js)

この README では `frontend` ディレクトリでの開発手順をまとめています。

## 📁 ディレクトリ構成

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authed)/          # 認証済みユーザー専用ページ
│   │   │   └── app/           # メインアプリケーション
│   │   │       ├── emotion-selection/     # 感情選択
│   │   │       ├── emotion-intensity/     # 感情強度
│   │   │       ├── emotion-confirmation/  # 感情確認
│   │   │       ├── emotion-education/     # 感情教育
│   │   │       ├── voice/                 # 音声録音
│   │   │       ├── report/                # レポート表示
│   │   │       └── ...                    # その他機能
│   │   ├── (public)/          # 公開ページ
│   │   │   ├── login/         # ログイン
│   │   │   └── subscription/  # サブスクリプション
│   │   └── layout.tsx         # ルートレイアウト
│   ├── components/             # 再利用可能なUIコンポーネント
│   │   └── ui/                # 基本UIコンポーネント
│   │       ├── AudioPlayer.tsx    # 音声プレイヤー
│   │       ├── HamburgerMenu.tsx  # ハンバーガーメニュー
│   │       ├── SpeechBubble.tsx   # 吹き出し
│   │       └── ...                # その他コンポーネント
│   ├── hooks/                  # カスタムフック
│   │   ├── useAudio.ts        # 音声操作フック
│   │   ├── useChildren.ts     # 子供情報管理フック
│   │   └── useSubscription.ts # サブスクリプション管理フック
│   ├── lib/                    # ユーティリティ・API
│   │   ├── api.ts             # API通信
│   │   ├── firebase.ts        # Firebase設定
│   │   └── voice.ts           # 音声処理
│   ├── styles/                 # グローバルスタイル・テーマ
│   │   ├── globals.css        # グローバルCSS
│   │   └── theme.ts           # テーマ設定
│   └── types/                  # TypeScript型定義
│       └── api.ts             # API関連の型定義
├── public/                     # 静的ファイル
│   ├── images/                 # 画像ファイル
│   │   ├── emotions/          # 感情アイコン
│   │   ├── kokoron/           # キャラクター画像
│   │   └── ...                # その他画像
│   └── sounds/                 # 音声ファイル
├── tests/                      # テストファイル
│   └── components/             # コンポーネントテスト
└── package.json                # 依存関係・スクリプト
```

## 1. 環境変数ファイル設定

- `.env.example` をコピーして `.env.local` を作成
- Notion ㊙️ページを参照し値を設定

## 2. 依存パッケージインストール

```bash
npm install
```

## 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開き動作確認

## 4. テスト実行

```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- EmotionSelectionPage.test.tsx

# テストカバレッジ
npm run test:coverage
```

## 5. ビルド・リンター

```bash
# 本番ビルド
npm run build

# リンター実行
npm run lint

# 型チェック
npx tsc --noEmit
```

## 6. 今回の修正内容

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

## 7. S3 連携

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

## 8. 開発環境

- **Node.js**: v18.17.0+
- **Next.js**: 15.4.5
- **React**: 19.1.0
- **TypeScript**: 5.x
- **ESLint**: 9.x
- **Prettier**: 3.6.2
- **MUI**: 7.2.0 (Material-UI)
- **Firebase**: 12.0.0
- **Stripe**: 7.8.0

## 9. 利用可能なスクリプト

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
npm run start    # 本番サーバー起動
npm run lint     # ESLint実行
```

## 10. 設定ファイル

- **ESLint**: `eslint.config.mjs` (Next.js推奨設定)
- **Prettier**: `.prettierrc.json` (コード整形)
- **TypeScript**: `tsconfig.json` (型チェック設定)
- **Next.js**: `next.config.ts` (フレームワーク設定)
