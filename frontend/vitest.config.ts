import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/__mocks__/**',
        '**/*.config.*',
        // NOTE: Next.jsの基本構造ファイル（単純なルーティング・レイアウトのみ）
        'src/app/layout.tsx',
        'src/app/not-found.tsx',
        'src/app/**/not-found.tsx',
        // NOTE:静的なランディングページで認証ロジックなしのため除外
        'src/app/(public)/page.tsx'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
}) 