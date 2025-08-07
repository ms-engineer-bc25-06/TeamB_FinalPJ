export type UserResponse = {
  id: string;
  uid: string;
  email: string;
  nickname: string | null;
  email_verified: boolean;
  role: string;
  created_at: string;
  updated_at: string;
};

// 感情カードのマスタデータ型
export type EmotionCard = {
  id: string;
  label: string; // "うれしい", "かなしい" など
  image_url: string;
  color: string;
};

// 感情の強度のマスタデータ型
export type Intensity = {
  id: string;
  color_modifier: string;
};

// 感情レポート1件分のデータ型。daily_reportのモーダル表示で使用
export type EmotionLog = {
  id: string;
  child_id: string;
  created_at: string;
  voice_note: string | null;
  audio_path: string | null;
  emotion_card: EmotionCard;
  intensity: Intensity;
};

// DailyReportコンポーネントのデータ型。マンスリーカレンダー表示で使用
export type DailyReportMonthlyData = {
  logs: {
    [date: string]: EmotionLog;
  };
};

// WeeklyReportコンポーネントのデータ型。
export type WeeklyReportData = {
  id: string;
  week_start_date: string;
  week_end_date: string;
  trend_summary: string;
  advice_for_child: string;
  growth_points: string;
  daily_logs_in_week: EmotionLog[];
};
