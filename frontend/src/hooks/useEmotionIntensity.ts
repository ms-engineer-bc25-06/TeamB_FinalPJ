import { API_ENDPOINTS, INTENSITY_LEVELS } from '@/constants/emotion';
import { Emotion, EmotionIntensity } from '@/types/emotion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// 強度データの型定義（APIレスポンス用）
interface Intensity {
  id: number;
  color_modifier: number;
}

export const useEmotionIntensity = () => {
  const searchParams = useSearchParams();
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [intensities, setIntensities] = useState<EmotionIntensity[]>([]);
  const [isLoadingEmotion, setIsLoadingEmotion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データ取得処理
  useEffect(() => {
    const emotionId = searchParams.get('emotion');
    if (!emotionId) {
      setError('感情が選択されていません');
      return;
    }

    const fetchEmotionData = async () => {
      setIsLoadingEmotion(true);
      setError(null);

      try {
        // 感情カードと強度データを並行して取得
        const [emotionResponse, intensityResponse] = await Promise.all([
          fetch(API_ENDPOINTS.EMOTION_CARDS),
          fetch(API_ENDPOINTS.EMOTION_INTENSITIES),
        ]);

        if (!emotionResponse.ok || !intensityResponse.ok) {
          throw new Error('データの取得に失敗しました');
        }

        const emotionData = await emotionResponse.json();
        const intensityData = await intensityResponse.json();

        if (emotionData.success && intensityData.success) {
          console.log('🎯 強度選択: 感情データ取得成功');
          console.log('🎯 強度選択: 強度データ取得成功');

          // 選択された感情を取得
          const emotion = emotionData.cards.find(
            (e: Emotion) => e.id === emotionId,
          );
          if (emotion) {
            // デバッグ用: 感情データの内容をログ出力
            console.log('🎯 強度選択: 選択された感情データ:', emotion);
            console.log('🎯 強度選択: 感情の画像URL:', emotion.image_url);

            setSelectedEmotion(emotion);

            // 強度データと感情ラベルを組み合わせて感情強度リストを作成
            const emotionIntensities: EmotionIntensity[] = INTENSITY_LEVELS.map(
              (level) => {
                const intensity = intensityData.intensities.find(
                  (i: Intensity) => i.id === level.id,
                );
                return {
                  id: level.id,
                  level: level.level as 'low' | 'medium' | 'high',
                  label: emotion.label,
                  description: level.description
                    ? `${level.description}${emotion.label}`
                    : emotion.label,
                  colorModifier: intensity ? intensity.color_modifier : 1.0,
                };
              },
            );

            setIntensities(emotionIntensities);
          } else {
            throw new Error('選択された感情が見つかりません');
          }
        } else {
          throw new Error('データの形式が正しくありません');
        }
      } catch (err) {
        console.error('データの取得エラー:', err);
        setError('データの読み込みに失敗しました');
      } finally {
        setIsLoadingEmotion(false);
      }
    };

    fetchEmotionData();
  }, [searchParams]);

  return {
    selectedEmotion,
    intensities,
    isLoadingEmotion,
    error,
  };
};
