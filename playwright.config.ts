import { defineConfig, devices } from '@playwright/test'

// 環境変数からの設定取得
const isCI = !!process.env.CI
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const toNum = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : undefined)
const workers = toNum(process.env.PLAYWRIGHT_WORKERS) ?? (isCI ? 1 : undefined)
const retries = toNum(process.env.PLAYWRIGHT_RETRIES) ?? (isCI ? 2 : 0)
const webCommand = process.env.PLAYWRIGHT_WEB_COMMAND || (isCI ? 'npm run build && npm run start' : 'npm run dev')
const webTimeout = toNum(process.env.PLAYWRIGHT_WEB_TIMEOUT) ?? (isCI ? 180_000 : 120_000)

// ローカル/外部URL判定（堅牢化）
let isLocalHost = true
try {
  const u = new URL(baseURL)
  isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
} catch { /* baseURLが相対の場合はローカル扱い */ }

// Playwright設定
export default defineConfig({
  testDir: './e2e',
  /* 並列実行でのテスト数（外部URLの場合は直列化） */
  fullyParallel: false,

  forbidOnly: isCI,
  retries,
  workers,
  // テスト全体 / 期待 / 操作 / ナビゲーションの上限時間
  timeout: isLocalHost ? 30_000 : 60_000,
  expect: { timeout: 10_000 },

  reporter: isCI
    ? [
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github'],
      ]
    : [
        ['html', { open: 'never' }],
        ['list'],
      ],

  use: {
    baseURL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  outputDir: 'test-results/.artifacts',

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  // 外部URLなら webServer を起動しない
  webServer: isLocalHost
    ? {
        command: webCommand,
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: webTimeout,
        env: isCI ? { NODE_ENV: 'production' } : undefined,
      }
    : undefined,
})