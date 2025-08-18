// 公開トップページ
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  SpeechBubble,
  PrimaryButton,
} from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
} from '@/styles/theme';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // ログイン済みの場合はアプリに遷移
  if (user) {
    router.push('/app');
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
