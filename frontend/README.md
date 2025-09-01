# 🌐 Frontend セットアップ (Next.js)

> **このREADMEの使い方**: フロントエンドの開発環境構築やセットアップ手順を確認したい時に参照してください。Next.js開発の開始時に使用します。

この README では `frontend` ディレクトリで必要なセットアップ手順をまとめています。

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
