#!/bin/bash（macOS用）

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
echo -e "${YELLOW}�� Python依存関係をインストール中...${NC}"
cd backend
pip install -r requirements.txt
cd ..

# 2. Stripe CLIのインストール確認・インストール
echo -e "${YELLOW}🔧 Stripe CLIの確認中...${NC}"
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}�� Stripe CLIをインストール中...${NC}"
    
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
echo -e "${YELLOW}�� Stripe CLIのログイン状態を確認中...${NC}"
if [ ! -f ~/.stripe/config.toml ]; then
    echo -e "${YELLOW}🔑 Stripe CLIにログインしてください...${NC}"
    echo -e "${YELLOW}ブラウザが開きます。認証を完了してください。${NC}"
    stripe login
else
    echo -e "${GREEN}✅ Stripe CLIは既にログイン済みです${NC}"
fi

# 4. フロントエンド依存関係のインストール
echo -e "${YELLOW}�� フロントエンド依存関係をインストール中...${NC}"
cd frontend
npm install
cd ..

echo -e "${GREEN}�� 開発環境のセットアップが完了しました！${NC}"
echo -e "${YELLOW}次のステップ:${NC}"
echo -e "${YELLOW}1. backend/ ディレクトリで 'uvicorn app.main:app --reload' を実行${NC}"
echo -e "${YELLOW}2. 別のターミナルで 'stripe listen --forward-to localhost:8000/api/v1/stripe/webhook' を実行${NC}"
echo -e "${YELLOW}3. frontend/ ディレクトリで 'npm run dev' を実行${NC}"