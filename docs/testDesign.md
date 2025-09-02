# テスト設計書
<!-- 新機能追加もしくは内容訂正する場合、「TODO:」で検索してテスト設計の編集箇所を確認してください -->

## ドキュメントの役割

このドキュメントは、本プロジェクトで採用しているテスト戦略・テストフレームワーク・テスト環境の設計方針をまとめたものです。

## 目次

1. [概要](#概要)
2. [テスト戦略](#テスト戦略)
3. [セットアップ手順](#セットアップ手順)
4. [フロントエンド テスト設計](#フロントエンド-テスト設計)
5. [バックエンド テスト設計](#バックエンド-テスト設計)
6. [E2E テスト設計](#e2e-テスト設計)
7. [CI/CD テスト戦略](#cicd-テスト戦略)
8. [テスト実行環境](#テスト実行環境)
9. [テストデータ管理](#テストデータ管理)
10. [パフォーマンス目標](#パフォーマンス目標)
11. [メンテナンス方針](#メンテナンス方針)

## 概要

きもちみっけ！のテスト戦略とテスト環境の設計について記載します。

## テスト戦略

### テストピラミッド

```
        E2E Tests (Playwright)
     /                        \
   Integration Tests           \
  /                             \
Unit Tests (Vitest + Pytest)     \
```

- **Unit Tests (70%)**: 個別のコンポーネント・関数のテスト
- **Integration Tests (20%)**: API連携、データベース操作のテスト  
- **E2E Tests (10%)**: ユーザーフローの総合テスト

[↑ 目次に戻る](#目次)

## フロントエンド テスト設計
**この章のゴール**: UI/状態/音声UIの単体・結合テスト方針を定義する

### 技術スタック
- **テストフレームワーク**: Vitest
- **テストライブラリ**: React Testing Library
- **モック**: vi (Vitest built-in)
- **テスト環境**: JSDOM

### テスト対象

#### 🎯 高優先度（MVPに照らし合わせて設定）
- **認証フロー**: ログイン、ログアウト、認証状態管理
- **音声録音機能**: 録音開始/停止、音声ファイル処理
- **感情選択**: 感情カード選択、強度設定
- **ロールプレイページ**: 感情シナリオ表示、感情カード選択、アドバイス表示
- **レポート機能**: 日次・週次レポート表示、感情データ一覧、音声再生
<!-- TODO: 新機能追加もしくは内容訂正する場合: 高優先度テストは MVP の核となる機能のみ記載してください -->

#### 🔸 中優先度
- **サブスクリプション管理**: 課金状態チェック、トライアル管理
- **フォーム処理**: バリデーション、送信処理
- **ナビゲーション**: ルーティング、認証ガード
- **状態管理**: カスタムフック、コンテキスト
- **エラーハンドリング**: エラー表示、回復処理
<!-- TODO: 新機能追加もしくは内容訂正する場合: ユーザー体験に重要だが MVP には含まれない機能を記載してください -->

#### 🔹 低優先度（必要に応じて）
- **UIコンポーネント**: ボタン、アイコン、レイアウト
- **ユーティリティ関数**: 日付処理、文字列処理
<!-- TODO: 新機能追加もしくは内容訂正する場合: 補助的な機能や内部ユーティリティをここに記載してください -->

### テストファイル構成
<!-- TODO: 新機能追加もしくは内容訂正する場合: ここにテストファイルを記載してください -->
```text
frontend/src/
├── __tests__/
│   ├── example.test.tsx        # サンプルテスト（導入済み）
│   ├── pages/
│   │   ├── VoicePage.test.tsx         # 音声録音ページテスト（計画中）
│   │   ├── EmotionSelectionPage.test.tsx  # 感情選択ページテスト（計画中）
│   │   ├── RoleplayPage.test.tsx      # ロールプレイページテスト（計画中）
│   │   └── ReportPage.test.tsx        # レポートページテスト（計画中）
│   │   
│   ├── hooks/
│   │   └── useAudio.test.ts               # 音声フックテスト（計画中）
│   │   
│   ├── contexts/
│   │   └── AuthContext.test.tsx           # 認証コンテキストテスト（計画中）
│   │   
│   └── lib/
│       └── voice.test.ts                  # 音声処理ライブラリテスト（計画中）
│       
└── test/
    └── vitest.setup.ts                    # Vitestセットアップファイル（導入済み）
```

### モック戦略

#### **基本的なモック対象**
- **Firebase**: 認証、データベース操作をモック
- **Next.js Router**: ナビゲーション処理をモック
- **Web APIs**: `matchMedia`, `navigator.mediaDevices`をモック
- **外部API**: Stripe、音声認識APIをモック

#### **音声系テストの堅牢なモック（計画中）**
- **ブラウザAPI**: `navigator.mediaDevices.getUserMedia` / `MediaRecorder` を完全モック（計画中）
- **固定バイナリ**: 短いテスト用WebMファイルをリポジトリに同梱（計画中）
- **バックエンド**: Whisper呼び出しを関数レベルでモック（計画中）



[↑ 目次に戻る](#目次)

## バックエンド テスト設計
**この章のゴール**: API/データベース/外部サービス連携の単体・結合テスト方針を定義する

### 技術スタック
- **テストフレームワーク**: Pytest
- **非同期テスト**: pytest-asyncio
- **HTTPクライアント**: httpx
- **カバレッジ**: pytest-cov
- **テストDB**: PostgreSQL (Docker環境内)
- **設定管理**: pyproject.toml

### テスト対象

#### 🎯 高優先度（MVPに照らし合わせて設定）
- **認証・認可**: Firebase認証、権限チェック、ユーザー管理
- **音声処理API**: Whisper連携、音声ファイル処理、音声認識
- **感情データAPI**: 感情カード取得、感情ログ保存、強度管理、日次・週次・月次データ取得
  <!-- NOTE: 分担的にはレポート機能を独立したAPIに分離するのが望ましいが、9/8(月)のコード提出期限を鑑み現状維持としたい。-->
- **データベース操作**: CRUD操作、トランザクション管理
<!-- TODO: 新機能追加もしくは内容訂正する場合: 高優先度は MVP の核となる API のみ記載してください -->

#### 🔸 中優先度（計画中）
- **サブスクリプション管理**: Stripe連携、課金状態チェック、トライアル管理
- **外部サービス連携**: S3ファイル操作、Firebase連携
- **バリデーション**: Pydanticスキーマ、入力値検証
- **エラーハンドリング**: 例外処理、HTTPエラーレスポンス
- **ビジネスロジック**: 感情分析、データ変換処理
<!-- TODO: 新機能追加もしくは内容訂正する場合: ユーザー体験に重要だが MVP には含まれない API をここに記載してください -->

#### 🔹 低優先度（必要に応じて）
- **ユーティリティ関数**: ヘルパー関数、共通処理
- **設定管理**: 環境変数読み込み、設定ファイル処理
<!-- TODO: 新機能追加もしくは内容訂正する場合: 補助的な機能や内部ユーティリティをここに記載してください -->

### テストファイル構成
<!-- TODO: 新機能追加もしくは内容訂正する場合: test_[機能名].py を記載してください -->
```text
backend/
├── pyproject.toml           # Pytest設定・プロジェクトメタデータ
├── tests/
│   ├── conftest.py         # 共通フィクスチャ・DB設定
│   ├── test_example.py     # サンプルテスト（導入済み）
│   ├── test_auth.py        # 認証関連テスト（計画中）
│   ├── test_voice_api.py   # 音声API テスト（計画中）
│   ├── test_emotion_api.py # 感情API テスト（計画中）
│   └── test_database.py    # DB操作テスト（計画中）
│   
├── requirements.txt        # 本番依存関係（Docker用）
└── requirements-dev.txt    # 開発依存関係（Docker用）
```

### テストデータ戦略

#### **データベーステスト戦略**
- **テスト用DB**: 既存PostgreSQLコンテナを活用（test_teamb_db使用）
- **非同期対応**: SQLAlchemy 2.0 + asyncio完全対応
- **トランザクション分離**: 各テストで独立したデータベース状態
- **自動クリーンアップ**: テスト後の自動テーブル削除

#### **テストデータ管理**
- **フィクスチャ**: 再利用可能なテストデータ（conftest.py）
- **ファクトリ**: 動的テストデータ生成
- **モック**: 外部サービス（Firebase、Stripe、S3）のレスポンス

#### **Docker環境での注意点**
- **環境変数**: テスト用設定の分離
- **ファイル出力**: カバレッジレポートのホストアクセス
- **ネットワーク**: コンテナ間通信の設定

### 現在の導入状況

- **Pytest設定**: `pyproject.toml`で管理
- **依存関係**: `requirements-dev.txt`にテストライブラリ追加
- **PostgreSQL統合**: 本番環境と同一のPostgreSQL + 非同期SQLAlchemy使用
- **基本フィクスチャ**: `conftest.py`で非同期DB・HTTPクライアント設定
- **サンプルテスト**: `test_example.py`で動作確認可能（非同期対応）
- **Docker統合**: 既存コンテナ環境でPytest実行可能
- **環境変数管理**: テスト用モック設定の分離

#### **🔧 設定詳細**
```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = [
    "--strict-markers",
    "--strict-config", 
    "--verbose",
    "--cov=app",
    "--cov-report=term-missing",
    "--cov-report=html:htmlcov",
    "--cov-report=xml",
    "--cov-fail-under=80",
]
asyncio_mode = "auto"
markers = [
    "unit: Unit tests",
    "integration: Integration tests", 
    "slow: Slow running tests",
]
```

#### **🚧 今後の実装予定**
- **実際のAPIテスト**: 各エンドポイントのテスト作成
- **データベーステスト**: モデル・CRUD操作のテスト
- **外部サービスモック**: Firebase・Stripe・S3のモック実装
- **統合テスト**: API間連携のテスト

#### **📝 他メンバー担当機能のテスト計画**
**※ 新しい機能のテスト内容は以下に追加してください**

<!-- 
TODO: 新機能テスト追加テンプレート:
以下の形式でテスト計画を追加してください

- **[機能名]テスト**: [具体的なテスト内容・対象]
  - テスト対象: [API/DB/ビジネスロジック等]
  - テスト方針: [単体/統合/E2E]
  - 担当者: [担当者名]
  
  **テスト品質チェックリスト:**
  - [ ] ユースケースやクリティカルパスを考慮したテストになっている
  - [ ] 正常系/異常系の考慮がなされたテストケースがある
  - [ ] テストコードが記載されており、正常系・異常系が含まれている
  - [ ] Mockなどを使って依存度の低いテストコードが書かれている
  
  **異常系・境界値テスト観点（例）:**
  - 認証機能: トークン期限切れ→自動リフレッシュ/再ログイン導線
  - ネットワーク通信: fetch失敗→リトライ/backoff→UI通知
  - フォーム入力: 予約語・長文・絵文字混在の入力値
  - 日時処理: タイムゾーン（Asia/Tokyo）と日跨ぎ（日次/週次集計の境界）
  - 音声機能: 0バイト/長尺/非対応コーデックのアップロード
  - 決済機能: Webhooks遅延/重複/失敗の冪等性確認
  - DB操作: ユニーク制約/外部キー違反/ON DELETEの期待動作
  ※ 機能に応じて検討してください。
-->

```markdown
<!-- ここに新機能のテスト計画を追加 -->
```

#### **⚠️ Docker環境での注意事項**
- **データベース**: PostgreSQL（本番環境と同一）でテスト用データベース使用
- **環境変数**: テスト用設定の分離（モック認証情報使用）
- **ファイル出力**: カバレッジレポートのホストアクセス設定
- **外部サービス**: 本番APIキーの分離（モック値使用）

[↑ 目次に戻る](#目次)

## E2E テスト設計 
**この章のゴール**: ユーザーフロー全体の統合テスト方針を定義する

### 技術スタック
- **テストフレームワーク**: Playwright
- **ブラウザ**: Chromium, Firefox, WebKit
- **モバイル**: iOS Safari, Android Chrome

### テスト対象

#### 🎯 クリティカルパス（必須）
1. **ユーザー登録・ログインフロー**
2. **音声録音から感情選択までの完全フロー**
3. **サブスクリプション購入フロー**
4. **レポート閲覧フロー**

#### 🔸 重要機能（推奨）
- **設定変更フロー**
- **エラー状態の表示**
- **レスポンシブデザイン**

### テストファイル構成

```text
プロジェクトルート/
├── e2e/                        # E2Eテストディレクトリ
│   ├── login.spec.ts           # ログインフローテスト（導入済み）
│   ├── subscription.spec.ts    # サブスクリプション遷移テスト（導入済み）
│   └── utils/
│       └── auth.ts             # 認証ヘルパー関数（導入済み）
├── playwright.config.ts        # Playwright設定ファイル（導入済み）
└── frontend/
    └── package.json            # E2Eテストスクリプト設定（導入済み）
```

**📍 配置の理由**:
- **統合テストの性質**: フロントエンド・バックエンド両方を横断的にテスト
- **独立性**: UI層・API層・DB層すべてを含む統合的なテスト層として独立
- **保守性**: フロントエンド・バックエンドの変更に依存しない中立的な位置

**📋 今後の拡張予定**:
<!-- TODO: 新機能追加もしくは内容訂正する場合: テストファイルを追加もしくは訂正してください -->
```text
e2e/ (拡張計画)
├── auth/
│   ├── registration.spec.ts    # ユーザー登録フローテスト（計画中）
│   └── logout.spec.ts          # ログアウトフローテスト（計画中）
├── voice/
│   ├── recording.spec.ts       # 音声録音フローテスト（計画中）
│   └── emotion-selection.spec.ts # 感情選択フローテスト（計画中）
├── roleplay/
│   └── emotion-advice.spec.ts  # ロールプレイ感情アドバイステスト（計画中）
├── subscription/
│   ├── purchase.spec.ts        # サブスク購入フローテスト（計画中）
│   └── trial.spec.ts           # トライアルフローテスト（計画中）
├── report/
│   ├── daily-report.spec.ts    # 日次レポート表示テスト（計画中）
│   └── weekly-report.spec.ts   # 週次レポート表示テスト（計画中）
└── utils/
    ├── helpers.ts              # テストヘルパー関数（計画中）
    └── fixtures.ts             # テストフィクスチャ（計画中）
```

### 外部サービス（Auth/Stripe）の扱い
このプロジェクトのE2Eは**Emulator/固定データで代替**し、実サービスの本流は**手動回帰**で担保する。（計画中）

#### **外部サービス依存の回避**
- **CI環境**: Firebase Auth Emulator を使用し、`storageState` を使ってログイン済み状態を再利用（計画中）
- **CI環境**: Stripe は「サブスク状態=active」のテストデータを事前投入し、Checkout 実行自体はスキップ（計画中）
- **手動回帰(ステージング)**: Google/Stripeの実フローを週1回/リリース前に実施（チェックリスト化）（計画中）

#### **ログイン状態の再利用例**
```typescript
// e2e/utils/auth.ts
import { test as setup, expect } from '@playwright/test';

setup('auth: storage state', async ({ page }) => {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(process.env.E2E_TEST_USER_EMAIL!);
  await page.getByTestId('login-password').fill(process.env.E2E_TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /ログイン/ }).click();
  await page.waitForURL(/dashboard|subscription/);
  await page.context().storageState({ path: 'e2e/.auth/state.json' });
});
```

### 実行コマンド・設定ファイル

#### **実行コマンド（package.json）**
```bash
npm run test:e2e         # ヘッドレスモード
npm run test:e2e:ui      # UIモード  
npm run test:e2e:headed  # ブラウザ表示モード
npm run test:e2e:debug   # デバッグモード
npm run test:e2e:staging # ステージング環境
npm run test:e2e:production # 本番環境
```

#### **設定ファイル**
- **playwright.config.ts**: Playwright設定（環境変数対応、キャッシュ最適化済み）
- **frontend/.env.e2e.local**: 環境変数テンプレート（.env.e2e.example）を元にNotionを参照して各自作成すること

[↑ 目次に戻る](#目次)

## CI/CD テスト戦略
**この章のゴール**: GitHub Actions による自動テスト・デプロイメント戦略を定義する

### パイプライン構成

#### **🚀 最適化されたCI/CD戦略**
1. **スマート実行**: 変更ファイルに応じて必要なテストのみ実行
2. **並列実行**: フロントエンド・バックエンドテストを並列実行  
3. **段階実行**: Unit → Integration → E2E の順序
4. **無駄削減**: PR連投時の自動キャンセル機能
5. **ブランチ戦略**: main/developブランチでの自動実行

#### **🔧 技術的改善点**
- **PostgreSQL統一**: 本番環境と同じv17.5-alpine使用
- **Codecov安定化**: プライベートリポジトリ対応 + 失敗時非ブロック
- **ログ収集強化**: PostgreSQL・Backend・Frontendの詳細ログ保存
- **Playwrightキャッシュ**: ブラウザ再ダウンロードを回避して高速化
- **API参照先固定**: `NEXT_PUBLIC_API_BASE_URL`で本番/CI差分を解消
- **プロセス管理**: 明示的cleanup でリソースリーク防止

### カバレッジ目標

- **フロントエンド**: 70%以上
- **バックエンド**: 80%以上
- **クリティカルパス**: 100%

### **📊 カバレッジレポートの活用方法**

#### **🎯 ローカル開発時**
```bash
# フロントエンド
cd frontend
npm run test:coverage
open coverage/index.html

# バックエンド  
cd backend
docker compose exec backend pytest --cov=app
open htmlcov/index.html
```

#### **☁️ CI/CD環境**
- **自動生成**: 全テスト実行時にカバレッジレポート自動作成
- **Codecov連携**: プルリクエストでカバレッジ変化を可視化
- **アーティファクト**: 失敗時もレポートをGitHub Actionsで保存

#### **📈 カバレッジ改善のポイント**
- **未カバー箇所の特定**: HTMLレポートで赤色部分を優先対応
- **重要度による優先順位**: クリティカルパス > ビジネスロジック > UI
- **段階的改善**: 目標値に向けて継続的にカバレッジ向上

### 失敗時の対応

#### **📋 包括的ログ収集**
- **スクリーンショット**: E2Eテスト失敗時に自動保存
- **ビデオ録画**: 複雑なフロー失敗時の記録
- **バックエンドログ**: uvicornサーバーの詳細ログ
- **フロントエンドログ**: Next.jsサーバーの起動・エラーログ
- **PostgreSQLログ**: データベースコンテナのログ
- **Playwrightレポート**: テスト実行結果の詳細レポート

#### **🛠️ 障害切り分け機能**
- **ヘルスチェック**: Backend/Frontend起動の確実な検証
- **タイムアウト設定**: 各ジョブの明示的な制限時間
- **プロセス管理**: 明示的なkillによる確実なクリーンアップ
- **アーティファクト保存**: 失敗時ログの7日間保存

### GitHub Actions Secrets 設定

#### E2Eテスト用認証情報

実際のGoogleアカウントを使用したE2Eテストを GitHub Actions で実行するため、以下のSecretsを設定する必要があります。

**設定手順**:
1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** で以下の値を追加

**必要なSecrets**:
```
E2E_TEST_USER_EMAIL     # テスト用Gmailアドレス（Notionから取得）
E2E_TEST_USER_PASSWORD  # テスト用パスワード（Notionから取得）
CODECOV_TOKEN          # Codecovアップロード用トークン（プライベートリポジトリの場合）
```

**GitHub Actions での使用例**:
```yaml
# .github/workflows/e2e.yml
jobs:
  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - name: Run E2E tests
        env:
          E2E_TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
          E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
        run: |
          cd frontend
          npm run test:e2e
```

#### **シークレット運用ルール（計画中）**

**管理権限**:
- **誰が**: Owner 2名のみ編集可（計画中）
- **いつ**: パスワード回転は月1・漏洩疑い時は即時（計画中）
- **どうやって**: 回転時はPRテンプレに記録（"rotated on YYYY-MM-DD by @user"）（計画中）
- **禁止事項**: PR/Issue/ログへの平文出力禁止。レビューで `console.log(process.env...)` を弾くESLintルールをON（計画中）

**⚠️ セキュリティ注意事項**:
- Secretsの値は **Notionの「テスト用アカウント」** から取得してください
- Secrets は暗号化されており、ログには表示されません
- リポジトリの管理者権限が必要です

#### **🔧 CI/CD設定の詳細**

**環境変数制御**:
```yaml
# 自動設定される環境変数
NEXT_PUBLIC_API_BASE_URL: http://localhost:8000  # API参照先固定
PLAYWRIGHT_BASE_URL: http://localhost:3000       # E2Eテスト対象URL
PORT: 3000                                       # フロントエンドポート固定
```

**パフォーマンス最適化**:
- **変更検出**: `dorny/paths-filter`で変更領域のみテスト実行
- **Playwrightキャッシュ**: ブラウザの再ダウンロード回避
- **並列キャンセル**: PR連投時の無駄なランナー消費防止
- **タイムアウト設定**: フロントエンド15分、バックエンド20分、E2E30分

#### その他のCI/CD用Secrets（必要に応じて）

```
STAGING_URL              # ステージング環境URL
PRODUCTION_URL           # 本番環境URL（慎重に使用）
```

[↑ 目次に戻る](#目次)

## セットアップ手順

### 初回セットアップ（新メンバー向け）

#### 1. フロントエンド環境構築
```bash
cd frontend
npm install                    # 依存関係インストール
```

#### 2. バックエンド環境構築（Docker使用）
```bash
cd backend
docker compose up -d              # コンテナ起動（バックグラウンド）
# または
docker compose up --build -d      # 初回ビルド付きで起動

# Pytest依存関係の確認（コンテナ内）
docker compose exec backend pip list | grep pytest
```

#### 3. E2Eテスト環境構築（🚨 各メンバー必須）

**方法1：自動インストール（推奨）**
```bash
cd frontend
npm install  # postinstallスクリプトで自動的にPlaywrightブラウザもインストール
```

**方法2：手動インストール**
```bash
cd frontend
SKIP_PLAYWRIGHT=true npm install  # Playwrightをスキップ
npm run playwright:install        # 後で手動インストール
```

**⚠️ 重要**：Playwrightブラウザインストールは**各開発者が個別に実行**必須
- **理由**：Chromium/WebKit ブラウザバイナリをローカルマシンにダウンロード
- **容量**：約500MB〜1GB（初回のみ）
- **頻度**：Playwright バージョンアップ時のみ再実行
- **スキップ不可**：このステップを飛ばすとE2Eテストが実行できません

**💡 確認方法**：
```bash
# インストール状況確認
npx playwright --version
# ブラウザ一覧確認  
npx playwright install --dry-run
```

### 動作確認
```bash
# フロントエンド：サンプルテストの実行
cd frontend && npm run test:run

# バックエンド：サンプルテストの実行（コンテナ内）
cd backend && docker compose exec backend pytest tests/test_example.py

# E2E：サンプルテストの実行
cd frontend && npm run test:e2e
```

## テスト実行環境

### ローカル開発

#### フロントエンド（Vitest）
```bash
npm run test              # ウォッチモード - コード変更を監視して自動実行
npm run test:run          # 一回実行 - 全テストを一度だけ実行
npm run test:ui           # UIモード - ブラウザでテスト結果を可視化
npm run test:coverage     # カバレッジ付き実行 - コードカバレッジレポート生成
```
**実行されるテスト**: Reactコンポーネント、カスタムフック、ユーティリティ関数のユニットテスト

**📊 カバレッジレポートの確認方法**:
```bash
# カバレッジ実行後、以下でレポート確認
open coverage/index.html        # ブラウザでHTMLレポート表示
cat coverage/coverage-summary.json  # JSONサマリー表示
```
**出力先**: `frontend/coverage/` ディレクトリに詳細レポート生成

#### バックエンド（Pytest - Docker内実行）
```bash
# コンテナが起動していることを確認
docker compose ps

# テスト実行（コンテナ内）
docker compose exec backend pytest                    # 全テスト実行 - 全てのテストファイルを実行
docker compose exec backend pytest -v                # 詳細出力 - テスト名と結果の詳細表示
docker compose exec backend pytest --cov=app         # カバレッジ付き実行 - コードカバレッジレポート生成
docker compose exec backend pytest -m unit           # ユニットテストのみ - @pytest.mark.unitが付いたテストのみ
docker compose exec backend pytest -m integration    # 統合テストのみ - @pytest.mark.integrationが付いたテストのみ
docker compose exec backend pytest tests/test_voice_api.py  # 特定ファイルのみ - 指定したテストファイルのみ実行

# コンテナ停止（作業終了時）
docker compose down
```
**実行されるテスト**: FastAPI エンドポイント、データベース操作、ビジネスロジック、外部API連携のテスト

**📊 カバレッジレポートの確認方法**:
```bash
# カバレッジ実行後、以下でレポート確認
open backend/htmlcov/index.html     # ブラウザでHTMLレポート表示
cat backend/coverage.xml            # XML形式レポート（CI用）

# コンテナ内からホストにファイルコピー（必要に応じて）
docker compose cp backend:/app/htmlcov ./backend/htmlcov
docker compose cp backend:/app/coverage.xml ./backend/coverage.xml
```
**出力先**: 
- `backend/htmlcov/` - 詳細HTMLレポート
- `backend/coverage.xml` - CI/CD用XMLレポート
- ターミナル - 不足行の詳細表示

#### E2E（Playwright）
```bash
npm run test:e2e         # ヘッドレスモード - バックグラウンドでブラウザテスト実行
npm run test:e2e:headed  # ブラウザ表示モード - 実際のブラウザ画面を見ながらテスト実行
npm run test:e2e:ui      # UIモード - Playwrightの専用UIでテスト管理・実行
npm run test:e2e:debug   # デバッグモード - ステップ実行でテストをデバッグ
```
**実行されるテスト**: ユーザーの実際の操作フローを模擬した統合テスト（ログイン→音声録音→感情選択→レポート閲覧など）

### CI環境

#### **🖥️ 実行環境**
- **本番環境と統一**

#### **⚡ CI/CD最適化機能**
- **スマート実行**: 変更ファイルに応じた選択的テスト実行
- **キャッシュ戦略**: npm、pip、Playwrightブラウザのキャッシュ
- **並列処理**: フロントエンド・バックエンドテストの並列実行
- **リソース管理**: タイムアウト設定とプロセスクリーンアップ

#### **🔍 監視・デバッグ**
- **詳細ログ**: Backend、Frontend、PostgreSQLの包括的ログ収集
- **アーティファクト**: 失敗時の詳細情報を7-30日保存
- **ヘルスチェック**: サーバー起動の確実な検証

[↑ 目次に戻る](#目次)

## テストデータ管理

### テスト専用アカウント

#### 実アカウントを使用したE2Eテスト
本プロジェクトでは、実際のGoogleアカウントを使用したサインイン機能のテストを行うため、テスト専用のGoogleアカウントを作成しています。

**⚠️ 重要** : テスト用アカウントの認証情報（メールアドレス・パスワード）は、セキュリティ上の理由により、Notionの「テスト用アカウント」に記載されています。

**使用用途**:
- 実際のGoogle認証フローのテスト
- Firebase Authenticationとの連携テスト
- ユーザー登録・ログイン機能の統合テスト
- 認証が必要な機能のE2Eテスト

**注意事項**:
- テスト専用アカウントは本番データと完全に分離されています。
- パスワード等の機密情報はリポジトリには含めず、Notionで管理します。

### フロントエンド
- **MSW**: API レスポンスのモック
- **テストフィクスチャ**: 再利用可能なテストデータ

### バックエンド
- **テスト用DB**: PostgreSQL (Docker環境内)
- **シードデータ**: 各テストで独立したデータ
- **クリーンアップ**: テスト後の自動データ削除
- **Docker統合**: 既存コンテナインフラを活用

[↑ 目次に戻る](#目次)

## パフォーマンス目標

### **🎯 実行時間目標**
- **Unit Tests**: 30秒以内
- **Integration Tests**: 2分以内  
- **E2E Tests**: 5分以内
- **全体**: 10分以内

### **⚡ 最適化による改善効果**
- **変更検出**: 不要なテストスキップで最大70%短縮
- **Playwrightキャッシュ**: ブラウザダウンロード時間2-3分短縮
- **並列実行**: フロントエンド・バックエンド同時実行で40%短縮
- **キャンセル機能**: PR連投時の無駄な実行を即座に停止

[↑ 目次に戻る](#目次)

## メンテナンス方針

**状態**: 🧪試験中  
**この章のゴール**: テスト環境の継続的な品質向上とメンテナンス戦略を定義する

### **定期レビュー**
- **月次レビュー**: テストカバレッジ、実行時間の確認
- **四半期更新**: テスト戦略の見直し
- **継続改善**: フレイキーテストの特定・修正

### **フレイキーテスト対策（計画中）**
- ラベル`flaky`を付与→隔離用ワークフローに自動振替→週次で再挑戦→3回連続成功で復帰（計画中）

### **data-testid ガイドライン（計画中）**
- **E2E/RTL用に `data-testid` を必ず付与**（ボタン/入力/重要UIのみ）（計画中）
- **命名規則**: `<page>-<feature>-<element>`（計画中）
- **例**: `login-form-email`, `voice-recorder-start-button`, `report-daily-chart`

[↑ 目次に戻る](#目次)

