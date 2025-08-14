'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpeechBubble, PrimaryButton, Spinner } from '@/components/ui';
import KokoronBowing from '@/components/ui/KokoronBowing';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const sessionId = searchParams.get('session_id');

        if (sessionId) {
          const response = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (!response.ok) {
            throw new Error('決済の確認に失敗しました');
          }

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
    router.push('/');
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
            <PrimaryButton onClick={() => router.push('/')}>
              ホームに戻る
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* 吹き出し */}
        <SpeechBubble text="プレミアムプランをご利用いただき、本当にありがとうございます！" />

        {/* こころんキャラクター */}
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
            maxWidth: '450px',
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
            プレミアム会員になりました！
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

          {/* 解放された機能の紹介 */}
          <div
            style={{
              backgroundColor: '#e8f5e8',
              borderRadius: '12px',
              padding: spacing.md,
              margin: `${spacing.md} 0`,
              textAlign: 'left',
              border: '2px solid #4CAF50',
            }}
          >
            <h3
              style={{
                color: '#2E7D32',
                fontSize: fontSize.base,
                fontWeight: 'bold',
                margin: `0 0 ${spacing.sm} 0`,
                textAlign: 'center',
              }}
            >
              ✨ 今すぐ使える全機能
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: spacing.sm,
                fontSize: fontSize.small,
                color: colors.text.primary,
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  📊 レポート機能
                </div>
                <div style={{ color: colors.text.secondary, fontSize: '11px' }}>
                  お子様の感情記録
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  🎭 ロールプレイ
                </div>
                <div style={{ color: colors.text.secondary, fontSize: '11px' }}>
                  様々なシナリオ
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  📈 成長記録
                </div>
                <div style={{ color: colors.text.secondary, fontSize: '11px' }}>
                  長期間の追跡
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  🤖 AI分析
                </div>
                <div style={{ color: colors.text.secondary, fontSize: '11px' }}>
                  高度な感情理解
                </div>
              </div>
            </div>
          </div>

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
