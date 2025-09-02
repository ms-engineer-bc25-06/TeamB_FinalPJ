import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './utils/auth'

test.describe('ログイン後の遷移（現状仕様）', () => {
  test('ログイン後はサブスクリプション登録ページへ遷移する', async ({ page }) => {
    await Promise.all([
      page.waitForURL(/\/subscription/, { timeout: 15_000 }),
      loginAsTestUser(page),
    ])

    // サブスク画面の固有要素で確認
    await expect(page.getByRole('heading', { name: /サブスクリプション登録/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /7日間無料で始める/ })).toBeVisible()
  })

  // 将来仕様（登録済みならホームへ）のプレースホルダ
  test.skip('【未実装】登録済みユーザーはホームへ遷移する', async ({ page }) => {
    // 実装後に下記を有効化：
    // await Promise.all([
    //   page.waitForURL(/\/(app|home|dashboard)(\/)?$/, { timeout: 15_000 }),
    //   loginAsTestUser(page),
    // ])
    // await expect(page.getByRole('button', { name: /きもちをきろく\s*する/ })).toBeVisible()
  })
})
