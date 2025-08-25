import { colors, commonStyles, spacing, fontSize, borderRadius } from '@/styles/theme';

export default function ReportGuidePage() {
  return (
    <div style={{
      ...commonStyles.page.container,
      backgroundImage: 'url(/images/background.webp)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: spacing.md,
      minHeight: '100vh',
      overflow: 'auto',
    }}>
      <div style={commonStyles.page.mainContent}>
        <div style={{
          backgroundColor: colors.background.white,
          borderRadius: borderRadius.large,
          padding: spacing.lg,
          boxShadow: colors.shadow.heavy,
          maxWidth: '80vw', 
          width: '80vw', 
          margin: '0 auto',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative', 
          left: '50%', 
          transform: 'translateX(-50%)', 
        }}>
          <h1 style={{
            color: colors.text.primary,
            fontSize: fontSize.xl,
            fontWeight: 'bold',
            marginBottom: spacing.lg,
            textAlign: 'center',
          }}>
            レポートページガイド
          </h1>
          
          <div style={{ marginBottom: spacing.lg }}>
            <h2 style={{
              color: colors.text.primary,
              fontSize: fontSize.large,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
              borderBottom: `2px solid ${colors.primary}`,
              paddingBottom: spacing.xs,
            }}>
              📖 「まいにちのきろく」の見方
            </h2>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: spacing.sm,
              borderRadius: borderRadius.medium,
              marginBottom: spacing.sm,
            }}>
              <h3 style={{
                color: colors.text.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.xs,
              }}>
                カレンダー表示
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                lineHeight: 1.5,
                margin: 0,
              }}>
                月間カレンダーで感情記録を確認できます。記録がある日には感情カードのアイコンが表示され、クリックすると詳細を見ることができます。
              </p>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: spacing.sm,
              borderRadius: borderRadius.medium,
              marginBottom: spacing.sm,
            }}>
              <h3 style={{
                color: colors.text.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.xs,
              }}>
                感情の強度
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                lineHeight: 1.5,
                margin: 0,
              }}>
                感情カードの色の濃さで感情の強度を表現しています。薄い色は弱い感情、濃い色は強い感情を示します。
              </p>
            </div>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <h2 style={{
              color: colors.text.primary,
              fontSize: fontSize.large,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
              borderBottom: `2px solid ${colors.primary}`,
              paddingBottom: spacing.xs,
            }}>
              👓 「こんしゅうのきろく」の見方
            </h2>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: spacing.sm,
              borderRadius: borderRadius.medium,
              marginBottom: spacing.sm,
            }}>
              <h3 style={{
                color: colors.text.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.xs,
              }}>
                感情の傾向
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                lineHeight: 1.5,
                margin: 0,
              }}>
                1週間の感情記録をリストアップします。どの感情が多かったか、感情の強度の変化などが一目で分かります。
              </p>
            </div>
          </div>

          <div style={{ marginBottom: spacing.lg }}>
            <h2 style={{
              color: colors.text.primary,
              fontSize: fontSize.large,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
              borderBottom: `2px solid ${colors.primary}`,
              paddingBottom: spacing.xs,
            }}>
              💡 活用のコツ
            </h2>
            
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: spacing.sm,
              borderRadius: borderRadius.medium,
              marginBottom: spacing.sm,
            }}>
              <h3 style={{
                color: colors.text.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.xs,
              }}>
                定期的な確認
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                lineHeight: 1.5,
                margin: 0,
              }}>
                週に1回、週次レポートを確認する習慣をつけましょう。子どもの感情の変化に気づきやすくなります。
              </p>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              padding: spacing.sm,
              borderRadius: borderRadius.medium,
              marginBottom: spacing.sm,
            }}>
              <h3 style={{
                color: colors.text.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.xs,
              }}>
                子どもとの対話
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                lineHeight: 1.5,
                margin: 0,
              }}>
                レポートの内容を子どもと一緒に見て、その日の出来事について話し合ってみましょう。子どもの感情理解が深まります。
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: colors.primary,
            color: colors.text.white,
            padding: spacing.md,
            borderRadius: borderRadius.medium,
            textAlign: 'left',
            marginTop: spacing.lg,
          }}>
            <h3 style={{
              fontSize: fontSize.base,
              fontWeight: 'bold',
              marginBottom: spacing.xs,
            }}>
              レポートを活用して、子どもの感情教育をサポートしましょう！
            </h3>
            <p style={{
              fontSize: fontSize.small,
              margin: 0,
              opacity: 0.9,
            }}>
              感情記録とレポートを組み合わせることで、子どもの成長をより深く理解できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
