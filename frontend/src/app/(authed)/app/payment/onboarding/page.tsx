// 成功戻り&案内ページ
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  KokoronDefault,
  SpeechBubble,
  PrimaryButton,
  Spinner,
} from '@/components/ui';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';

export default function PaymentOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 決済成功後の処理
    const processPaymentSuccess = async () => {
      try {
        // URLパラメータから必要な情報を取得
        const sessionId = searchParams.get('session_id');

        if (sessionId) {
          // バックエンドに決済完了を通知してユーザーの権限を更新
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

  const handleViewReports = () => {
    // レポート機能を試してもらう
    router.push('/app/report');
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
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* 吹き出し */}
        <SpeechBubble text="おめでとうございます！\nプレミアム会員になりました！" />

        {/* こころんキャラクター */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
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
            ようこそプレミアム会員へ！
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
            こころんとの特別な時間をお楽しみください。
          </p>

          {/* 主要機能の紹介 */}
          <div
            style={{
              backgroundColor: '#e8f5e8',
              borderRadius: '12px',
              padding: spacing.md,
              margin: `${spacing.md} 0`,
              textAlign: 'left',
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
              ✨ 新しく使える機能
            </h3>
            <div
              style={{
                fontSize: fontSize.small,
                color: colors.text.primary,
                lineHeight: 1.5,
              }}
            >
              <div style={{ marginBottom: spacing.xs }}>
                📊 <strong>詳細レポート</strong> - 感情の変化を分析
              </div>
              <div style={{ marginBottom: spacing.xs }}>
                💬 <strong>無制限会話</strong> - 回数制限なし
              </div>
              <div style={{ marginBottom: spacing.xs }}>
                🤖 <strong>AI分析</strong> - 高度な感情理解
              </div>
              <div>
                📈 <strong>成長記録</strong> - 長期間の追跡
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
              すべての機能を使ってみる
            </PrimaryButton>

            <button
              onClick={handleViewReports}
              style={{
                background: 'none',
                border: `2px solid #2196F3`,
                color: '#2196F3',
                borderRadius: '20px',
                padding: `${spacing.xs} ${spacing.md}`,
                fontSize: fontSize.small,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minWidth: '200px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2196F3';
                e.currentTarget.style.color = colors.text.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#2196F3';
              }}
            >
              📊 レポートを見る
            </button>
          </div>
        </div>

        {/* 感謝メッセージ */}
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
            プレミアムプランをご利用いただき、
            <br />
            本当にありがとうございます！
            <br />
            <strong>こころんと一緒に、素敵な感情の旅を始めましょう！</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
