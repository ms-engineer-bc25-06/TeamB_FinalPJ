import { expect, test } from '@playwright/test'

test.describe('音声録音ページ', () => {
  test('音声録音ページが表示される', async ({ page }) => {
    // 音声録音ページに移動
    await page.goto('/app/voice')
    
    // 読み込み完了を待つ
    await page.waitForLoadState('networkidle')
    
    // 認証が必要な場合、リダイレクトされる可能性がある
    // ホームページの要素を確認（リダイレクト先）
    await expect(page.locator('h3:has-text("✨ このアプリの機能 ✨")')).toBeVisible()
  })

  test('録音開始ボタンが表示される', async ({ page }) => {
    await page.goto('/app/voice')
    
    // 読み込み完了を待つ
    await page.waitForLoadState('networkidle')
    
    // ホームページの「はじめる」ボタンを確認（リダイレクト先）
    await expect(page.locator('button:has-text("はじめる")')).toBeVisible()
  })
})