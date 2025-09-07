import { Page, expect } from "@playwright/test";
import * as dotenv from "dotenv";
dotenv.config({ path: "frontend/.env.e2e.local" });

/**
 * ログインページUI専用（e2e/login.spec.ts）のテストヘルパー関数
 * Firebase Auth Emulatorとの通信機能は含んでいません。単なるページ表示を確認するだけです。
 */

const EMAIL = process.env.E2E_TEST_USER_EMAIL ?? "test@example.com";
const PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? "testpassword123";

// 環境変数が設定されていない場合はデフォルト値を使用
console.log("E2Eテスト用環境変数:", {
  EMAIL: EMAIL ? "設定済み" : "未設定",
  PASSWORD: PASSWORD ? "設定済み" : "未設定",
});

/** Googleログインボタンをクリック（実際のOAuth認証はスキップ） */
export async function loginAsTestUser(page: Page) {
  await page.goto("/login");

  // Googleログインボタンを探す
  const googleLoginBtn = page.locator('button:has-text("🔐Googleでログイン")');

  await expect(googleLoginBtn).toBeVisible();

  console.log(
    "Googleログインボタンが見つかりました。実際のOAuth認証はスキップします。"
  );
}
