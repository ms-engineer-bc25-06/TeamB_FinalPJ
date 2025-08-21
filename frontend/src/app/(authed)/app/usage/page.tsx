import { colors, commonStyles, spacing } from '@/styles/theme';

export default function UsagePage() {
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
        使い方
      </h1>
      
      <p style={commonStyles.bodyText}>
        使い方の内容はここに記載されます。
      </p>
    </div>
  );
}
