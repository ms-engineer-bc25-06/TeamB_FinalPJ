import { colors, commonStyles, spacing } from '@/styles/theme';

export default function PrivacyPage() {
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
        プライバシーポリシー
      </h1>
      
      <p style={commonStyles.bodyText}>
        プライバシーポリシーの内容はここに記載されます。
      </p>
    </div>
  );
}
