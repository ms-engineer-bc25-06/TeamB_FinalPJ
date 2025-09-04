'use client';

import { AudioPlayer, KokoronDefault, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles } from '@/styles/theme';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

// 感情データの型定義
interface Emotion {
  id: string;
  label: string;
  color: string;
  image_url: string;
}

// 感情強度の型定義
interface EmotionIntensity {
  id: number;
  level: 'low' | 'medium' | 'high';
  label: string;
  description: string;
  colorModifier: number;
}

// 子供の型定義
interface Child {
  id: string;
  nickname: string;
  birth_date: string;
  gender: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// 感情名を英語のファイル名にマッピング
const EMOTION_NAME_TO_FILENAME: Record<string, string> = {
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

function EmotionConfirmationContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [selectedIntensity, setSelectedIntensity] =
    useState<EmotionIntensity | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null,
  );

  // スワイプアニメーション用のref
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTransform, setCardTransform] = useState({
    x: 0,
    y: 0,
    rotation: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // URLパラメータから感情IDと強度を取得し、データを設定
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
        // 感情カード、強度データ、子供データを並行して取得
        const [emotionResponse, intensityResponse, childrenResponse] =
          await Promise.all([
            fetch('http://localhost:8000/emotion/cards'),
            fetch('http://localhost:8000/emotion/intensities'),
            fetch(`http://localhost:8000/emotion/children/${user?.uid}`),
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
          console.log('🎯 感情確認: 感情データ取得成功');
          console.log('🎯 感情確認: 強度データ取得成功');
          console.log('🎯 感情確認: 子供データ取得成功');

          // 子供データを設定
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
            console.log('🎯 感情確認: 選択された感情:', emotion);
            setSelectedEmotion(emotion);

            // 強度データと感情ラベルを組み合わせて感情強度リストを作成
            const intensityLevels = [
              { id: 3, level: 'high', description: 'とても' },
              { id: 2, level: 'medium', description: '' },
              { id: 1, level: 'low', description: '少し' },
            ];

            const intensity = intensityLevels.find(
              (level) => level.level === intensityLevel,
            );
            console.log(
              '🎯 感情確認: 強度レベル検索結果:',
              intensityLevel,
              intensity,
            );

            if (intensity) {
              const intensityDataItem = intensityData.intensities.find(
                (i: any) => i.id === intensity.id,
              );
              console.log(
                '🎯 感情確認: 強度データ検索結果:',
                intensity.id,
                intensityDataItem,
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

              console.log(
                '🎯 感情確認: 設定する強度データ:',
                selectedIntensityData,
              );
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

  // HEXカラーをRGBAに変換する関数
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // タッチ/マウスイベントの処理
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

    // スワイプの方向に応じて回転を計算
    const rotation = deltaX * 0.1;

    setCardTransform({
      x: deltaX,
      y: deltaY,
      rotation: rotation,
    });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    setIsDragging(false);

    // スワイプの距離が十分な場合、スワイプ処理を実行
    if (Math.abs(cardTransform.x) > 100) {
      if (cardTransform.x > 0) {
        // 右スワイプ（はい）
        handleSwipeRight();
      } else {
        // 左スワイプ（いいえ）
        handleSwipeLeft();
      }
    } else {
      // スワイプが不十分な場合、元の位置に戻す
      setCardTransform({ x: 0, y: 0, rotation: 0 });
    }
  };

  // 右スワイプ（はい）の処理
  const handleSwipeRight = () => {
    setSwipeDirection('right');

    // 感情記録を保存
    const saveEmotionLog = async () => {
      console.log('🎯 感情確認: 感情ログ保存開始');
      console.log('🎯 感情確認: 保存するデータ:', {
        user_id: user?.uid || '00000000-0000-0000-0000-000000000000',
        child_id: selectedChild?.id || '00000000-0000-0000-0000-000000000000', // 実際の子供ID
        emotion_card_id: selectedEmotion?.id,
        intensity_id: selectedIntensity?.id,
        voice_note: null,
        text_file_path: null,
        audio_file_path: null,
      });

      try {
        // 既存の感情記録保存APIを使用
        console.log('🎯 感情確認: APIリクエスト送信中...');
        const response = await fetch('http://localhost:8000/emotion/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user?.uid || '00000000-0000-0000-0000-000000000000', // 仮のユーザーID
            child_id:
              selectedChild?.id || '00000000-0000-0000-0000-000000000000', // 実際の子供ID
            emotion_card_id: selectedEmotion?.id,
            intensity_id: selectedIntensity?.id,
            voice_note: null, // 使用しないかも
            text_file_path: null, // 後で追加
            audio_file_path: null, // 後で追加
          }),
        });

        console.log(
          '🎯 感情確認: APIレスポンス受信:',
          response.status,
          response.statusText,
        );

        if (response.ok) {
          const responseData = await response.json();
          console.log('🎯 感情確認: 感情記録が保存されました:', responseData);
        } else {
          const errorData = await response.text();
          console.error(
            '🎯 感情確認: 感情記録の保存に失敗しました:',
            response.status,
            errorData,
          );
        }
      } catch (error) {
        console.error('🎯 感情確認: 感情記録保存エラー:', error);
      }
    };

    // 感情記録を保存
    saveEmotionLog();

    // 1秒後に次の画面に遷移
    setTimeout(() => {
      // 音声録音画面に遷移（完了後の遷移先を指定）
      router.push(
        `/app/voice?emotion=${selectedEmotion?.id}&intensity=${selectedIntensity?.level}&child=${selectedChild?.id}&redirect=/app/voice/complete`,
      );
    }, 1000);
  };

  // 左スワイプ（いいえ）の処理
  const handleSwipeLeft = () => {
    setSwipeDirection('left');
    // 感情選択画面に戻る
    setTimeout(() => {
      router.push('/app/emotion-selection');
    }, 1000);
  };

  // ガイドを非表示にする
  const hideGuide = () => {
    setShowGuide(false);
  };

  // 戻るボタンの処理
  const handleBack = () => {
    // 選択されていた感情IDを渡して感情強度選択画面に戻る
    if (selectedEmotion) {
      router.push(`/app/emotion-intensity?emotion=${selectedEmotion.id}`);
    } else {
      // 感情が選択されていない場合は感情選択画面に戻る
      router.push('/app/emotion-selection');
    }
  };

  // ローディング中（認証）
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合
  if (!user) {
    router.push('/');
    return null;
  }

  // データ読み込み中
  if (isLoadingData) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>感情データを読み込み中...</p>
      </div>
    );
  }

  // エラーがある場合
  if (error) {
    return (
      <div style={commonStyles.page.container}>
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '20px',
            zIndex: 150,
          }}
        >
          <div
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              color: '#d32f2f',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            {error}
          </div>
          <button
            onClick={handleBack}
            style={{
              background: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            感情強度選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // 感情が選択されていない場合
  if (!selectedEmotion || !selectedIntensity) {
    return (
      <div style={commonStyles.page.container}>
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '20px',
            zIndex: 150,
          }}
        >
          <div
            style={{
              background: 'rgba(255, 0, 0, 0.1)',
              color: '#d32f2f',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '16px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            感情データが見つかりません
          </div>
          <button
            onClick={handleBack}
            style={{
              background: '#007AFF',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '16px',
            }}
          >
            感情強度選択に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      {/* こころんによる感情確認の問いかけ音声再生 */}
      <AudioPlayer
        src="/sounds/characterConfirmFeeling03.mp3"
        autoPlay={true}
        volume={0.8}
        onEnded={() => console.log('感情確認音声再生完了')}
        onError={(error) => console.log('音声エラー:', error)}
      />

      {/* 左上の戻るボタン */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          color: '#000000',
          zIndex: 200,
          fontWeight: 'bold',
        }}
      >
        ← もどる
      </button>

      {/* こころんと吹き出し*/}
      <div
        style={{
          position: 'fixed',
          top: '100px',
          right: '2px',
          zIndex: 250,
        }}
      >
        <KokoronDefault size={100} />
      </div>

      {/* 感情の説明文（白い四角） */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          width: '80%',
          maxWidth: '320px',
          boxSizing: 'border-box',
          textAlign: 'center',
          alignSelf: 'center',
          margin: '0 auto',
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 150,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '24px',
              lineHeight: 1.2,
              margin: 0,
              color: '#333',
            }}
          >
            こんなきもちなんだね？
          </span>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          padding: '10px 0 0 0',
          zIndex: 50,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '600px',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(10px)',
          background: 'transparent',
          gap: '8px',
        }}
      >
        {/* スワイプガイド - 矢印をカードに重ねて表示 */}
        {showGuide && (
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '600px',
            }}
          >
            {/* 感情カード（スワイプ可能） */}
            <div
              ref={cardRef}
              style={{
                background: '#ffffff',
                border: `8px solid ${hexToRgba(selectedEmotion.color, selectedIntensity.colorModifier)}`,
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                width: '280px',
                height: '360px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                cursor: 'grab',
                touchAction: 'none',
                transform: `translate(${cardTransform.x}px, ${cardTransform.y}px) rotate(${cardTransform.rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease',
                position: 'relative',
                zIndex: 100,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
              {/* 感情画像 */}
              <Image
                src={(() => {
                  const baseName =
                    EMOTION_NAME_TO_FILENAME[selectedEmotion.label] ||
                    'ureshii';
                  let fileName = baseName;

                  if (selectedIntensity.level === 'low') {
                    fileName = `${baseName}1`;
                  } else if (selectedIntensity.level === 'high') {
                    fileName = `${baseName}3`;
                  }

                  return `/images/emotions/${fileName}.webp`;
                })()}
                alt={`こころん - ${selectedIntensity.description}`}
                width={160}
                height={160}
                style={{
                  objectFit: 'contain',
                  width: '200px',
                  height: '200px',
                }}
                onError={(e) => {
                  try {
                    (e.currentTarget as HTMLImageElement).src =
                      '/images/kokoron/kokoron_greeting.webp';
                  } catch (_) {
                    // no-op
                  }
                }}
              />

              {/* 感情ラベル */}
              <span
                style={{
                  fontSize: '24px',
                  lineHeight: '1.2',
                  fontWeight: '600',
                  color: '#000000',
                  textAlign: 'center',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  minHeight: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedEmotion.label}
              </span>

              {/* スワイプ方向インジケーター */}
              {swipeDirection && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: swipeDirection === 'right' ? '20px' : 'auto',
                    right: swipeDirection === 'left' ? '20px' : 'auto',
                    transform: 'translateY(-50%)',
                    background:
                      swipeDirection === 'right' ? '#4CAF50' : '#F44336',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    zIndex: 200,
                  }}
                >
                  {swipeDirection === 'right' ? 'はい！' : 'いいえ'}
                </div>
              )}

              {/* 左スワイプ（いいえ）の赤い矢印 - カードの左側に重ねて表示 */}
              <div
                style={{
                  position: 'absolute',
                  left: '-50px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 150,
                  animation: 'slideLeft 2s ease-in-out infinite',
                }}
              >
                <div
                  style={{
                    width: '0',
                    height: '0',
                    borderTop: '20px solid transparent',
                    borderBottom: '20px solid transparent',
                    borderRight: '60px solid #F44336',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                  }}
                />
              </div>

              {/* 右スワイプ（はい）の緑の矢印 - カードの右側に重ねて表示 */}
              <div
                style={{
                  position: 'absolute',
                  right: '-50px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 150,
                  animation: 'slideRight 2s ease-in-out infinite',
                }}
              >
                <div
                  style={{
                    width: '0',
                    height: '0',
                    borderTop: '20px solid transparent',
                    borderBottom: '20px solid transparent',
                    borderLeft: '60px solid #4CAF50',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* スワイプ完了後のメッセージ */}
        {swipeDirection && (
          <div
            style={{
              background:
                swipeDirection === 'right'
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(244, 67, 54, 0.1)',
              color: swipeDirection === 'right' ? '#2E7D32' : '#C62828',
              padding: '16px 24px',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '400px',
              animation: 'fadeIn 0.5s ease-in',
            }}
          >
            {swipeDirection === 'right'
              ? 'OK！つぎにすすむよ〜'
              : 'もういちど　きもちを　えらぼうね'}
          </div>
        )}
      </div>

      {/* CSS アニメーション */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideRight {
          0% {
            transform: translateX(-20px);
            opacity: 0;
          }
          50% {
            transform: translateX(10px);
            opacity: 1;
          }
          100% {
            transform: translateX(-20px);
            opacity: 0;
          }
        }

        @keyframes slideLeft {
          0% {
            transform: translateX(20px);
            opacity: 0;
          }
          50% {
            transform: translateX(-10px);
            opacity: 1;
          }
          100% {
            transform: translateX(20px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function EmotionConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmotionConfirmationContent />
    </Suspense>
  );
}
