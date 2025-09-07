import { expect, test } from "@playwright/test";

test.describe("感情記録フロー E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Firebase Auth Emulatorを使用するように環境変数を設定
    await page.addInitScript(() => {
      (window as any).process = {
        env: {
          NODE_ENV: "test",
          USE_FIREBASE_EMULATOR: "true",
        },
      };
    });
  });

  test("感情を選択して保存できる", async ({ page }) => {
    // コンソールログを監視
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // 1. ログインページにアクセス
    await page.goto("http://localhost:3000/");

    // 2. ログインボタンをクリック
    await page.click("text=ログイン");

    // 3. ログインフォームが表示されるまで待つ
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // 4. テストユーザーでログイン
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "testpassword123");
    await page.click('button[type="submit"]');

    // 5. ログイン成功を待つ
    await page.waitForLoadState("networkidle");

    // 6. 感情選択ページにアクセス
    await page.goto("http://localhost:3000/app/emotion-selection");

    // 7. ページが完全に読み込まれるまで待つ
    await page.waitForLoadState("networkidle");

    // 8. 感情カードが表示されるまで待つ
    await page.waitForSelector('[data-testid*="emotion-card-"]', {
      timeout: 10000,
    });

    // 9. 感情カードを選択
    const cards = await page.locator('[data-testid*="emotion-card-"]');
    await expect(cards).toHaveCount(12);
    await cards.first().click();

    // 10. 強度選択ページへの遷移を待つ
    await page.waitForURL("**/emotion-intensity*", { timeout: 10000 });

    // 11. 強度を選択
    await page.click('[data-testid="intensity-medium"]');

    // 12. 確認ページに進む
    await page.waitForURL("**/emotion-confirmation*");

    // 13. 保存ボタンをクリック（スワイプ操作）
    const card = page.locator('[data-testid="emotion-card"]').first();
    await card.hover();
    await page.mouse.down();
    await page.mouse.move(300, 0);
    await page.mouse.up();

    // 14. 成功メッセージが表示されるか確認
    await expect(page.getByText(/きもち/)).toBeVisible();
  });
});
