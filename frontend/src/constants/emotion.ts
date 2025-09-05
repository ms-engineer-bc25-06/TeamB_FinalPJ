// 感情名を英語のファイル名にマッピング
export const EMOTION_NAME_TO_FILENAME: Record<string, string> = {
  うれしい: 'ureshii',
  ゆかい: 'yukai',
  あんしん: 'anshin',
  びっくり: 'bikkuri',
  こわい: 'kowai',
  かなしい: 'kanashii',
  こまった: 'komatta',
  ふゆかい: 'fuyukai',
  いかり: 'ikari',
  はずかしい: 'hazukashii',
  きんちょう: 'kinchou',
  わからない: 'wakaranai',
};

// 強度レベル定義
export const INTENSITY_LEVELS = [
  { id: 3, level: 'high', description: 'とても' },
  { id: 2, level: 'medium', description: '' },
  { id: 1, level: 'low', description: '少し' },
] as const;

// API エンドポイント
export const API_ENDPOINTS = {
  EMOTION_CARDS: 'http://localhost:8000/emotion/cards',
  EMOTION_INTENSITIES: 'http://localhost:8000/emotion/intensities',
  EMOTION_CHILDREN: (userId: string) =>
    `http://localhost:8000/emotion/children/${userId}`,
  EMOTION_LOGS: 'http://localhost:8000/emotion/logs',
} as const;

// スワイプの閾値
export const SWIPE_THRESHOLD = 100;

// アニメーション時間
export const ANIMATION_DURATION = 1000;
