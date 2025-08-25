'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { HamburgerMenu, BillingInfoContent } from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function BillingHelpPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 認証チェック
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleBack = () => {
    router.push('/app/subscription');
  };

  // ローディング中
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // 未認証の場合
  if (!user) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'url("/images/background.webp") no-repeat center center',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      overflow: 'auto',
    }}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '100vh',
        padding: `${spacing.xl} ${spacing.lg}`,
        paddingTop: '100px',
      }}>
        {/* 戻るボタン */}
        <button
          onClick={handleBack}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            color: '#000000',
            zIndex: 1000,
            fontWeight: 'bold',
          }}
        >
          ← もどる
        </button>

        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            maxWidth: '80vw',
            width: '80vw',
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
            料金・解約について
          </h1>

          {/* 共通コンテンツ */}
          <BillingInfoContent />

          <div
            style={{
              textAlign: 'center',
              marginTop: spacing.xl,
              padding: spacing.lg,
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.medium,
            }}
          >
            <p
              style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                margin: 0,
              }}
            >
              その他ご不明な点がございましたら、
              <br />
              サポートまでお気軽にお問い合わせください。
            </p>
          </div>

          {/* サブスクリプション管理に戻るボタン */}
          <div style={{
            textAlign: 'center',
            marginTop: spacing.lg,
          }}>
            <button
              onClick={() => router.push('/app/subscription')}
              style={{
                backgroundColor: colors.primary,
                color: colors.background.white,
                border: 'none',
                borderRadius: borderRadius.button,
                padding: `${spacing.md} ${spacing.xl}`,
                fontSize: fontSize.large,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
              }}
            >
              サブスクリプション管理に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 