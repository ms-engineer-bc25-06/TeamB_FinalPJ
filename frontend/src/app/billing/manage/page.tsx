// Portal起点（即リダイレクト）
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';
import { commonStyles, spacing, fontSize, colors } from '@/styles/theme';

export default function BillingManagePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const redirectToStripePortal = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Stripe Customer Portal セッションを作成
        const response = await fetch('/api/create-portal-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
          }),
        });

        const { url } = await response.json();

        if (url) {
          // Stripe Customer Portal にリダイレクト
          window.location.href = url;
        } else {
          throw new Error('Portal URL の取得に失敗しました');
        }
      } catch (error) {
        console.error('Portal リダイレクトエラー:', error);
        alert('請求管理ページへの移動に失敗しました。');
        router.push('/app');
      }
    };

    redirectToStripePortal();
  }, [user, router]);

  return (
    <div style={commonStyles.loading.container}>
      <Spinner size="large" />
      <p
        style={{
          marginTop: spacing.lg,
          fontSize: fontSize.base,
          color: colors.text.primary,
          textAlign: 'center',
        }}
      >
        請求管理ページに移動しています...
        <br />
        <span
          style={{ fontSize: fontSize.small, color: colors.text.secondary }}
        >
          しばらくお待ちください
        </span>
      </p>
    </div>
  );
}
