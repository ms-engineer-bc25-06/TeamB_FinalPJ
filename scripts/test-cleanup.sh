#!/bin/bash
# テスト結果ファイルのクリーンアップスクリプト

echo "🧹 テスト結果ファイルをクリーンアップ中..."

# フロントエンドテスト結果
if [ -d "frontend/test-results" ]; then
  SIZE=$(du -sh frontend/test-results 2>/dev/null | cut -f1)
  echo "📁 frontend/test-results: $SIZE"
  rm -rf frontend/test-results
fi

if [ -d "frontend/playwright-report" ]; then
  SIZE=$(du -sh frontend/playwright-report 2>/dev/null | cut -f1)
  echo "📁 frontend/playwright-report: $SIZE"
  rm -rf frontend/playwright-report
fi

if [ -d "frontend/blob-report" ]; then
  SIZE=$(du -sh frontend/blob-report 2>/dev/null | cut -f1)
  echo "📁 frontend/blob-report: $SIZE"
  rm -rf frontend/blob-report
fi

if [ -d "frontend/coverage" ]; then
  SIZE=$(du -sh frontend/coverage 2>/dev/null | cut -f1)
  echo "📁 frontend/coverage: $SIZE"
  rm -rf frontend/coverage
fi

# バックエンドテスト結果
if [ -d "backend/htmlcov" ]; then
  SIZE=$(du -sh backend/htmlcov 2>/dev/null | cut -f1)
  echo "📁 backend/htmlcov: $SIZE"
  rm -rf backend/htmlcov
fi

if [ -f "backend/coverage.xml" ]; then
  SIZE=$(du -sh backend/coverage.xml 2>/dev/null | cut -f1)
  echo "📄 backend/coverage.xml: $SIZE"
  rm -f backend/coverage.xml
fi

if [ -f "backend/.coverage" ]; then
  SIZE=$(du -sh backend/.coverage 2>/dev/null | cut -f1)
  echo "📄 backend/.coverage: $SIZE"
  rm -f backend/.coverage
fi

# Pytestキャッシュ
if [ -d "backend/.pytest_cache" ]; then
  SIZE=$(du -sh backend/.pytest_cache 2>/dev/null | cut -f1)
  echo "📁 backend/.pytest_cache: $SIZE"
  rm -rf backend/.pytest_cache
fi

echo "✅ クリーンアップ完了！"
