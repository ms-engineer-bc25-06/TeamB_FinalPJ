'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTodayEntry } from '@/hooks/useTodayEntry'
import { useChildren } from '@/hooks/useChildren'
import { useSubscription } from '@/hooks/useSubscription'
import PrimaryButton from '@/components/ui/PrimaryButton'
import Spinner from '@/components/ui/Spinner'

export default function TodayEntryPage() {
  const router = useRouter()
  const { todayEntry, isLoading } = useTodayEntry()
  const { loading: childrenLoading } = useChildren()
  const { loading: subscriptionLoading } = useSubscription()

  const [isUpdating, setIsUpdating] = useState(false)

  // 今日の日付を取得
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  // 記録の存在確認
  const hasEntry = !!todayEntry

  // 更新処理
  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      // 感情選択画面から開始
      router.push('/app/emotion-selection')
    } catch (error) {
      console.error('更新処理でエラーが発生しました:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // ローディング状態
  if (isLoading || childrenLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">今日の記録</h1>
          <p className="text-lg text-gray-600">{today}</p>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ステータス表示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                記録の状態
              </h2>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${hasEntry ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-gray-700">
                  {hasEntry ? '今日の記録があります' : '今日の記録はありません'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">1日1件の制約</p>
              <p className="text-xs text-gray-400">重複記録は自動的に更新されます</p>
            </div>
          </div>
        </div>

        {/* 記録がある場合 */}
        {hasEntry && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">既存の記録</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  感情
                </label>
                <p className="text-gray-900">{todayEntry.emotion}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  感情強度
                </label>
                <p className="text-gray-900">{todayEntry.intensity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作成日時
                </label>
                <p className="text-gray-900">
                  {new Date(todayEntry.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  記録日
                </label>
                <p className="text-gray-900">
                  {new Date(todayEntry.date).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
            {todayEntry.transcript && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  記録内容
                </label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {todayEntry.transcript}
                </p>
              </div>
            )}
            <div className="flex space-x-4">
              <PrimaryButton onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? '更新中...' : '記録を更新'}
              </PrimaryButton>
              <button
                onClick={() => router.push('/app/emotion-selection')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                感情選択ページへ
              </button>
            </div>
          </div>
        )}
        {/* 1日1件制約の説明は削除 */}
      </div>
    </div>
  )
}