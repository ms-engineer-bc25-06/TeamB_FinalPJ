'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PrimaryButton } from '@/components/ui';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';

export default function PaymentCancelPage() {
  const router = useRouter();

  useEffect(() => {
    // ページ訪問をログに記録（必要に応じて）
    console.log('Payment cancelled');
  }, []);

  const handleReturnHome = () => {
    router.push('/');
  };

  const handleRetryPayment = () => {
    // 決済を再試行する場合の処理
    router.push('/');
  };

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* メッセージカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            margin: `${spacing.lg} 0`,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '400px',
            border: `3px solid #FFA726`, // オレンジ色のボーダー
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: spacing.md,
            }}
          >
            ⚠️
          </div>

          <h1
            style={{
              color: '#FF9800',
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              margin: `0 0 ${spacing.md} 0`,
            }}
          >
            決済がキャンセルされました
          </h1>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.base,
              lineHeight: 1.6,
              margin: `0 0 ${spacing.lg} 0`,
            }}
          >
            プレミアムプランの登録をキャンセルしました。
            <br />
            いつでも再度お試しいただけます。
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
              alignItems: 'center',
            }}
          >
            <PrimaryButton onClick={handleReturnHome}>
              ホームに戻る
            </PrimaryButton>

            <button
              onClick={handleRetryPayment}
              style={{
                background: 'none',
                border: `2px solid ${colors.primary}`,
                color: colors.primary,
                borderRadius: '25px',
                padding: `${spacing.sm} ${spacing.lg}`,
                fontSize: fontSize.base,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '200px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.color = colors.text.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.primary;
              }}
            >
              もう一度試す
            </button>
          </div>
        </div>

        {/* 説明テキスト */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: '350px',
            marginTop: spacing.lg,
          }}
        >
          <p
            style={{
              fontSize: fontSize.small,
              color: colors.text.secondary,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            ご不明な点がございましたら、
            <br />
            メニューのFAQをご確認いただくか、
            <br />
            サポートまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
