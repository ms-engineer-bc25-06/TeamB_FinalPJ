# 🌐 Frontend セットアップ (Next.js)

この README では `frontend` ディレクトリで必要なセットアップ手順をまとめています。

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

## 🔧 セットアップ手順

### 前提条件

1. **環境変数ファイル設定**
   - `.env.example` をコピーして `.env.local` を作成
   - Notion ㊙️ページを参照し値を設定

### 起動手順

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
