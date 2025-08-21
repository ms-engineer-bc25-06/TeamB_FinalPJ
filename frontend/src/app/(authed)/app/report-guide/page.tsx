import { colors, commonStyles, spacing } from '@/styles/theme';

export default function ReportGuidePage() {
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
        レポートページの見かた
      </h1>
      
      <p style={commonStyles.bodyText}>
        レポートページの見かたについての内容はここに記載されます。
      </p>
    </div>
  );
}
