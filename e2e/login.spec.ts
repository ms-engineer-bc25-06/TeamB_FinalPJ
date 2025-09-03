import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./utils/auth";

test.describe("ログイン（操作のみ）", () => {
  test("Googleログインボタンが表示される", async ({ page }) => {
    await loginAsTestUser(page);

    // ログインページにいることを確認
    await expect(page).toHaveURL(/\/login$/);

    // Googleログインボタンが表示されていることを確認
    const googleLoginBtn = page.locator('button:has-text("Googleでログイン")');
    await expect(googleLoginBtn).toBeVisible();
  });
});
