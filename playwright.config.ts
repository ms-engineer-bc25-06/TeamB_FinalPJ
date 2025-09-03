import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.e2e.local" });

// 環境変数からの設定取得
const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const toNum = (v?: string) =>
  v && !Number.isNaN(Number(v)) ? Number(v) : undefined;
const webCommand =
  process.env.PLAYWRIGHT_WEB_COMMAND ||
  (isCI ? "npm run build && npm run start" : "npm run dev");
const webPort = toNum(process.env.PLAYWRIGHT_WEB_PORT) ?? 3000;

// ローカル/外部URL判定（堅牢化）
let isLocalHost = true;
try {
  const u = new URL(baseURL);
  isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
} catch {
  /* baseURLが相対の場合はローカル扱い */
}

// Playwright設定
export default defineConfig({
  testDir: "./e2e",
  testIgnore: [
    "**/node_modules/**",
    "**/src/__tests__/**",
    "**/*.test.tsx",
    "**/*.test.ts",
    "**/frontend/src/__tests__/**",
    "**/frontend/src/**/*.test.*",
  ],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure", // 失敗時にトレース保存
    video: "retain-on-failure", // 失敗時に動画保存
    screenshot: "only-on-failure", // 失敗時にスクショ保存
  },
  webServer: {
    command: webCommand,
    cwd: "./frontend",
    port: webPort,
    reuseExistingServer: false, // 常に新しいサーバーを起動
    timeout: 180_000,
  },
  projects: [
    {
      name: "Desktop Chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { 
        ...devices["iPhone 14 Pro Max"],
        browserName: "webkit",
      },
    },
  ],
});
