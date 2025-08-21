// 公開トップページ
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useEffect } from 'react';
import {
  SpeechBubble,
  PrimaryButton,
  Spinner,
} from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
} from '@/styles/theme';

export default function LandingPage() {
  const { user } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const router = useRouter();

  // デバッグログを追加
  console.log('LandingPage render:', { user, subscription, subLoading });

  // ログイン済みかつサブスクリプション登録済みの場合のみアプリに遷移
  useEffect(() => {
    if (user && subscription && !subLoading) {
      console.log('Redirecting to /app');
      router.push('/app');
    }
  }, [user, subscription, subLoading, router]);

  // サブスクリプション情報の読み込み中はローディング表示
  if (subLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログイン済みかつサブスクリプション登録済みの場合は何も表示しない
  if (user && subscription && !subLoading) {
    console.log('Returning null - user logged in with subscription');
    return null;
  }

  const handleLogin = () => {
    router.push('/login');
  };



  return (
    <div style={{
      ...commonStyles.page.container,
      backgroundImage: 'url(/images/publictopbackground.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <div style={{
        ...commonStyles.page.mainContent,
        paddingTop: '350px', 
      }}>
        {/* ヒーローセクション */}
        <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>


          <p
            style={{
              fontSize: fontSize.large,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              lineHeight: 1.6,
              maxWidth: '700px',
              margin: `0 auto ${spacing.xl} auto`,
            }}
          >
            AIパートナー「こころん」が、お子さまの感情教育をサポートします。
            まずは7日間無料でお試しください。
          </p>
        </div>

        {/* こころん吹き出し */}
        <SpeechBubble 
          text="
          いっしょに きもちを たんけんしよう！"
        />
        <div style={{ marginBottom: '400px' }}></div>
        {/* CTA ボタン */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            alignItems: 'center',
            marginTop: '30px',
          }}
        >
          <PrimaryButton
            onClick={handleLogin}
          >
            ログインする
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
