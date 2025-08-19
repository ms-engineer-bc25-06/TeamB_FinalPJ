#!/bin/bash

# 色付きの出力用
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 開発環境のセットアップを開始します...${NC}"

# OS判定
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    echo -e "${RED}❌ サポートされていないOSです: $OSTYPE${NC}"
    exit 1
fi

echo -e "${YELLOW}📱 検出されたOS: $OS${NC}"

# 1. Python依存関係のインストール
echo -e "${YELLOW} Python依存関係をインストール中...${NC}"
cd backend
pip install -r requirements.txt
cd ..

# 2. Stripe CLIのインストール確認・インストール
echo -e "${YELLOW}🔧 Stripe CLIの確認中...${NC}"
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW} Stripe CLIをインストール中...${NC}"
    
    if [[ "$OS" == "macOS" ]]; then
        if command -v brew &> /dev/null; then
            brew install stripe/stripe-cli/stripe
        else
            echo -e "${RED}❌ Homebrewがインストールされていません。${NC}"
            echo -e "${YELLOW}以下のコマンドでHomebrewをインストールしてください:${NC}"
            echo -e "${YELLOW}/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"${NC}"
            exit 1
        fi
    elif [[ "$OS" == "Linux" ]]; then
        echo -e "${YELLOW}🐧 Linux用のインストールを実行中...${NC}"
        curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
        echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
        sudo apt update
        sudo apt install stripe
    fi
else
    echo -e "${GREEN}✅ Stripe CLIは既にインストールされています${NC}"
fi

# 3. Stripe CLIのログイン確認
echo -e "${YELLOW} Stripe CLIのログイン状態を確認中...${NC}"
if [ ! -f ~/.stripe/config.toml ]; then
    echo -e "${YELLOW}🔑 Stripe CLIにログインしてください...${NC}"
    echo -e "${YELLOW}ブラウザが開きます。認証を完了してください。${NC}"
    stripe login
else
    echo -e "${GREEN}✅ Stripe CLIは既にログイン済みです${NC}"
fi

# 4. Webhook Secretの自動設定
echo -e "${YELLOW}🔐 Webhook Secretを自動設定中...${NC}"

# 一時的にWebhook転送を開始してSecretを取得
echo -e "${YELLOW}Webhook転送を開始してSecretを取得します...${NC}"
echo -e "${YELLOW}この処理には数秒かかります...${NC}"

# バックグラウンドでWebhook転送を開始
stripe listen --forward-to localhost:8000/api/v1/stripe/webhook > /tmp/stripe_output 2>&1 &
STRIPE_PID=$!

# 少し待機してSecretを取得
sleep 5

# プロセスを停止
kill $STRIPE_PID 2>/dev/null

# 出力からWebhook Secretを抽出
WEBHOOK_SECRET=$(grep "webhook signing secret" /tmp/stripe_output | grep -o "whsec_[a-zA-Z0-9]*" | head -1)

if [ -n "$WEBHOOK_SECRET" ]; then
    echo -e "${GREEN}✅ Webhook Secretを取得しました: ${WEBHOOK_SECRET}${NC}"
    
    # .envファイルに設定
    if [ -f "backend/.env" ]; then
        # 既存の設定を更新
        if grep -q "STRIPE_WEBHOOK_SECRET=" backend/.env; then
            sed -i.bak "s/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET/" backend/.env
        else
            echo "STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET" >> backend/.env
        fi
        echo -e "${GREEN}✅ .envファイルにWebhook Secretを設定しました${NC}"
    else
        echo -e "${YELLOW}⚠️ backend/.envファイルが見つかりません${NC}"
        echo -e "${YELLOW}手動で以下を設定してください:${NC}"
        echo -e "${YELLOW}STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Webhook Secretの取得に失敗しました${NC}"
    echo -e "${YELLOW}手動で設定してください:${NC}"
    echo -e "${YELLOW}1. 'stripe listen --forward-to localhost:8000/api/v1/stripe/webhook' を実行${NC}"
    echo -e "${YELLOW}2. 表示されるwhsec_...の値をbackend/.envファイルに設定${NC}"
fi

# 一時ファイルを削除
rm -f /tmp/stripe_output

# 5. フロントエンド依存関係のインストール
echo -e "${YELLOW}⚛️ フロントエンド依存関係をインストール中...${NC}"
cd frontend
npm install
cd ..

echo -e "${GREEN} 開発環境のセットアップが完了しました！${NC}"
echo -e "${YELLOW}次のステップ:${NC}"
echo -e "${YELLOW}1. backend/ ディレクトリで 'docker compose down && docker compose up --build -d' を実行${NC}"
echo -e "${YELLOW}2. 別のターミナルで 'stripe listen --forward-to localhost:8000/api/v1/stripe/webhook' を実行${NC}"
echo -e "${YELLOW}3. frontend/ ディレクトリで 'npm run dev' を実行${NC}"