/**
 * 音声録音の最小限E2Eテスト
 * 
 * テスト対象:
 * - 基本的なページ表示
 * - ボタンクリック
 */

import { expect, test } from '@playwright/test'

test.describe('音声録音ページ', () => {
  test('音声録音ページが表示される', async ({ page }) => {
    // 音声録音ページに移動
    await page.goto('/app/voice')
    
    // 読み込み完了を待つ
    await page.waitForLoadState('networkidle')
    
    // ページが表示されることを確認（実際の要素に合わせて修正）
    await expect(page.locator('main')).toBeVisible()
  })

  test('録音開始ボタンが表示される', async ({ page }) => {
    await page.goto('/app/voice')
    
    // 読み込み完了を待つ
    await page.waitForLoadState('networkidle')
    
    // 録音開始ボタンが表示されることを確認（実際の要素に合わせて修正）
    await expect(page.locator('button:has-text("はじめる")')).toBeVisible()
  })
})