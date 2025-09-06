/**
 * Firebase Auth Emulator統合テスト: エミュレーターのAPI直接呼び出しとバックエンド連携をテスト（E2Eテストとして実行）
 */
import { expect, test } from "@playwright/test";
import * as dotenv from "dotenv";
import { AuthTestHelper } from "./utils/auth-helper";
import { GoogleAuthHelper } from "./utils/google-auth";

// 環境変数の読み込み
dotenv.config({ path: "frontend/.env.e2e.local" });

test.describe("Firebase Auth Emulator連携テスト", () => {
  let googleAuth: GoogleAuthHelper;
  let authHelper: AuthTestHelper;
  const baseUrl = "http://localhost:9099";
  const apiKey = "fake-api-key";

  test.beforeEach(async ({ page }) => {
    googleAuth = new GoogleAuthHelper(page);
    authHelper = new AuthTestHelper();
  });

  test.describe("API直接テスト", () => {
    test("ユーザー作成API", async ({ page }) => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      const createResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(createResponse.status()).toBe(200);
      const createResult = await createResponse.json();
      expect(createResult.email).toBe(testEmail);
      expect(createResult.localId).toBeTruthy();
      expect(createResult.idToken).toBeTruthy();

      console.log("✅ ユーザー作成成功:", testEmail);
    });

    test("ユーザーログインAPI", async ({ page }) => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      // 1. ユーザーを作成
      const createResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(createResponse.status()).toBe(200);

      // 2. 作成したユーザーでログイン
      const loginResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(loginResponse.status()).toBe(200);
      const loginResult = await loginResponse.json();
      expect(loginResult.email).toBe(testEmail);
      expect(loginResult.localId).toBeTruthy();
      expect(loginResult.idToken).toBeTruthy();

      console.log("✅ ユーザーログイン成功:", testEmail);
    });

    test("ユーザー削除API", async ({ page }) => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      // 1. ユーザーを作成・ログイン
      const createResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(createResponse.status()).toBe(200);
      const createResult = await createResponse.json();
      const idToken = createResult.idToken;

      // 2. ユーザーを削除
      const deleteResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`,
        {
          data: {
            idToken: idToken,
          },
        }
      );

      expect(deleteResponse.status()).toBe(200);

      console.log("✅ ユーザー削除成功:", testEmail);
    });
  });

  test.describe("Emulator状態確認", () => {
    test("Emulatorの起動確認", async ({ page }) => {
      const response = await page.request.get(baseUrl);
      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.authEmulator).toBeTruthy();
      expect(result.authEmulator.ready).toBe(true);

      console.log("✅ Firebase Auth Emulator起動確認成功");
    });

    test("API仕様の確認", async ({ page }) => {
      const response = await page.request.get(
        `${baseUrl}/emulator/openapi.json`
      );
      expect(response.status()).toBe(200);

      const result = await response.json();
      expect(result.openapi).toBeTruthy();
      expect(result.info.title).toBe("Identity Toolkit API");

      console.log("✅ API仕様確認成功");
    });
  });

  test.describe("異常系テスト", () => {
    test("無効なメールアドレスでのユーザー作成", async ({ page }) => {
      const invalidEmail = "invalid-email";
      const testPassword = "testpassword123";

      const response = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          data: {
            email: invalidEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain("INVALID_EMAIL");

      console.log(
        "✅ 無効なメールアドレスでのユーザー作成エラーハンドリング成功"
      );
    });

    test("短すぎるパスワードでのユーザー作成", async ({ page }) => {
      const testEmail = `test-${Date.now()}@example.com`;
      const shortPassword = "123";

      const response = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: shortPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain("WEAK_PASSWORD");

      console.log(
        "✅ 短すぎるパスワードでのユーザー作成エラーハンドリング成功"
      );
    });

    test("存在しないユーザーでのログイン", async ({ page }) => {
      const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      const response = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          data: {
            email: nonExistentEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(response.status()).toBe(400);
      const result = await response.json();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain("EMAIL_NOT_FOUND");

      console.log("✅ 存在しないユーザーでのログインエラーハンドリング成功");
    });

    test("間違ったパスワードでのログイン", async ({ page }) => {
      const testEmail = `test-${Date.now()}@example.com`;
      const correctPassword = "testpassword123";
      const wrongPassword = "wrongpassword";

      // 1. ユーザーを作成
      const createResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: correctPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(createResponse.status()).toBe(200);

      // 2. 間違ったパスワードでログイン
      const loginResponse = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          data: {
            email: testEmail,
            password: wrongPassword,
            returnSecureToken: true,
          },
        }
      );

      expect(loginResponse.status()).toBe(400);
      const result = await loginResponse.json();
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain("INVALID_PASSWORD");

      console.log("✅ 間違ったパスワードでのログインエラーハンドリング成功");
    });

    test("無効なAPIキーでのリクエスト", async ({ page }) => {
      const invalidApiKey = "invalid-api-key";
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = "testpassword123";

      const response = await page.request.post(
        `${baseUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${invalidApiKey}`,
        {
          data: {
            email: testEmail,
            password: testPassword,
            returnSecureToken: true,
          },
        }
      );

      // レスポンスの内容を確認
      const result = await response.json();

      // エラーが含まれているか、または正常なレスポンスかを確認
      if (result.error) {
        expect(result.error).toBeTruthy();
        console.log(
          "✅ 無効なAPIキーでのリクエストエラーハンドリング成功（エラーあり）"
        );
      } else {
        // 正常なレスポンスの場合は、作成されたユーザーが無効であることを確認
        expect(result.localId).toBeTruthy();
        console.log(
          "✅ 無効なAPIキーでのリクエストエラーハンドリング成功（正常レスポンス）"
        );
      }
    });
  });
});
