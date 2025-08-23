'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function LoginPage() {
  const { isLoading, login, logout } = useAuth();
  const router = useRouter();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // ログインしていない場合の通常のレンダリング
  const handleLogin = async () => {
    console.log('=== Login Process Start ===');
    console.log('1. handleLogin called');
    
    setIsLoginLoading(true);
    try {
      console.log('2. Calling login() function');
      await login();
      console.log('3. login() completed successfully');
      
      console.log('4. Redirecting to /subscription');
      router.push('/subscription');
      console.log('5. router.push completed');
    } catch (error) {
      console.error('ログインエラー:', error);
      alert('ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsLoginLoading(false);
      console.log('6. Login process finished');
    }
  };

  const handleBackToHome = async () => {
    try {
      await logout();
      console.log('ログアウト完了');
      router.push('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      alert('ログアウトに失敗しました');
    }
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
    <div style={{
      ...commonStyles.page.container,
      backgroundImage: 'url(/images/background.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
    }}>
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
            fontSize: '16px',
            cursor: 'pointer',
            color: colors.text.secondary,
          }}
        >
          ← 戻る
        </button>


        {/* ログインカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '20px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '100%',
            width: '100%',
            margin: `${spacing.lg} 0`,
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xxl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
            }}
          >
            <span style={{ color: colors.primary }}>STEP1</span> ログイン
          </h1>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.large,
              marginBottom: spacing.xl,
              lineHeight: 1.6,
            }}
          >
            アプリをご利用いただくには、
            <br />
            Googleアカウントでログインが必要です。
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
              fontSize: fontSize.base,
              color: colors.text.secondary,
              lineHeight: 1.4,
              textAlign: 'left',
            }}
          >
            <p style={{ margin: 0 }}>
              ✅ ログイン後、決済情報の入力をいただいた後に7日間の無料体験をご利用いただけるようになります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
