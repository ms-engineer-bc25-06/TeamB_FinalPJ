// 感情データの型定義
export interface Emotion {
  id: string;
  label: string;
  color: string;
  image_url: string;
}

// 感情強度の型定義
export interface EmotionIntensity {
  id: number;
  level: 'low' | 'medium' | 'high';
  label: string;
  description: string;
  colorModifier: number;
}

// 子供の型定義
export interface Child {
  id: string;
  nickname: string;
  birth_date: string;
  gender: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// カードの変形状態の型定義
export interface CardTransform {
  x: number;
  y: number;
  rotation: number;
}

// ドラッグ開始位置の型定義
export interface DragStart {
  x: number;
  y: number;
}
