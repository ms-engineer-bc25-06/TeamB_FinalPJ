@echo off
setlocal enabledelayedexpansion

echo 🚀 開発環境のセットアップを開始します...

REM 1. Python依存関係のインストール
echo �� Python依存関係をインストール中...
cd backend
pip install -r requirements.txt
cd ..

REM 2. Stripe CLIのインストール確認・インストール
echo �� Stripe CLIの確認中...
where stripe >nul 2>nul
if %errorlevel% neq 0 (
    echo �� Stripe CLIをインストール中...
    
    REM Chocolateyがインストールされているかチェック
    where choco >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ Chocolateyがインストールされていません。
        echo �� https://chocolatey.org/install を参照してください。
        echo.
        echo 以下のコマンドを管理者権限のPowerShellで実行してください:
        echo Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        pause
        exit /b 1
    )
    
    echo 🍫 Chocolateyを使用してStripe CLIをインストール中...
    choco install stripe-cli -y
) else (
    echo ✅ Stripe CLIは既にインストールされています
)

REM 3. Stripe CLIのログイン確認
echo �� Stripe CLIのログイン状態を確認中...
if not exist "%USERPROFILE%\.stripe\config.toml" (
    echo 🔑 Stripe CLIにログインしてください...
    echo 🌐 ブラウザが開きます。認証を完了してください。
    stripe login
) else (
    echo ✅ Stripe CLIは既にログイン済みです
)

REM 4. フロントエンド依存関係のインストール
echo �� フロントエンド依存関係をインストール中...
cd frontend
npm install
cd ..

echo �� 開発環境のセットアップが完了しました！
echo.
echo 📋 次のステップ:
echo 1. backend/ ディレクトリで 'uvicorn app.main:app --reload' を実行
echo 2. 別のターミナルで 'stripe listen --forward-to localhost:8000/api/v1/stripe/webhook' を実行
echo 3. frontend/ ディレクトリで 'npm run dev' を実行
echo.
pause