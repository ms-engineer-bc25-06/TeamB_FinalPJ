import { colors, commonStyles, spacing } from '@/styles/theme';

export default function FAQPage() {
  return (
    <div style={{
      ...commonStyles.pageContainer,
      padding: spacing.xl,
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{
        ...commonStyles.heading,
        marginBottom: spacing.lg,
        textAlign: 'center'
      }}>
        よくある質問（FAQ）
      </h1>
      
      <p style={commonStyles.bodyText}>
        FAQの内容はここに記載されます。
      </p>
    </div>
  );
}
