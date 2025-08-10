'use client'

import { useState } from 'react';
import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';

interface DailyReportProps {
  onClose: () => void;
}

interface ReportData {
  date: string;
  content: string;
  mood: string;
}

// モックデータ
const sampleReports: ReportData[] = [
  {
    date: '2024-01-15',
    content: 'きょうはねきぶんがよかったよ　あたらしいおともだちとあそんだんだ',
    mood: '😊'
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

export default function DailyReport({ onClose }: DailyReportProps) {
  const [selectedDate, setSelectedDate] = useState<string>('2024-01-24');
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 0, 1)); // 2024年1月

  // カレンダーの日付を生成
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const selectedReport = sampleReports.find(report => report.date === selectedDate);

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const hasReport = (date: Date) => {
    const dateStr = formatDate(date);
    return sampleReports.some(report => report.date === dateStr);
  };

  const getReportMood = (date: Date) => {
    const dateStr = formatDate(date);
    const report = sampleReports.find(report => report.date === dateStr);
    return report?.mood || '';
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

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
        width: '500px',
        height: '700px',
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
            zIndex: 1001,
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
            まいにちのきろく
          </h2>
        </div>

        {/* 選択された日付の表示 */}
        <div style={{
          backgroundColor: colors.primary,
          color: colors.background.white,
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: borderRadius.small,
          textAlign: 'center',
          marginBottom: spacing.md,
          fontSize: fontSize.base,
          fontWeight: 'bold',
        }}>
          {formatDisplayDate(selectedDate)}
        </div>

        {/* カレンダー部分 */}
        <div style={{
          border: `2px solid ${colors.primary}`,
          borderRadius: borderRadius.medium,
          padding: spacing.md,
          marginBottom: spacing.lg,
          backgroundColor: colors.background.white,
          height: '400px',
        }}>
          {/* 月表示とナビゲーション */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: fontSize.base, fontWeight: 'bold' }}>
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.primary,
                fontSize: '18px',
                cursor: 'pointer',
              }}
            >
              ›
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: spacing.sm,
          }}>
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontSize: fontSize.small,
                fontWeight: 'bold',
                color: colors.text.secondary,
                padding: spacing.xs,
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
          }}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
              const dateStr = formatDate(date);
              const hasReportData = hasReport(date);
              const mood = getReportMood(date);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isCurrentMonth) {
                      setSelectedDate(dateStr);
                    }
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: 'none',
                    borderRadius: borderRadius.small,
                    backgroundColor: isSelected ? colors.primary : 
                                   hasReportData ? '#FFF3E0' : 
                                   isCurrentMonth ? colors.background.white : '#f5f5f5',
                    color: isSelected ? colors.text.white :
                           isCurrentMonth ? colors.text.primary : colors.text.secondary,
                    fontSize: fontSize.small,
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <span>{date.getDate()}</span>
                  {mood && (
                    <span style={{ fontSize: '12px', position: 'absolute', bottom: '2px' }}>
                      {mood}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* レポート表示部分 */}
        <div style={{
          border: `3px solid ${colors.primary}`,
          borderRadius: borderRadius.medium,
          padding: spacing.md,
          backgroundColor: colors.background.white,
          height: '150px',
          overflow: 'auto',
        }}>
          {selectedReport ? (
            <div>
              <div style={{
                fontSize: fontSize.base,
                color: colors.text.primary,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}>
                {selectedReport.content}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: colors.text.secondary,
              fontSize: fontSize.base,
            }}>
              この日付にはレポートがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
