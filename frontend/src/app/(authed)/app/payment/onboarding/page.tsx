// 成功戻り&案内ページ
'use client';

import { PrimaryButton, SpeechBubble, Spinner } from '@/components/ui';
import KokoronBowing from '@/components/ui/KokoronBowing';
import { useAuth } from '@/contexts/AuthContext';
import { verifyPayment } from '@/lib/api';
import { colors, commonStyles, fontSize, spacing } from '@/styles/theme';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PaymentOnboardingContent() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const sessionId = searchParams.get('session_id');

        if (sessionId && firebaseUser) {
          const result = await verifyPayment(sessionId, firebaseUser);

          if (!result.success) {
            throw new Error('決済の確認に失敗しました');
          }

          // ユーザー情報を更新（有料会員フラグをONに）
          console.log(
            'Payment verified successfully - User upgraded to premium',
          );
        }

        setIsProcessing(false);
      } catch (error) {
        console.error('Payment verification error:', error);
        setError('決済の確認中にエラーが発生しました');
        setIsProcessing(false);
      }
    };

    processPaymentSuccess();
  }, [searchParams]);

  const handleStartUsingAllFeatures = () => {
    // 全機能が使えるホーム画面に戻る
    router.push('/app');
  };

  if (isProcessing) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="large" />
        <p
          style={{
            marginTop: spacing.lg,
            fontSize: fontSize.base,
            color: colors.text.primary,
          }}
        >
          アカウントをアップグレード中...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={commonStyles.page.container}>
        <div style={commonStyles.page.mainContent}>
          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: '16px',
              padding: spacing.xl,
              textAlign: 'center',
              border: `3px solid #f44336`,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>❌</div>
            <h1 style={{ color: '#f44336', marginBottom: spacing.md }}>
              エラーが発生しました
            </h1>
            <p
              style={{ color: colors.text.secondary, marginBottom: spacing.lg }}
            >
              {error}
            </p>
            <PrimaryButton onClick={() => router.push('/app')}>
              ホームに戻る
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...commonStyles.page.container,
        backgroundImage: 'url(/images/background.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          ...commonStyles.page.mainContent,
          width: '90%',
          maxWidth: '1000px',
        }}
      >
        {/* 吹き出し */}
        <SpeechBubble text="サブスクリプションをご利用いただき、本当にありがとうございます！" />

        {/* こころんアイコン */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronBowing size={200} />
        </div>

        {/* 成功メッセージカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            margin: `${spacing.lg} 0`,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '700px',
            width: '80%',
            border: `3px solid #4CAF50`,
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: spacing.md,
            }}
          >
            🎉
          </div>

          <h1
            style={{
              color: '#4CAF50',
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              margin: `0 0 ${spacing.md} 0`,
            }}
          >
            サブスクリプションに登録しました！
          </h1>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.base,
              lineHeight: 1.6,
              margin: `0 0 ${spacing.lg} 0`,
            }}
          >
            🔓 <strong>すべての機能が解放されました！</strong>
            <br />
            こころんと一緒に、
            <br />
            お子さんの心を育む毎日を楽しみましょう。
          </p>

          {/* アクションボタン */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.sm,
              alignItems: 'center',
            }}
          >
            <PrimaryButton onClick={handleStartUsingAllFeatures}>
              早速使ってみる
            </PrimaryButton>
            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentOnboardingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentOnboardingContent />
    </Suspense>
  );
}
