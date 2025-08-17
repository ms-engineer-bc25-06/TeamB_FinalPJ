'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { KokoronDefault, SpeechBubble, Spinner } from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // すでにログイン済みの場合はアプリに遷移
  if (user) {
    router.push('/app');
    return null;
  }

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await login();
      router.push('/app');
    } catch (error) {
      console.error('ログインエラー:', error);
      alert('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* 戻るボタン */}
        <button
          onClick={handleBackToHome}
          style={{
            position: 'absolute',
            top: spacing.lg,
            left: spacing.lg,
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.text.secondary,
          }}
        >
          ← 戻る
        </button>

        <SpeechBubble text="ログインして\nこころんと おはなししよう！" />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* ログインカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
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
            }}
          >
            ログイン
          </h1>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.base,
              marginBottom: spacing.xl,
              lineHeight: 1.6,
            }}
          >
            Googleアカウントでログインして、
            <br />
            7日間の無料体験を始めましょう！
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoginLoading}
            style={{
              ...commonStyles.login.button,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              opacity: isLoginLoading ? 0.7 : 1,
              cursor: isLoginLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoginLoading ? (
              <>
                <Spinner size="small" color="#fff" />
                ログイン中...
              </>
            ) : (
              <>
                <span style={{ fontSize: '20px' }}>🔐</span>
                Googleでログイン
              </>
            )}
          </button>

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
              ✅ 7日間完全無料
              <br />✅ いつでもキャンセル可能
              <br />✅ クレジットカード不要
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
