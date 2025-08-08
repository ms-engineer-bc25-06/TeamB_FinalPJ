'use client';
// レポートページ
import { useState } from 'react';
import DailyReport from '@/components/report/DailyReport';
import WeeklyReport from '@/components/report/WeeklyReport';
import { PrimaryButton, KokoronDefault } from '@/components/ui';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';

export default function ReportPage() {
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* こころんキャラクター */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={120} />
        </div>

        <h1
          style={{
            color: colors.text.primary,
            fontSize: fontSize.xxl,
            fontWeight: 'bold',
            marginBottom: spacing.xl,
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          レポート
        </h1>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
            alignItems: 'center',
          }}
        >
          <PrimaryButton onClick={() => setShowDailyReport(true)}>
            日次レポート
          </PrimaryButton>

          <PrimaryButton onClick={() => setShowWeeklyReport(true)}>
            週次レポート
          </PrimaryButton>
        </div>

        {/* 説明テキスト */}
        <div
          style={{
            marginTop: spacing.xl,
            textAlign: 'center',
            maxWidth: '300px',
          }}
        >
          <p
            style={{
              fontSize: fontSize.base,
              color: colors.text.secondary,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            日次レポートでカレンダーから日付を選択して記録を確認できます
          </p>
        </div>
      </div>

      {showDailyReport && (
        <DailyReport onClose={() => setShowDailyReport(false)} />
      )}

      {showWeeklyReport && (
        <WeeklyReport onClose={() => setShowWeeklyReport(false)} />
      )}
    </div>
  );
}
