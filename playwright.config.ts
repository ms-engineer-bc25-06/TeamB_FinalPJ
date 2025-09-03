import { defineConfig, devices } from "@playwright/test";

// 環境変数からの設定取得
const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const webCommand = isCI ? "npm run build && npm run start" : "npm run dev";

// Playwright設定
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: webCommand,
    cwd: "./frontend",
    port: 3000,
    reuseExistingServer: false, // 常に新しいサーバーを起動
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
