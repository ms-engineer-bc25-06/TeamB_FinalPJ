import { expect, test } from "@playwright/test";

test.describe("感情記録フロー E2E", () => {
  test.beforeEach(async ({ page }) => {
    // 認証をスキップするためのモックを設定
    await page.addInitScript(() => {
      // 認証状態をモック
      (window as any).__MOCK_FIREBASE_USER__ = {
        uid: "test-user-123",
        email: "test@example.com",
        displayName: "Test User",
        photoURL: "https://example.com/photo.jpg",
        getIdToken: () => Promise.resolve("mock-id-token"),
        emailVerified: true,
        isAnonymous: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      (window as any).__MOCK_BACKEND_USER__ = {
        id: 1,
        uid: "test-user-123",
        email: "test@example.com",
        nickname: "Test User",
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 環境変数を設定
      (window as any).process = {
        env: {
          NODE_ENV: "test",
          USE_FIREBASE_EMULATOR: "true",
        },
      };

      (window as any).NODE_ENV = "test";
      (window as any).USE_FIREBASE_EMULATOR = "true";
    });

    // APIリクエストをインターセプトして認証ヘッダーを追加
    await page.route("**/emotion/**", async (route) => {
      const request = route.request();
      const headers = {
        ...request.headers(),
        Authorization: "Bearer mock-id-token",
      };

      await route.continue({
        headers,
      });
    });
  });

  test("感情を選択して保存できる", async ({ page }) => {
    // コンソールログを監視
    page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

    // 1. 感情選択ページに直接アクセス
    await page.goto("http://localhost:3000/app/emotion-selection");

    // 2. 感情カードが表示されるまで待つ（画像の読み込みエラーを無視）
    await page.waitForSelector('[data-testid*="emotion-card-"]', {
      timeout: 15000,
    });

    // 4. 感情カードを選択
    const cards = await page.locator('[data-testid*="emotion-card-"]');
    await expect(cards).toHaveCount(4);
    await cards.first().click();

    // 5. 強度選択ページへの遷移を待つ
    await page.waitForURL("**/emotion-intensity*", { timeout: 10000 });

    // 6. 強度を選択
    await page.click('[data-testid="intensity-medium"]');

    // 7. 確認ページに進む
    await page.waitForURL("**/emotion-confirmation*");

    // 8. 感情カードが表示されるまで待つ
    await page.waitForSelector('[data-testid="emotion-card"]', {
      timeout: 10000,
    });

    // 9. 保存ボタンをクリック（スワイプ操作）
    const card = page.locator('[data-testid="emotion-card"]');
    await card.hover();
    await page.mouse.down();
    await page.mouse.move(300, 0);
    await page.mouse.up();

    // 10. 成功メッセージが表示されるか確認
    await expect(page.getByText(/OK！つぎにすすむよ〜/)).toBeVisible();
  });
});
