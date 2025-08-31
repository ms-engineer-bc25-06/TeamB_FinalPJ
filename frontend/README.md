# 🌐 Frontend セットアップ (Next.js)

この README では `frontend` ディレクトリでの開発手順をまとめています。

## 📁 ディレクトリ構成

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (authed)/          # 認証済みユーザー専用ページ
│   │   │   ├── app/           # メインアプリケーション
│   │   │   │   ├── emotion-selection/     # 感情選択
│   │   │   │   ├── emotion-intensity/     # 感情強度
│   │   │   │   ├── emotion-confirmation/  # 感情確認
│   │   │   │   ├── emotion-education/     # 感情教育
│   │   │   │   ├── voice/                 # 音声録音
│   │   │   │   ├── report/                # レポート表示
│   │   │   │   ├── entries/               # 記録一覧
│   │   │   │   ├── roleplay/              # ロールプレイ
│   │   │   │   ├── non-cognitive/         # 非認知能力
│   │   │   │   ├── tips/                  # 使い方ガイド
│   │   │   │   ├── faq/                   # FAQ
│   │   │   │   ├── privacy/               # プライバシー
│   │   │   │   ├── usage/                 # 利用規約
│   │   │   │   ├── setup/                 # 初期設定
│   │   │   │   ├── payment/               # 決済
│   │   │   │   └── ...                    # その他機能
│   │   │   └── billing/                   # 課金管理
│   │   ├── (public)/          # 公開ページ
│   │   │   ├── login/         # ログイン
│   │   │   ├── subscription/  # サブスクリプション
│   │   │   └── help/          # ヘルプ
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── not-found.tsx      # 404ページ
│   │   └── page.module.css    # ホームページスタイル
│   ├── components/             # 再利用可能なUIコンポーネント
│   │   └── ui/                # 基本UIコンポーネント
│   │       ├── AudioPlayer.tsx    # 音声プレイヤー
│   │       ├── HamburgerMenu.tsx  # ハンバーガーメニュー
│   │       ├── SpeechBubble.tsx   # 吹き出し
│   │       ├── Spinner.tsx        # ローディングスピナー
│   │       ├── PrimaryButton.tsx  # プライマリボタン
│   │       ├── KokoronDefault.tsx # デフォルトキャラクター
│   │       ├── KokoronBowing.tsx  # お辞儀キャラクター
│   │       ├── Kokoron404.tsx     # 404キャラクター
│   │       ├── KokoronReadingReport.tsx # レポート読み取りキャラクター
│   │       └── index.ts           # エクスポート管理
│   ├── hooks/                  # カスタムフック
│   │   ├── useAudio.ts        # 音声操作フック
│   │   ├── useChildren.ts     # 子供情報管理フック
│   │   ├── useSubscription.ts # サブスクリプション管理フック
│   │   └── useTodayEntry.ts   # 今日の記録管理フック
│   ├── lib/                    # ユーティリティ・API
│   │   ├── api.ts             # API通信
│   │   ├── firebase.ts        # Firebase設定
│   │   ├── voice.ts           # 音声処理
│   │   └── fetcher.ts         # データフェッチング
│   ├── styles/                 # グローバルスタイル・テーマ
│   │   ├── globals.css        # グローバルCSS
│   │   └── theme.ts           # テーマ設定（色、サイズ、アニメーション）
│   ├── types/                  # TypeScript型定義
│   │   └── api.ts             # API関連の型定義
│   ├── utils/                  # ユーティリティ関数
│   │   └── audio.ts           # 音声処理ユーティリティ
│   └── contexts/               # React Context
│       └── AuthContext.tsx    # 認証状態管理
├── public/                     # 静的ファイル
│   ├── images/                 # 画像ファイル
│   │   ├── emotions/          # 感情アイコン（13種類）
│   │   ├── kokoron/           # キャラクター画像
│   │   ├── background.webp    # 背景画像
│   │   ├── roleplay.webp      # ロールプレイ画像
│   │   └── publictopbackground.webp # パブリックページ背景
│   └── sounds/                 # 音声ファイル
│       ├── characterAskFeeling01.mp3
│       ├── characterAskIntensity02.mp3
│       ├── characterAskReason04.mp3
│       ├── characterConfirmFeeling03.mp3
│       └── characterThankYou05.mp3
├── tests/                      # テストファイル
│   └── mocks/                 # モックファイル
├── docs/                       # フロントエンドドキュメント
│   └── README.md              # フロントエンド詳細説明
├── package.json                # 依存関係・スクリプト
├── tsconfig.json              # TypeScript設定
├── next.config.ts             # Next.js設定
├── middleware.ts              # ミドルウェア
├── eslint.config.mjs          # ESLint設定
├── .prettierrc.json           # Prettier設定
└── .prettierignore            # Prettier除外設定
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
- **Firebase**: 12.0.0
- **Stripe**: 7.8.0
- **SWR**: 2.3.4

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

## 11. デザインシステム

`src/styles/theme.ts` で統一されたデザインシステムを管理：

- **カラーパレット** - プライマリ、セカンダリ、感情カラー
- **スペーシング** - 統一された間隔管理
- **タイポグラフィ** - フォントサイズの階層
- **アニメーション** - トランジション設定
- **レスポンシブ** - ブレークポイント定義

- [UI Design](../docs/UIDesign.md) - 画面設計の詳細
