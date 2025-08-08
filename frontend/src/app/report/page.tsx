// レポートページ
'use client'

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
        <h1 style={{
          color: colors.text.primary,
          fontSize: fontSize.xxl,
          fontWeight: 'bold',
          marginBottom: spacing.xl,
          textAlign: 'center',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
        }}>
          〇〇のこころん
        </h1>
                {/* こころんを表示 */}
                <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={120} />
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
          alignItems: 'center',
        }}>
          <PrimaryButton className="text-small" onClick={() => setShowDailyReport(true)}>
          毎日のきろく
          </PrimaryButton>
          
          <PrimaryButton className="text-small" onClick={() => setShowWeeklyReport(true)}>
          今週のきろく
          </PrimaryButton>
        </div>

        {/* 説明テキスト */}
        <div style={{
          marginTop: spacing.xl,
          textAlign: 'center',
          maxWidth: '300px',
        }}>
        </div>
      </div>

      {/* 日次レポートモーダル */}
      {showDailyReport && (
        <DailyReport onClose={() => setShowDailyReport(false)} />
      )}

      {/* 週次レポートモーダル */}
      {showWeeklyReport && (
        <WeeklyReport onClose={() => setShowWeeklyReport(false)} />
      )}
    </div>
  );
}
