'use client';

import { useRouter } from 'next/navigation';
import { KokoronDefault, SpeechBubble, PrimaryButton } from '@/components/ui';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';

export default function AuthedNotFound() {
  const router = useRouter();

  const handleBackToApp = () => {
    router.push('/app');
  };

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        <SpeechBubble text="あれ？ そのページは\nみつからないみたいです..." />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%',
            margin: `${spacing.lg} 0`,
          }}
        >
          <div
            style={{
              fontSize: '4rem',
              marginBottom: spacing.md,
            }}
          >
            🔍
          </div>

          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              margin: `0 0 ${spacing.md} 0`,
            }}
          >
            ページが見つかりません
          </h1>

          <p
            style={{
              color: colors.text.secondary,
              fontSize: fontSize.base,
              lineHeight: 1.6,
              margin: `0 0 ${spacing.lg} 0`,
            }}
          >
            お探しのページは存在しないか、
            <br />
            移動した可能性があります。
          </p>

          <PrimaryButton onClick={handleBackToApp}>
            アプリホームに戻る
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
