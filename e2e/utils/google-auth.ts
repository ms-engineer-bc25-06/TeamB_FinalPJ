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
        console.log("=== checkAuthState debug ===");
        console.log("window exists:", typeof window !== "undefined");
        console.log("firebase exists:", !!(window as any).firebase);
        console.log("firebase object:", (window as any).firebase);

        if (typeof window !== "undefined" && (window as any).firebase) {
          console.log("Firebase is available, checking auth state");
          // 即座に現在のユーザーをチェック
          const auth = (window as any).firebase.auth();
          if (auth.currentUser) {
            console.log("Current user found:", auth.currentUser);
            resolve({
              uid: auth.currentUser.uid,
              email: auth.currentUser.email,
            });
            return;
          }

          // onAuthStateChangedで確認
          auth.onAuthStateChanged((user: any) => {
            console.log("onAuthStateChanged triggered:", user);
            resolve(user ? { uid: user.uid, email: user.email } : null);
          });
        } else {
          console.log("Firebase not available, returning null");
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
      if (typeof window !== "undefined") {
        const mockUser = {
          uid: "mock-user-123",
          email: "test@example.com",
          displayName: "Test User",
          photoURL: "https://example.com/photo.jpg",
        };

        // Firebaseが存在しない場合は作成
        if (!(window as any).firebase) {
          (window as any).firebase = {
            auth: () => ({
              onAuthStateChanged: (callback: any) => {
                // 即座にコールバックを実行
                setTimeout(() => callback(mockUser), 100);
              },
              currentUser: mockUser,
              getIdToken: () => Promise.resolve("mock-id-token"),
            }),
          };
        } else {
          // Firebaseが存在する場合は上書き
          (window as any).firebase.auth().onAuthStateChanged = (
            callback: any
          ) => {
            setTimeout(() => callback(mockUser), 100);
          };
          (window as any).firebase.auth().currentUser = mockUser;
          (window as any).firebase.auth().getIdToken = () =>
            Promise.resolve("mock-id-token");
        }

        // グローバルにFirebase認証状態を設定
        (window as any).__MOCK_FIREBASE_USER__ = mockUser;
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
      `${this.baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
      {
        data: {
          email,
          password,
          returnSecureToken: true,
        },
      }
    );

    if (response.status() !== 200) {
      const errorText = await response.text();
      console.log(`User creation failed with status ${response.status()}: ${errorText}`);
      // ユーザーが既に存在する場合は続行
      if (response.status() === 400 && errorText.includes('EMAIL_EXISTS')) {
        console.log(`User ${email} already exists, continuing...`);
        return { success: true, email };
      }
      throw new Error(`User creation failed: ${response.status()}`);
    }
    
    const result = await response.json();
    return { success: true, ...result };
  }

  /**
   * Firebase Auth Emulatorでテストユーザーにログイン
   */
  async signInWithEmail(email: string, password: string) {
    const response = await this.page.request.post(
      `${this.baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
      {
        data: {
          email,
          password,
          returnSecureToken: true,
        },
      }
    );

    if (response.status() !== 200) {
      const errorText = await response.text();
      console.log(`Login failed with status ${response.status()}: ${errorText}`);
      throw new Error(`Login failed: ${response.status()}`);
    }
    
    const result = await response.json();
    return { success: true, ...result };
  }

  /**
   * テストユーザーを削除
   */
  async deleteTestUser(email: string) {
    // まずユーザーにログインしてIDトークンを取得
    const loginResult = await this.signInWithEmail(email, "testpassword123");
    const idToken = loginResult.idToken;

    const response = await this.page.request.post(
      `${this.baseUrl}/identitytoolkit.googleapis.com/v1/accounts:delete?key=fake-api-key`,
      {
        data: {
          idToken,
        },
      }
    );

    expect(response.status()).toBe(200);
  }

  /**
   * ログアウト
   */
  async signOut() {
    await this.page.evaluate(() => {
      if (typeof window !== "undefined" && (window as any).firebase) {
        const auth = (window as any).firebase.auth();
        if (auth.signOut) {
          auth.signOut();
        }
      }
    });
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
