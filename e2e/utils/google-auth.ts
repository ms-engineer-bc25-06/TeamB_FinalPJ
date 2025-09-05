import { Page, expect } from "@playwright/test";

/**
 * Google認証用のテストヘルパー関数
 * Firebase Auth Emulatorとの通信機能も含む
 */
export class GoogleAuthHelper {
  private page: Page;
  private baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl =
      process.env.FIREBASE_AUTH_EMULATOR_HOST || "http://localhost:9099";
  }

  /**
   * Googleログインボタンの表示確認
   */
  async checkGoogleLoginButton() {
    const googleLoginBtn = this.page.locator(
      'button:has-text("🔐Googleでログイン")'
    );
    await expect(googleLoginBtn).toBeVisible();
    await expect(googleLoginBtn).toBeEnabled();
    return googleLoginBtn;
  }

  /**
   * Googleログインボタンをクリック
   */
  async clickGoogleLoginButton() {
    const googleLoginBtn = await this.checkGoogleLoginButton();
    await googleLoginBtn.click();
    return googleLoginBtn;
  }

  /**
   * Google認証ポップアップの処理
   */
  async handleGoogleAuthPopup() {
    // ポップアップが開くことを確認
    await this.page.waitForTimeout(1000);

    // ポップアップが開いているかチェック
    const popup = await this.page
      .waitForEvent("popup", { timeout: 5000 })
      .catch(() => null);

    if (popup) {
      await popup.close();
      return { opened: true, closed: true };
    } else {
      return { opened: false, closed: false };
    }
  }

  /**
   * 認証エラーのハンドリング確認
   * ここではauth/popup-closed-by-user エラーが表示されないことを確認
   */
  async checkAuthErrorHandling() {
    const errorMessage = this.page.locator("text=popup-closed-by-user");
    await expect(errorMessage).not.toBeVisible();
  }

  /**
   * 認証状態の確認
   */
  async checkAuthState(): Promise<{ uid: string; email: string } | null> {
    // 認証状態が適切に管理されているか確認
    return await this.page.evaluate(() => {
      return new Promise<{ uid: string; email: string } | null>((resolve) => {
        if (typeof window !== "undefined" && (window as any).firebase) {
          (window as any).firebase.auth().onAuthStateChanged((user: any) => {
            resolve(user ? { uid: user.uid, email: user.email } : null);
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // ===== Mock機能 =====

  /**
   * Google認証の成功をMock
   */

  async mockGoogleAuthSuccess() {
    await this.page.evaluate(() => {
      // Firebase Authの状態をMock
      if (typeof window !== "undefined" && (window as any).firebase) {
        const mockUser = {
          uid: "mock-user-123",
          email: "test@example.com",
          displayName: "Test User",
          photoURL: "https://example.com/photo.jpg",
        };

        // 認証状態をMock
        (window as any).firebase.auth().onAuthStateChanged = (
          callback: any
        ) => {
          callback(mockUser);
        };
      }
    });
  }

  /**
   * Google認証の失敗をMock
   */
  async mockGoogleAuthFailure() {
    await this.page.evaluate(() => {
      // Firebase Authの状態をMock
      if (typeof window !== "undefined" && (window as any).firebase) {
        (window as any).firebase.auth().onAuthStateChanged = (
          callback: any
        ) => {
          callback(null);
        };
      }
    });
  }

  /**
   * 認証エラーをMock
   */
  async mockAuthError(errorCode: string) {
    await this.page.evaluate((errorCode) => {
      // エラーメッセージを表示
      const errorDiv = document.createElement("div");
      errorDiv.id = "auth-error";
      errorDiv.textContent = `Firebase Error: ${errorCode}`;
      document.body.appendChild(errorDiv);
    }, errorCode);
  }

  // ===== Firebase Auth Emulator用 =====

  /**
   * Firebase Auth Emulatorでテストユーザーを作成
   */
  async createTestUser(email: string, password: string) {
    const response = await this.page.request.post(
      `${this.baseUrl}/www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser`,
      {
        data: {
          email,
          password,
          returnSecureToken: true,
        },
      }
    );

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * Firebase Auth Emulatorでテストユーザーにログイン
   */
  async signInWithEmail(email: string, password: string) {
    const response = await this.page.request.post(
      `${this.baseUrl}/www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword`,
      {
        data: {
          email,
          password,
          returnSecureToken: true,
        },
      }
    );

    expect(response.status()).toBe(200);
    return await response.json();
  }

  /**
   * テストユーザーを削除
   */
  async deleteTestUser(idToken: string) {
    const response = await this.page.request.post(
      `${this.baseUrl}/www.googleapis.com/identitytoolkit/v3/relyingparty/deleteAccount`,
      {
        data: {
          idToken,
        },
      }
    );

    expect(response.status()).toBe(200);
  }
}

/**
 * Google認証のテストフローを実行
 */
export async function performGoogleAuthTest(page: Page) {
  const googleAuth = new GoogleAuthHelper(page);

  // 1. ログインページに移動
  await page.goto("/login");

  // 2. Googleログインボタンの表示確認
  await googleAuth.checkGoogleLoginButton();

  // 3. Googleログインボタンをクリック
  await googleAuth.clickGoogleLoginButton();

  // 4. ポップアップの処理
  const popupResult = await googleAuth.handleGoogleAuthPopup();

  // 5. エラーハンドリングの確認
  await googleAuth.checkAuthErrorHandling();

  return {
    googleAuth,
    popupResult,
  };
}
