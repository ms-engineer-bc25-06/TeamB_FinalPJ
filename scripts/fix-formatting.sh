#!/bin/bash
# 自動整形機能の復旧スクリプト

echo "🔧 自動整形機能を復旧中..."

# 1. VS Code拡張機能の確認
echo "📦 必要な拡張機能をチェック中..."
code --list-extensions | grep -E "(black-formatter|prettier|eslint|python)" || {
  echo "❌ 必要な拡張機能が不足しています"
  echo "以下をインストールしてください:"
  echo "- ms-python.black-formatter"
  echo "- esbenp.prettier-vscode" 
  echo "- dbaeumer.vscode-eslint"
  echo "- ms-python.python"
}

# 2. Python環境の確認
echo "🐍 Python環境をチェック中..."
if command -v python &> /dev/null; then
  python --version
  python -m black --version || echo "❌ Black が見つかりません"
  python -m pylint --version || echo "❌ Pylint が見つかりません"
else
  echo "❌ Python が見つかりません"
fi

# 3. Node.js環境の確認 (フロントエンド)
echo "📦 Node.js環境をチェック中..."
if command -v npm &> /dev/null; then
  cd frontend
  npm list eslint prettier @typescript-eslint/parser || {
    echo "❌ ESLint/Prettier が不足しています"
    echo "npm install を実行してください"
  }
  cd ..
else
  echo "❌ Node.js/npm が見つかりません"
fi

# 4. 設定ファイルの確認
echo "⚙️  設定ファイルをチェック中..."
[ -f ".vscode/settings.json" ] && echo "✅ .vscode/settings.json 存在" || echo "❌ .vscode/settings.json 不足"
[ -f "backend/pyproject.toml" ] && echo "✅ pyproject.toml 存在" || echo "❌ pyproject.toml 不足"  
[ -f "frontend/.prettierrc.json" ] && echo "✅ .prettierrc.json 存在" || echo "❌ .prettierrc.json 不足"
[ -f "frontend/eslint.config.mjs" ] && echo "✅ eslint.config.mjs 存在" || echo "❌ eslint.config.mjs 不足"

echo ""
echo "🚀 復旧手順:"
echo "1. VS Code を完全に再起動"
echo "2. Ctrl+Shift+P → 'Python: Select Interpreter' → /usr/local/bin/python を選択"
echo "3. Ctrl+Shift+P → 'ESLint: Restart ESLint Server'"
echo "4. テストファイルで Ctrl+S して自動整形を確認"

echo ""
echo "🔧 それでも動かない場合:"
echo "- Dev Container: Ctrl+Shift+P → 'Dev Containers: Rebuild Container'"
echo "- ローカル開発: 'Developer: Reload Window'"
