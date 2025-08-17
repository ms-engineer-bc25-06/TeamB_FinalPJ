// ペイウォール
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  KokoronDefault,
  SpeechBubble,
  PrimaryButton,
  Spinner,
} from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartSubscription = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsProcessing(true);
    try {
      // Stripe Checkout セッションを作成
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('決済エラー:', error);
      alert('決済の開始に失敗しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToApp = () => {
    router.push('/app');
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
        {user && (
          <button
            onClick={handleBackToApp}
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
            ← アプリに戻る
          </button>
        )}

        <SpeechBubble text="プレミアムプランで\nもっと たくさん あそぼう！" />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* 料金プランカード */}
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '450px',
            width: '100%',
            margin: `${spacing.lg} 0`,
            border: `3px solid ${colors.primary}`,
          }}
        >
          <div
            style={{
              backgroundColor: colors.primary,
              color: colors.text.white,
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: '20px',
              fontSize: fontSize.small,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
              display: 'inline-block',
            }}
          >
            🌟 おすすめ
          </div>

          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xxl,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
            }}
          >
            プレミアムプラン
          </h1>

          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: colors.primary,
              marginBottom: spacing.xs,
            }}
          >
            ¥980
            <span
              style={{
                fontSize: fontSize.base,
                color: colors.text.secondary,
                fontWeight: 'normal',
              }}
            >
              /月
            </span>
          </div>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.small,
              marginBottom: spacing.lg,
            }}
          >
            7日間無料体験付き
          </p>

          {/* 機能一覧 */}
          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: borderRadius.medium,
              padding: spacing.lg,
              marginBottom: spacing.xl,
              textAlign: 'left',
            }}
          >
            <h3
              style={{
                color: colors.text.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.md,
                textAlign: 'center',
              }}
            >
              ✨ すべての機能が使い放題
            </h3>

            <div
              style={{
                display: 'grid',
                gap: spacing.sm,
                fontSize: fontSize.small,
                color: colors.text.primary,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span>✅</span>
                <span>無制限の感情記録</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span>✅</span>
                <span>詳細な分析レポート</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span>✅</span>
                <span>AIによる個別アドバイス</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span>✅</span>
                <span>ロールプレイ機能</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span>✅</span>
                <span>成長記録の長期保存</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <span>✅</span>
                <span>優先サポート</span>
              </div>
            </div>
          </div>

          <PrimaryButton
            onClick={handleStartSubscription}
            disabled={isProcessing}
          >
            {isProcessing ? '処理中...' : '7日間無料で始める'}
          </PrimaryButton>

          <p
            style={{
              fontSize: fontSize.small,
              color: colors.text.secondary,
              marginTop: spacing.md,
              lineHeight: 1.4,
            }}
          >
            無料期間中はいつでもキャンセル可能です。
            <br />
            キャンセルした場合、料金は一切発生しません。
          </p>
        </div>

        {/* FAQ リンク */}
        <button
          onClick={() => router.push('/help/billing')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.primary,
            fontSize: fontSize.small,
            cursor: 'pointer',
            textDecoration: 'underline',
            marginTop: spacing.md,
          }}
        >
          料金・解約について詳しく見る
        </button>
      </div>
    </div>
  );
}
