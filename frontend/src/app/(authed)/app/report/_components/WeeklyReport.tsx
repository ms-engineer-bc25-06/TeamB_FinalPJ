'use client'

import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';

interface WeeklyReportProps {
  onClose: () => void;
}

// モックデータ
const sampleWeeklyReports: ReportData[] = [
    {
      content: 'この一週間は全体的に良い調子でした。特に月曜日と金曜日は気分が良く、積極的に活動できました。',
    },
    {
      date: '2024-01-20',
      content: 'おともだちにおもちゃをとられちゃってかなしかった',
      mood: '😭'
    },
    {
      date: '2024-01-24',
      content: 'またおともだちにおもちゃをとられちゃった',
      mood: '😡'
    }
  ];

export default function WeeklyReport({ onClose }: WeeklyReportProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: colors.background.white,
        borderRadius: borderRadius.large,
        padding: spacing.xl,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        border: `3px solid ${colors.primary}`,
        width: '600px',
        height: '500px',
      }}>
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.text.secondary,
          }}
        >
          ×
        </button>

        {/* タイトル */}
        <div style={{
          textAlign: 'center',
          marginBottom: spacing.lg,
        }}>
          <h2 style={{
            color: colors.secondary,
            fontSize: fontSize.large,
            fontWeight: 'bold',
            margin: 0,
          }}>
            こんしゅうのきろく
          </h2>
        </div>

        {/* 週間レポート内容 */}
        <div style={{
          borderRadius: borderRadius.medium,
          padding: spacing.lg,
          backgroundColor: colors.background.white,
          height: '350px',
          overflow: 'auto',
        }}>
          <h3 style={{
            color: colors.secondary,
            fontSize: fontSize.base,
            fontWeight: 'bold',
            margin: `0 0 ${spacing.md} 0`,
          }}>
            こんしゅうのふりかえり
          </h3>
          
          <div style={{
            fontSize: fontSize.base,
            color: colors.text.primary,
            lineHeight: 1.6,
          }}>
            <p>
                {sampleWeeklyReports[0].content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
