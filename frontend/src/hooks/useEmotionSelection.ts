import { API_ENDPOINTS, DEFAULT_EMOTIONS } from '@/constants/emotion';
import { Emotion } from '@/types/emotion';
import { useEffect, useState } from 'react';

export const useEmotionSelection = () => {
  const [emotions, setEmotions] = useState<Emotion[]>(DEFAULT_EMOTIONS);
  const [isLoadingEmotions, setIsLoadingEmotions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 感情データをDBから取得
  useEffect(() => {
    const fetchEmotions = async () => {
      setIsLoadingEmotions(true);
      setError(null);

      try {
        // バックエンドAPIから感情データを取得
        const response = await fetch(API_ENDPOINTS.EMOTION_CARDS);
        if (!response.ok) {
          throw new Error('感情データの取得に失敗しました');
        }
        const data = await response.json();

        if (data.success && data.cards) {
          console.log('取得された感情データ:', data.cards);
          console.log(
            '「わからない」の感情データ:',
            data.cards.find((e: Emotion) => e.label === 'わからない'),
          );
          setEmotions(data.cards);
        } else {
          throw new Error('感情データの形式が正しくありません');
        }
      } catch (err) {
        console.error('感情データの取得エラー:', err);
        setError('感情データの読み込みに失敗しました');
        // エラー時はデフォルトデータを使用
        setEmotions(DEFAULT_EMOTIONS);
      } finally {
        setIsLoadingEmotions(false);
      }
    };

    fetchEmotions();
  }, []);

  return {
    emotions,
    isLoadingEmotions,
    error,
  };
};
