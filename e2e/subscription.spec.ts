/**
 * サブスクリプションテスト: サブスクリプションページのUI表示とStripe連携をテスト
 */
import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./utils/auth";

test.describe("ログイン後の遷移（現状仕様）", () => {
  test("ログインページでGoogleログインボタンが表示される", async ({ page }) => {
    await loginAsTestUser(page);

    // ログインページにいることを確認
    await expect(page).toHaveURL(/\/login$/);

    // Googleログインボタンが表示されていることを確認
    const googleLoginBtn = page.locator('button:has-text("Googleでログイン")');
    await expect(googleLoginBtn).toBeVisible();
  });

  // 将来仕様（登録済みならホームへ）のプレースホルダ
  test.skip("【未実装】登録済みユーザーはホームへ遷移する", async ({
    page,
  }) => {
    // 実装後に下記を有効化：
    // await Promise.all([
    //   page.waitForURL(/\/(app|home|dashboard)(\/)?$/, { timeout: 15_000 }),
    //   loginAsTestUser(page),
    // ])
    // await expect(page.getByRole('button', { name: /きもちをきろく\s*する/ })).toBeVisible()
  });
});
