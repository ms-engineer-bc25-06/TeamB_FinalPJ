// TODO:レポート画面につきテストでMUIを使用して実装中。チームのデザインスタイルが決まり次第以下内容変更予定。
'use client';

import { useState } from 'react';
import { Box, Paper, Typography, Modal, Button } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { DailyReportMonthlyData, EmotionLog } from '@/types/api'; // 作成した型をインポート
import Image from 'next/image';

// --- モックデータ ---
// TODO: バックエンドAPIが完成したら、下記変更要。
const mockMonthlyData: DailyReportMonthlyData = {
  logs: {
    '2025-08-05': {
      id: 'log-1',
      child_id: 'child-1',
      created_at: '2025-08-05T10:00:00Z',
      emotion_card: {
        id: 'card-1',
        label: 'うれしい',
        image_url: 'https://placehold.co/100x100/FFC107/FFFFFF?text=😊',
        color: '#FFC107',
      },
      intensity: { id: 'int-5', color_modifier: 'strong' },
      voice_note: '今日、公園で新しい友達ができた！',
    },
    '2025-08-07': {
      id: 'log-2',
      child_id: 'child-1',
      created_at: '2025-08-07T15:30:00Z',
      emotion_card: {
        id: 'card-2',
        label: 'かなしい',
        image_url: 'https://placehold.co/100x100/2196F3/FFFFFF?text=😢',
        color: '#2196F3',
      },
      intensity: { id: 'int-2', color_modifier: 'light' },
      voice_note: 'お気に入りのおもちゃが壊れてしまった。',
    },
    '2025-08-15': {
      id: 'log-3',
      child_id: 'child-1',
      created_at: '2025-08-15T18:00:00Z',
      emotion_card: {
        id: 'card-3',
        label: 'いらいら',
        image_url: 'https://placehold.co/100x100/F44336/FFFFFF?text=😠',
        color: '#F44336',
      },
      intensity: { id: 'int-4', color_modifier: 'medium' },
    },
  },
};
// --- モックデータここまで ---

// カレンダーの日付をカスタマイズして感情ログを表示するコンポーネント
const CustomDay = (
  props: PickersDayProps<Dayjs> & { logs: { [date: string]: EmotionLog } },
) => {
  const { day, logs, ...other } = props;
  const dateStr = day.format('YYYY-MM-DD');
  const log = logs[dateStr];

  // ログがある日付に色付きのドットを表示
  const hasLog = !!log;

  return (
    <Box sx={{ position: 'relative' }}>
      <PickersDay {...other} day={day} />
      {hasLog && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: log.emotion_card.color,
          }}
        />
      )}
    </Box>
  );
};

export default function ReportPage() {
  const [selectedLog, setSelectedLog] = useState<EmotionLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateChange = (date: Dayjs | null) => {
    if (!date) return;
    const dateStr = date.format('YYYY-MM-DD');
    const log = mockMonthlyData.logs[dateStr];
    if (log) {
      setSelectedLog(log);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  return (
    <Box p={4}>
      {/* Daily Report コンポーネント */}
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Daily Report
        </Typography>
        <DateCalendar
          displayWeekNumber
          defaultValue={dayjs('2025-08-01')}
          onChange={handleDateChange}
          slots={{
            day: (dayProps: PickersDayProps<Dayjs>) => (
              <CustomDay {...dayProps} logs={mockMonthlyData.logs} />
            ),
          }}
        />
      </Paper>

      {/* Weekly Report コンポーネント（プレースホルダー） */}
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Weekly Report
        </Typography>
        <Typography>（ここに週次レポートが表示されます）</Typography>
      </Paper>

      {/* 記録詳細表示モーダル */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          {selectedLog && (
            <>
              <Typography variant="h6" component="h2">
                {dayjs(selectedLog.created_at).format('YYYY年MM月DD日')}の記録
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                <Image
                  src={selectedLog.emotion_card.image_url}
                  alt={selectedLog.emotion_card.label}
                  width={80}
                  height={80}
                  style={{ marginRight: 16 }}
                />
                <Typography variant="h5">
                  {selectedLog.emotion_card.label}
                </Typography>
              </Box>
              <Typography sx={{ mt: 2 }}>
                <strong>ボイスメモ:</strong>{' '}
                {selectedLog.voice_note || '（なし）'}
              </Typography>
              <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
                閉じる
              </Button>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
