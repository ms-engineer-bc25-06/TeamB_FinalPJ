import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './utils/auth'

test.describe('ログイン（操作のみ）', () => {
  test('フォーム入力→送信までは成功する', async ({ page }) => {
    await loginAsTestUser(page)

    // 送信後、何らかのページへ遷移
    await expect(page).not.toHaveURL(/\/login$/)
  })
})