import {
  API_ENDPOINTS,
  INTENSITY_LEVELS,
  SWIPE_THRESHOLD,
} from '@/constants/emotion';
import { useAuth } from '@/contexts/AuthContext';
import {
  CardTransform,
  Child,
  DragStart,
  Emotion,
  EmotionIntensity,
} from '@/types/emotion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export const useEmotionConfirmation = () => {
  const { user, firebaseUser } = useAuth();
  const searchParams = useSearchParams();

  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [selectedIntensity, setSelectedIntensity] =
    useState<EmotionIntensity | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // スワイプ関連の状態
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null,
  );
  const [cardTransform, setCardTransform] = useState<CardTransform>({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<DragStart>({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // データ取得処理
  useEffect(() => {
    const emotionId = searchParams.get('emotion');
    const intensityLevel = searchParams.get('intensity');

    if (!emotionId || !intensityLevel) {
      setError('感情または強度が選択されていません');
      return;
    }

    const fetchEmotionData = async () => {
      setIsLoadingData(true);
      setError(null);

      try {
        const [emotionResponse, intensityResponse, childrenResponse] =
          await Promise.all([
            fetch(API_ENDPOINTS.EMOTION_CARDS),
            fetch(API_ENDPOINTS.EMOTION_INTENSITIES),
            fetch(API_ENDPOINTS.EMOTION_CHILDREN, {
              headers: {
                Authorization: `Bearer ${await firebaseUser?.getIdToken()}`,
              },
            }),
          ]);

        if (
          !emotionResponse.ok ||
          !intensityResponse.ok ||
          !childrenResponse.ok
        ) {
          throw new Error('データの取得に失敗しました');
        }

        const emotionData = await emotionResponse.json();
        const intensityData = await intensityResponse.json();
        const childrenData = await childrenResponse.json();

        if (
          emotionData.success &&
          intensityData.success &&
          childrenData.success
        ) {
          setChildren(childrenData.children);

          // 子供が1人しかいない場合は自動選択
          if (childrenData.children.length === 1) {
            setSelectedChild(childrenData.children[0]);
          } else if (childrenData.children.length === 0) {
            setError(
              '子供の登録がありません。設定画面で子供を登録してください。',
            );
            return;
          }

          // 選択された感情を取得
          const emotion = emotionData.cards.find(
            (e: Emotion) => e.id === emotionId,
          );

          if (emotion) {
            setSelectedEmotion(emotion);

            const intensity = INTENSITY_LEVELS.find(
              (level) => level.level === intensityLevel,
            );

            if (intensity) {
              const intensityDataItem = intensityData.intensities.find(
                (i: any) => i.id === intensity.id,
              );

              const selectedIntensityData = {
                id: intensity.id,
                level: intensity.level as 'low' | 'medium' | 'high',
                label: emotion.label,
                description: intensity.description
                  ? `${intensity.description}${emotion.label}`
                  : emotion.label,
                colorModifier: intensityDataItem
                  ? intensityDataItem.color_modifier
                  : 1.0,
              };

              setSelectedIntensity(selectedIntensityData);
            }
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
        setIsLoadingData(false);
      }
    };

    fetchEmotionData();
  }, [searchParams, user]);

  // スワイプイベントハンドラー
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setCardTransform({ x: 0, y: 0, rotation: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const rotation = deltaX * 0.1;

    setCardTransform({
      x: deltaX,
      y: deltaY,
      rotation: rotation,
    });
  };

  const handleTouchEnd = (
    onSwipeRight: () => void,
    onSwipeLeft: () => void,
  ) => {
    if (!isDragging) return;

    setIsDragging(false);

    if (Math.abs(cardTransform.x) > SWIPE_THRESHOLD) {
      if (cardTransform.x > 0) {
        setSwipeDirection('right');
        onSwipeRight();
      } else {
        setSwipeDirection('left');
        onSwipeLeft();
      }
    } else {
      setCardTransform({ x: 0, y: 0, rotation: 0 });
    }
  };

  // 感情記録保存
  const saveEmotionLog = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.EMOTION_LOGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await firebaseUser?.getIdToken()}`,
        },
        body: JSON.stringify({
          child_id: selectedChild?.id || '00000000-0000-0000-0000-000000000000',
          emotion_card_id: selectedEmotion?.id,
          intensity_id: selectedIntensity?.id,
          voice_note: null,
          text_file_path: null,
          audio_file_path: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(
          '感情記録の保存に失敗しました:',
          response.status,
          errorData,
        );
      }
    } catch (error) {
      console.error('感情記録保存エラー:', error);
    }
  };

  return {
    selectedEmotion,
    selectedIntensity,
    children,
    selectedChild,
    isLoadingData,
    error,
    swipeDirection,
    cardTransform,
    isDragging,
    cardRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    saveEmotionLog,
  };
};
