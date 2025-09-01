# 💳 Stripe 詳細セットアップガイド

このドキュメントでは、Stripeの詳細なセットアップ手順を説明します。

## ⚡️ Stripe CLI のセットアップ

**Stripe CLI**は、ローカル開発環境でStripeのWebhook通知をテストするために必要です。

## 🚀 自動セットアップ（推奨）

開発用スクリプトを使用して、OSに応じた自動セットアップが可能です：

### macOS
```bash
chmod +x scripts/dev-setup.sh
./scripts/dev-setup.sh
```

### Windows
```bash
scripts\dev-setup.bat
```

### このスクリプトは以下を自動で実行します

- Stripe CLIのインストール（OS判定による自動選択）
- Stripe CLIへのログイン
- 依存関係のインストール確認
- 環境変数の自動設定

## 🔧 手動インストール（スクリプトが失敗した場合）

### macOS

#### Homebrewを使用（推奨）
```bash
brew install stripe/stripe-cli/stripe
```

#### 公式サイトからダウンロード
https://stripe.com/docs/stripe-cli

### Windows

#### Chocolateyを使用
```bash
choco install stripe-cli
```

#### 公式サイトからダウンロード
https://stripe.com/docs/stripe-cli

## 🔐 ログイン設定

```bash
# Stripeアカウントにログイン
stripe login
```

ブラウザが開いて、Stripeアカウントでの認証が求められます。

## ✅ 動作確認

### バージョン確認
```bash
stripe --version
```

### ログイン状態確認
```bash
stripe config --list
```

## 🌐 Webhook設定

### 開発用スクリプト実行済みの場合

Webhook設定は自動で完了しています。

### 手動設定の場合

別のターミナルで以下のコマンドを実行してStripe Webhookをローカル環境に転送します：

```bash
stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
```

このコマンドを実行すると、以下のような出力が表示されます：

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef1234567890abcdef1234567890abcdef
> Forwarding events to http://localhost:8000/api/v1/stripe/webhook
```

表示された`whsec_...`の文字列を`backend/.env`ファイルの`STRIPE_WEBHOOK_SECRET`に設定してください。

## ⚠️ 重要な注意事項

### Webhook転送の必要性

このWebhook転送は、ローカル開発環境での決済機能テストに必要です。

### セキュリティ

- Webhook signing secretは機密情報です
- `.env`ファイルに保存し、Gitにコミットしないでください
- 本番環境では異なるsecretを使用してください

### 推奨事項

開発用スクリプトを使用することで、これらの設定が自動化されます。

## 🧪 テスト方法

### 1. Webhook転送の確認

```bash
stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
```

### 2. テストイベントの送信

```bash
stripe trigger payment_intent.succeeded
```

### 3. ログの確認

バックエンドのログでWebhookイベントの受信を確認してください。

## 🔍 トラブルシューティング

### よくある問題

#### 1. Webhookが受信されない
- `stripe listen`が実行されているか確認
- ポート8000が利用可能か確認
- ファイアウォールの設定を確認

#### 2. 認証エラー
```bash
stripe logout
stripe login
```

#### 3. バージョンの不整合
```bash
stripe update
```

### デバッグ方法

1. `stripe listen`の出力を確認
2. バックエンドのログを確認
3. ネットワーク接続を確認
4. StripeダッシュボードでWebhook設定を確認

## 📚 参考資料

- [Stripe CLI公式ドキュメント](https://stripe.com/docs/stripe-cli)
- [Webhook設定ガイド](https://stripe.com/docs/webhooks)
- [テストカード一覧](https://stripe.com/docs/testing#cards)
- [Webhookイベント一覧](https://stripe.com/docs/api/events/types)
- [API仕様書](../APISpecification.md) - Stripe APIの詳細
