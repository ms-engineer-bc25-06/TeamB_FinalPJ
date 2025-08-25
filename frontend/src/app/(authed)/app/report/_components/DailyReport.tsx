'use client';

import { useState, useEffect } from 'react';
import { colors, spacing, borderRadius, fontSize } from '@/styles/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getEmotionLogsByMonth, getEmotionCards, getIntensities } from '@/lib/api';

interface DailyReportProps {
  onClose: () => void;
}

interface EmotionLogData {
  id: string;
  date: string;
  content: string;
  mood: string;
  audio_file_path?: string;
  emotion_card?: {
    label: string;
    color: string;
    image_url: string;
  };
  intensity_id?: number;
}

interface EmotionCard {
  id: string;
  label: string;
  image_url: string;
  color: string;
}

interface Intensity {
  id: number;
  color_modifier: number;
}

export default function DailyReport({ onClose }: DailyReportProps) {
  const { firebaseUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('2025-08-18');
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 7, 12));
  const [emotionLogs, setEmotionLogs] = useState<EmotionLogData[]>([]);
  const [emotionCards, setEmotionCards] = useState<EmotionCard[]>([]);
  const [intensities, setIntensities] = useState<Intensity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // ファイル名マッピング
  const EMOTION_NAME_TO_FILENAME: { [key: string]: string } = {
    'うれしい': 'ureshii',
    'かなしい': 'kanashii',
    'こわい': 'kowai',
    'おこり': 'ikari',
    'びっくり': 'bikkuri',
    'しんぱい': 'kinchou',
    'はずかしい': 'hazukashii',
    'こまった': 'komatta',
    'わからない': 'wakaranai',
    'あんしん': 'anshin',
    'きんちょう': 'kinchou',
    'ふゆかい': 'fuyukai',
    'ゆかい': 'yukai'
  };

  // 感情ログデータ、感情カード、強度データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return;
      
      try {
        setIsLoading(true);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
        const [logs, cardsData, intensitiesData] = await Promise.all([
          getEmotionLogsByMonth(firebaseUser, year, month),
          getEmotionCards(firebaseUser),
          getIntensities(firebaseUser)
        ]);
        
        setEmotionCards(cardsData.cards || []);
        setIntensities(intensitiesData.intensities || []);
        
        // 感情ログデータを変換
        const transformedLogs: EmotionLogData[] = logs.map((log: {
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
          audio_file_path: log.audio_file_path,
          emotion_card: log.emotion_card,
          intensity_id: log.intensity_id
        }));
        
        setEmotionLogs(transformedLogs);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setEmotionLogs([]);
        setEmotionCards([]);
        setIntensities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [firebaseUser, currentMonth]);

  // 感情カードの画像URLを取得
  const getEmotionImageUrl = (emotionCard?: { image_url: string }): string => {
    if (!emotionCard?.image_url) return '';
    return emotionCard.image_url;
  };

  // 強度に応じた感情画像URLを生成
  const getIntensityBasedImageUrl = (emotionCard?: { label: string }, intensityId?: number): string => {
    if (!emotionCard?.label) return '';
    
    const baseName = EMOTION_NAME_TO_FILENAME[emotionCard.label] || 'ureshii';
    let fileName = baseName;
    
    // 強度に応じてファイル名を変更
    if (intensityId === 1) {
      fileName = `${baseName}1`; 
    } else if (intensityId === 3) {
      fileName = `${baseName}3`; 
    }
    
    return `/images/emotions/${fileName}.webp`;
  };

  // 感情と強度を組み合わせた画像表示
  const renderEmotionWithIntensity = (emotionCard?: { image_url: string; label: string }, intensityId?: number) => {
    if (!emotionCard?.label) return null;
    
    // 強度に応じた画像URLを生成
    const intensityImageUrl = getIntensityBasedImageUrl(emotionCard, intensityId);
    
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: colors.background.white,
          borderRadius: borderRadius.small,
          overflow: 'hidden',
        }}
      >
        <img
          src={intensityImageUrl}
          alt={`${emotionCard.label}の感情カード（強度${intensityId}）`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: borderRadius.small,
            backgroundColor: colors.background.white,
          }}
          onError={(e) => {
            try {
              // エラー時は元の画像URLを使用
              (e.currentTarget as HTMLImageElement).src = emotionCard.image_url;
            } catch (_) {
              // no-op
            }
          }}
        />
      </div>
    );
  };

  // 感情ラベルから絵文字を取得（フォールバック用）
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
  const selectedReport = emotionLogs.find(
    (report) => report.date === selectedDate,
  );

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const hasReport = (date: Date) => {
    const dateStr = formatDate(date);
    return emotionLogs.some((report) => report.date === dateStr);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    const firstDay = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    setSelectedDate(formatDate(firstDay));
  };

  // 日付をクリックした時の処理
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // 音声再生・停止の処理
  const handleAudioPlay = (audioPath: string) => {
    if (isPlaying && audio) {
      // 現在再生中の場合は停止
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
      setAudio(null);
    } else {
      // 新しい音声を再生
      const newAudio = new Audio(audioPath);
      newAudio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudio(null);
      });
      newAudio.addEventListener('error', () => {
        console.error('音声ファイルの再生に失敗しました');
        setIsPlaying(false);
        setAudio(null);
      });
      
      newAudio.play();
      setIsPlaying(true);
      setAudio(newAudio);
    }
  };

  // 選択された日付の枠線色を生成
  const getEmotionBorderColor = (emotionCard?: { label: string; color: string }, intensityId?: number): string => {
    if (!emotionCard?.color) return '#cccccc';
    
    // 強度IDからcolor_modifierを取得
    const intensity = intensities.find(i => i.id === intensityId);
    const colorModifier = intensity?.color_modifier || 1.0;
    
    // HEXカラーをRGBAに変換（colorModifierを透明度として使用）
    const hexToRgba = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return hexToRgba(emotionCard.color, colorModifier);
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
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          border: `3px solid #cccccc`,
          width: '500px',
          height: '800px', 
        }}
      >
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
        <div
          style={{
            textAlign: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <h2
            style={{
              color: colors.secondary,
              fontSize: fontSize.large,
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            まいにちのきろく
          </h2>
        </div>

        {/* 選択された日付の表示 */}
        <div
          style={{
            backgroundColor: colors.primary,
            color: colors.background.white,
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: borderRadius.small,
            textAlign: 'center',
            marginBottom: spacing.md,
            fontSize: fontSize.large,
            fontWeight: 'bold',
          }}
        >
          {formatDisplayDate(selectedDate)}
        </div>

        {/* カレンダー部分 */}
        <div
          style={{
            border: `3px solid #cccccc`,
            borderRadius: borderRadius.medium,
            padding: spacing.md,
            marginBottom: spacing.lg,
            backgroundColor: colors.background.white,
            height: '450px',
          }}
        >
          {/* 月表示とナビゲーション */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <button
              onClick={() => {
                const newMonth = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() - 1,
                  1,
                );
                handleMonthChange(newMonth);
              }}
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
              onClick={() => {
                const newMonth = new Date(
                  currentMonth.getFullYear(),
                  currentMonth.getMonth() + 1,
                  1,
                );
                handleMonthChange(newMonth);
              }}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              marginBottom: spacing.sm,
            }}
          >
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: fontSize.large,
                  fontWeight: 'bold',
                  color: colors.text.secondary,
                  padding: spacing.xs,
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
            }}
          >
            {calendarDays.map((date, index) => {
              const isCurrentMonth =
                date.getMonth() === currentMonth.getMonth();
              const dateStr = formatDate(date);
              const hasReportData = hasReport(date);
              const report = emotionLogs.find((log) => log.date === dateStr);
              const emotionImageUrl = getEmotionImageUrl(report?.emotion_card);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isCurrentMonth) {
                      handleDateClick(dateStr);
                    }
                  }}
                  style={{
                    width: '40px',
                    height: '60px', 
                    borderRadius: borderRadius.small,
                    backgroundColor: colors.background.white, 
                    color: isCurrentMonth
                      ? colors.text.primary
                      : colors.text.secondary,
                    fontSize: fontSize.large,
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between', 
                    position: 'relative',
                    border: isSelected ? `2px solid ${getEmotionBorderColor(report?.emotion_card, report?.intensity_id)}` : 'none',
                    padding: '4px 0', 
                  }}
                >
                  <span style={{ marginTop: '2px' }}>{date.getDate()}</span>
                  {report && emotionImageUrl && emotionImageUrl !== '' && (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        marginBottom: '2px', 
                      }}
                    >
                      {renderEmotionWithIntensity(report.emotion_card, report.intensity_id)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* レポート表示部分 */}
        <div
          style={{
            border: `3px solid #cccccc`,
            borderRadius: borderRadius.medium,
            padding: spacing.md,
            backgroundColor: colors.background.white, 
            height: '180px', 
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {selectedReport ? (
            <div>              
              <div
                style={{
                  fontSize: fontSize.large,
                  color: colors.text.primary,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  paddingRight: '60px', // 画像のスペース
                }}
              >
                {selectedReport.content}
              </div>
              
              {/* 音声再生ボタン */}
              {selectedReport.audio_file_path && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: spacing.sm,
                    left: spacing.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                  }}
                >
                  <button
                    onClick={() => handleAudioPlay(selectedReport.audio_file_path!)}
                    style={{
                      background: isPlaying ? '#e74c3c' : colors.primary,
                      color: colors.background.white,
                      border: 'none',
                      borderRadius: borderRadius.small,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      cursor: 'pointer',
                      fontSize: fontSize.small,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isPlaying ? '⏹️ 停止' : '▶️ 音声メモを再生'}
                  </button>
                </div>
              )}
              
              {/* 感情カード画像を右下に表示 */}
              {selectedReport.emotion_card?.image_url && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: spacing.sm,
                    right: spacing.sm,
                    width: '50px',
                    height: '50px',
                    borderRadius: borderRadius.small,
                    overflow: 'hidden',
                    border: `2px solid ${getEmotionBorderColor(selectedReport.emotion_card, selectedReport.intensity_id)}`,
                    backgroundColor: colors.background.white,
                  }}
                >
                  {renderEmotionWithIntensity(selectedReport.emotion_card, selectedReport.intensity_id)}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: colors.text.secondary,
                fontSize: fontSize.large,
              }}
            >
              この日付にはレポートがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
