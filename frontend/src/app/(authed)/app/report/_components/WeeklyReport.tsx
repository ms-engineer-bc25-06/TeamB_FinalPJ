'use client'

import { useState, useEffect } from 'react';
import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getEmotionLogsByMonth, getEmotionCards, getIntensities } from '@/lib/api';

interface WeeklyReportProps {
  onClose: () => void;
}

interface ReportData {
  date: string;
  content: string;
  mood?: string;
  comment?: string;
  emotion_card?: {
    label: string;
    color: string;
    image_url: string;
  };
  intensity_id?: number;
  audio_file_path?: string;
}

export default function WeeklyReport({ onClose }: WeeklyReportProps) {
  const { firebaseUser } = useAuth();
  const [emotionLogs, setEmotionLogs] = useState<ReportData[]>([]);
  const [emotionCards, setEmotionCards] = useState<{ id: string; label: string; image_url: string; color: string }[]>([]);
  const [intensities, setIntensities] = useState<{ id: number; color_modifier: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 現在の日付を基準にして、その週の月曜日を自動計算
  const getCurrentWeekMonday = (): Date => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 月曜日始まりにするための調整
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToSubtract);
    
    return monday;
  };
  
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekMonday());

  // 週の切り替え機能
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  // 現在表示中の週の範囲を取得
  const getCurrentWeekRange = (): string => {
    const weekStart = new Date(currentWeek);
    const weekEnd = new Date(currentWeek);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startMonth = weekStart.getMonth() + 1;
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.getMonth() + 1;
    const endDay = weekEnd.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth}月${startDay}日〜${endDay}日`;
    } else {
      return `${startMonth}月${startDay}日〜${endMonth}月${endDay}日`;
    }
  };

  // 感情ログデータ、感情カード、強度データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return;
      
      try {
        setIsLoading(true);
        const year = currentWeek.getFullYear();
        const month = currentWeek.getMonth() + 1;
        
        const [logs, cardsData, intensitiesData] = await Promise.all([
          getEmotionLogsByMonth(firebaseUser, year, month),
          getEmotionCards(firebaseUser),
          getIntensities(firebaseUser)
        ]);
        
        // デバッグ
        console.log('取得した感情ログ:', logs);

        setEmotionCards(cardsData.cards || []);
        setIntensities(intensitiesData.intensities || []);
        
        const transformedLogs: ReportData[] = logs.map((log: {
          id: string;
          created_at: string;
          voice_note?: string;
          audio_file_path?: string;
          emotion_card?: {
            label: string;
            color: string;
            image_url: string;
          };
          intensity_id?: number;
        }) => ({
          id: log.id,
          date: new Date(log.created_at).toISOString().split('T')[0],
          content: log.voice_note || '音声メモがありません',
          mood: getEmotionMood(log.emotion_card?.label),
          comment: '', 
          audio_file_path: log.audio_file_path,
          emotion_card: log.emotion_card,
          intensity_id: log.intensity_id
        }));
        
        console.log('変換後の感情ログ:', transformedLogs);
        
        setEmotionLogs(transformedLogs);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // エラー時は空配列を設定
        setEmotionLogs([]);
        setEmotionCards([]);
        setIntensities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, currentWeek]);

  // 感情ラベルから絵文字を取得
  const getEmotionMood = (label?: string): string => {
    if (!label) return '😐';
    
    const moodMap: { [key: string]: string } = {
      'うれしい': '😊',
      'かなしい': '😭',
      'こわい': '😨',
      'おこり': '😡',
      'びっくり': '😲',
      'しんぱい': '😰',
      'はずかしい': '😳',
      'こまった': '😅',
      'わからない': '🤔',
      'あんしん': '😌',
      'きんちょう': '😰',
      'ふゆかい': '😞',
      'ゆかい': '😄'
    };
    
    return moodMap[label] || '😐';
  };

  // 週間のデータを取得（現在の週の7日分）
  const getWeeklyData = (): ReportData[] => {
    // 現在の週の月曜日を計算
    const weekStart = new Date(currentWeek);
    
    // 日本時間のオフセットを考慮
    const jstOffset = 9 * 60;
    weekStart.setMinutes(weekStart.getMinutes() + jstOffset);
    
    const currentDayOfWeek = weekStart.getDay(); // 0=日曜日, 1=月曜日, ..., 6=土曜日
    
    // 月曜日始まりにするための調整
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToSubtract);
    
    console.log('週の開始日:', weekStart.toISOString().split('T')[0], '曜日:', ['日', '月', '火', '水', '木', '金', '土'][weekStart.getDay()]);
    console.log('現在の週の状態:', currentWeek);
    console.log('感情ログの総数:', emotionLogs.length);
    
    const weeklyData: ReportData[] = [];
    
    // 月曜日から日曜日まで7日分のデータを生成
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      // 日本時間で日付文字列を生成
      const jstDate = new Date(date.getTime() + (jstOffset * 60 * 1000));
      const dateStr = jstDate.toISOString().split('T')[0];
      
      const log = emotionLogs.find(log => log.date === dateStr);
      console.log(`日付 ${dateStr} の検索結果:`, log);
      
      if (log) {
        weeklyData.push(log);
      } else {
        // データがない日は空のレコードを作成
        weeklyData.push({
          date: dateStr,
          content: 'この日は記録がありません',
          mood: '😐'
        });
      }
    }
    
    console.log('生成された週間データ:', weeklyData);
    return weeklyData;
  };

  // TODO:週間データを分析してまとめメッセージを生成予定
  const generateWeeklyMessage = (): string => {
    const weeklyData = getWeeklyData();
    const recordedDays = weeklyData.filter(day => day.content !== 'この日は記録がありません').length;
    const totalDays = weeklyData.length;
    
    if (recordedDays === 0) {
      return 'こんしゅうはきろくがありませんでした。';
    } else if (recordedDays <= 2) {
      return 'こんしゅうは少しだけきろくできていたね！';
    } else if (recordedDays <= 4) {
      return 'こんしゅうはよくきろくできました！';
    } else if (recordedDays <= 6) {
      return 'こんしゅうはたくさんきろくできました！';
    } else {
      return 'こんしゅうはまいにちきろくできました！✨';
    }
  };

  // 日付を日本語形式でフォーマット
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    
    // 日本時間のオフセットを考慮
    const jstOffset = 9 * 60;
    const jstDate = new Date(date.getTime() + (jstOffset * 60 * 1000));
    
    const month = jstDate.getMonth() + 1;
    const day = jstDate.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[jstDate.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

  if (isLoading) {
    return (
      <div
        style={{
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
        }}
      >
        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: borderRadius.large,
            padding: spacing.xl,
            textAlign: 'center',
          }}
        >
          <div>データを読み込み中...</div>
        </div>
      </div>
    );
  }

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
        border: `3px solid #cccccc`,
        width: '600px',
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
            fontSize: fontSize.xl,
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
          height: '550px', 
          overflow: 'auto',
          position: 'relative',
        }}>
          {/* 固定ヘッダー */}
          <div style={{
            position: 'sticky',
            top: 0,
            backgroundColor: colors.background.white,
            padding: `${spacing.md} 0`,
            marginBottom: spacing.md,
            borderBottom: `1px solid ${colors.border.light}`,
            zIndex: 10,
          }}>

            
            {/* 週の切り替えナビゲーション */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}>
              <button
                onClick={goToPreviousWeek}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.primary,
                  fontSize: fontSize.large,
                  cursor: 'pointer',
                  padding: spacing.xs,
                  borderRadius: borderRadius.small,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                ‹ 前週
              </button>
              
              <span style={{
                backgroundColor: colors.primary,
                color: colors.background.white,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: borderRadius.small,
                textAlign: 'center',
                fontSize: fontSize.large,
                fontWeight: 'bold',
              }}>
                {getCurrentWeekRange()}
              </span>
              
              <button
                onClick={goToNextWeek}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text.primary,
                  fontSize: fontSize.large,
                  cursor: 'pointer',
                  padding: spacing.xs,
                  borderRadius: borderRadius.small,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                次週 ›
              </button>
            </div>
          </div>
          
          {/* 日付ごとの記録をフレーム分けして表示 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
          }}>
            {getWeeklyData().map((report, index) => (
              <div
                key={index}
                style={{
                  border: `2px solid ${report.emotion_card?.color || '#cccccc'}`,
                  borderRadius: borderRadius.medium,
                  padding: spacing.md,
                  backgroundColor: colors.background.white,
                  position: 'relative',
                }}
              >
                {/* 日付ヘッダー */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.sm,
                }}>
                  <span style={{
                    fontSize: fontSize.large, // baseからlargeに変更
                    fontWeight: 'bold',
                    color: colors.text.primary,
                  }}>
                    {formatDate(report.date)}
                  </span>
                  
                  {/* 感情カード画像 */}
                  {report.emotion_card && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                    }}>
                      <img
                        src={report.emotion_card.image_url}
                        alt={report.emotion_card.label}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: borderRadius.small,
                        }}
                      />
                      <span style={{
                        fontSize: fontSize.base, 
                        color: colors.text.secondary,
                      }}>
                        {report.emotion_card.label}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* 記録内容 */}
                <div style={{
                  fontSize: fontSize.large, 
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  marginBottom: spacing.sm,
                }}>
                  {report.content}
                </div>
                
                {/* 強度の表示（絵文字なし） */}
                {report.intensity_id && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}>
                    <span style={{
                      fontSize: fontSize.base, // smallからbaseに変更
                      color: colors.text.secondary,
                      backgroundColor: colors.background.light,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.small,
                    }}>
                      強度: {report.intensity_id}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 週間まとめエリア */}
        <div style={{
          borderRadius: borderRadius.medium,
          padding: spacing.md,
          backgroundColor: colors.background.light,
          marginTop: spacing.md,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: fontSize.large,
            color: colors.text.primary,
            fontWeight: 'bold',
            lineHeight: 1.6,
          }}>
            {generateWeeklyMessage()}
          </div>
        </div>
      </div>
    </div>
  );
}
