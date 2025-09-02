import { Page, expect } from '@playwright/test'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.e2e.local' })

const EMAIL = process.env.E2E_TEST_USER_EMAIL ?? ''
const PASSWORD = process.env.E2E_TEST_USER_PASSWORD ?? ''

if (!EMAIL || !PASSWORD) {
  throw new Error('E2E_TEST_USER_EMAIL または E2E_TEST_USER_PASSWORD が未設定です')
}

/** フォームに入力してログインボタンを押す */
export async function loginAsTestUser(page: Page) {
  await page.goto('/login')

  const emailInput = page.locator('[data-testid="login-email"], input[type="email"], [name="email"]')
  const passwordInput = page.locator('[data-testid="login-password"], input[type="password"], [name="password"]')
  const submitBtn = page.locator(
    '[data-testid="login-submit"], button[type="submit"], button:has-text("ログイン"), input[type="submit"]'
  )

  await expect(emailInput).toBeVisible()
  await expect(passwordInput).toBeVisible()
  await emailInput.fill(EMAIL)
  await passwordInput.fill(PASSWORD)

  // クリック（どこへ遷移するかは仕様ごとに異なる）
  await submitBtn.click()
}
