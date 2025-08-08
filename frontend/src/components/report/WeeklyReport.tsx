'use client'

import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';

interface WeeklyReportProps {
  onClose: () => void;
}

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
        border: `3px solid #4CAF50`,
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
            color: '#4CAF50',
            fontSize: fontSize.large,
            fontWeight: 'bold',
            margin: 0,
          }}>
            週間レポート
          </h2>
        </div>

        {/* 週間レポート内容 */}
        <div style={{
          border: `3px solid #9C27B0`,
          borderRadius: borderRadius.medium,
          padding: spacing.lg,
          backgroundColor: colors.background.white,
          height: '350px',
          overflow: 'auto',
        }}>
          <h3 style={{
            color: '#9C27B0',
            fontSize: fontSize.base,
            fontWeight: 'bold',
            margin: `0 0 ${spacing.md} 0`,
          }}>
            1週間の感情ふりかえり by AI
          </h3>
          
          <div style={{
            fontSize: fontSize.base,
            color: colors.text.primary,
            lineHeight: 1.6,
          }}>
            <p style={{ margin: `0 0 ${spacing.md} 0` }}>
              今週の振り返り:
            </p>
            <p style={{ margin: `0 0 ${spacing.md} 0` }}>
              この一週間は全体的に良い調子でした。特に月曜日と金曜日は気分が良く、積極的に活動できました。
            </p>
            <p style={{ margin: `0 0 ${spacing.md} 0` }}>
              中間の水曜日は少し疲れを感じましたが、友人との会話で元気を取り戻すことができました。
            </p>
            <p style={{ margin: 0 }}>
              来週は更に充実した日々を送れるよう、規則正しい生活を心がけたいと思います。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
