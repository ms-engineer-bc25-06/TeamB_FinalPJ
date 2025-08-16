// 初期設定ページ TODO: 仮実装なのであとで変更すること
'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { KokoronDefault, SpeechBubble, PrimaryButton } from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function SetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim() || !childAge) return;

    setIsSubmitting(true);
    try {
      // プロフィール情報を保存
      // 実際の実装では API を呼び出し
      console.log('プロフィール保存:', { childName, childAge });

      // ダミーでユーザー情報を更新
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...user,
          displayName: childName,
          childAge: Number.parseInt(childAge),
        }),
      );

      // セットアップ完了後、アプリホームに遷移
      router.push('/app');
    } catch (error) {
      console.error('セットアップエラー:', error);
      alert('セットアップに失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        <SpeechBubble text="はじめまして！\nあなたのことを おしえてくださいね！" />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* セットアップフォーム */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            maxWidth: '400px',
            width: '100%',
            margin: `${spacing.lg} 0`,
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}
          >
            初期設定
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                お名前
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="例: たろう"
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  fontSize: fontSize.base,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.xl }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                年齢
              </label>
              <select
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  fontSize: fontSize.base,
                  outline: 'none',
                  backgroundColor: colors.background.white,
                  boxSizing: 'border-box',
                }}
              >
                <option value="">年齢を選択してください</option>
                {Array.from({ length: 10 }, (_, i) => i + 3).map((age) => (
                  <option key={age} value={age}>
                    {age}歳
                  </option>
                ))}
              </select>
            </div>

            <PrimaryButton
              onClick={() => handleSubmit({} as React.FormEvent)}
              disabled={!childName.trim() || !childAge || isSubmitting}
            >
              {isSubmitting ? '設定中...' : 'はじめる'}
            </PrimaryButton>
          </form>

          <div
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              backgroundColor: '#f8f9fa',
              borderRadius: borderRadius.small,
              fontSize: fontSize.small,
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            <p style={{ margin: 0 }}>
              💡 この情報は、お子さまに合わせた
              <br />
              より良い体験を提供するために使用されます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
