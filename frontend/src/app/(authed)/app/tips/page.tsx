import { colors, commonStyles, spacing } from '@/styles/theme';

export default function TipsPage() {
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
        保護者向けTips
      </h1>
      
      <p style={commonStyles.bodyText}>
        保護者向けTipsの内容はここに記載されます。
      </p>
    </div>
  );
}
