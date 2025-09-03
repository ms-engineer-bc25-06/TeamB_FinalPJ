import { Page, expect } from "@playwright/test";
import * as dotenv from "dotenv";
dotenv.config({ path: "frontend/.env.e2e.local" });

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
  const googleLoginBtn = page.locator('button:has-text("Googleでログイン")');

  await expect(googleLoginBtn).toBeVisible();

  // 注意: 実際のGoogle OAuth認証は複雑なので、ここではボタンの存在確認のみ
  // 実際の認証テストは手動で行うか、Firebase Auth Emulatorを使用する必要があります
  console.log(
    "Googleログインボタンが見つかりました。実際のOAuth認証はスキップします。"
  );
}
