'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { KokoronDefault, Spinner } from '@/components/ui';
import { commonStyles } from '@/styles/theme';
import { useState, useEffect } from 'react';

// 感情強度の型定義
interface EmotionIntensity {
  id: number;
  level: 'low' | 'medium' | 'high';
  label: string;
  description: string;
  colorModifier: number;
}

// 感情データの型定義
interface Emotion {
  id: string;
  label: string;
  color: string;
  image_url: string;
}

// 強度データの型定義
interface Intensity {
  id: number;
  color_modifier: number;
}

// 強度レベルの定義（DBの強度IDとマッピング）
// 上の方が強く、下の方が小さい順序
const INTENSITY_LEVELS = [
  { id: 3, level: 'high', description: 'とても' },
  { id: 2, level: 'medium', description: '' },
  { id: 1, level: 'low', description: '少し' }
];

// 感情名を英語のファイル名にマッピング
const EMOTION_NAME_TO_FILENAME: Record<string, string> = {
  'うれしい': 'ureshii',
  'ゆかい': 'yukai',
  'あんしん': 'anshin',
  'びっくり': 'bikkuri',
  'こわい': 'kowai',
  'かなしい': 'kanashii',
  'こまった': 'komatta',
  'ふゆかい': 'fuyukai',
  'いかり': 'ikari',
  'はずかしい': 'hazukashii',
  'きんちょう': 'kinchou',
  'わからない': 'wakaranai'
};

export default function EmotionIntensityPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [intensities, setIntensities] = useState<EmotionIntensity[]>([]);
  const [isLoadingEmotion, setIsLoadingEmotion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URLパラメータから感情IDを取得し、感情データと強度データを設定
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
          fetch('http://localhost:8000/emotion/cards'),
          fetch('http://localhost:8000/emotion/intensities')
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
          const emotion = emotionData.cards.find((e: Emotion) => e.id === emotionId);
          if (emotion) {
            // デバッグ用: 感情データの内容をログ出力
            console.log('🎯 強度選択: 選択された感情データ:', emotion);
            console.log('🎯 強度選択: 感情の画像URL:', emotion.image_url);
            
            setSelectedEmotion(emotion);
            
            // 強度データと感情ラベルを組み合わせて感情強度リストを作成
            const emotionIntensities: EmotionIntensity[] = INTENSITY_LEVELS.map(level => {
              const intensity = intensityData.intensities.find((i: Intensity) => i.id === level.id);
              return {
                id: level.id,
                level: level.level as 'low' | 'medium' | 'high',
                label: emotion.label,
                description: level.description ? `${level.description}${emotion.label}` : emotion.label,
                colorModifier: intensity ? intensity.color_modifier : 1.0
              };
            });
            
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

  // HEXカラーをRGBAに変換する関数
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 感情強度を選択した時の処理
  const handleIntensitySelect = (intensity: EmotionIntensity) => {
    console.log('🎯 強度選択: 選択された強度:', intensity);
    console.log('🎯 強度選択: 選択された感情:', selectedEmotion);
    
    // 感情確認画面に遷移（感情IDと強度レベルを含める）
    const nextUrl = `/app/emotion-confirmation?emotion=${selectedEmotion?.id}&intensity=${intensity.level}`;
    console.log('🎯 強度選択: 感情確認画面に遷移:', nextUrl);
    router.push(nextUrl);
  };

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/app/emotion-selection');
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

  // 感情データ読み込み中
  if (isLoadingEmotion) {
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <button onClick={handleBack} style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#333',
            }}>
              ← もどる
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}>
              エラー
            </h1>
            <div style={{ width: '50px' }}></div>
          </div>
        </div>
        
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          padding: '20px',
          zIndex: 50,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            color: '#d32f2f',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            {error}
          </div>
          <button onClick={handleBack} style={{
            background: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}>
            感情選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // 感情が選択されていない場合
  if (!selectedEmotion || intensities.length === 0) {
    return (
      <div style={commonStyles.page.container}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <button onClick={handleBack} style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#333',
            }}>
              ← もどる
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
            }}>
              感情強度選択
            </h1>
            <div style={{ width: '50px' }}></div>
          </div>
        </div>
        
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          padding: '20px',
          zIndex: 50,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
        }}>
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            color: '#d32f2f',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '16px',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            感情データが見つかりません
          </div>
          <button onClick={handleBack} style={{
            background: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}>
            感情選択に戻る
          </button>
        </div>
      </div>
    );
  }

    return (
    <div style={commonStyles.page.container}>
      {/* 左上の戻るボタン */}
      <button onClick={handleBack} style={{
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
      }}>
        ← もどる
      </button>

      {/* デフォルトのこころん（右側に配置） */}
      <div style={{
        position: 'fixed',
        top: '100px',
        right: '2px',
        zIndex: 250,
      }}>
        <KokoronDefault size={80} />
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 0, 0, 0.1)',
          color: '#d32f2f',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 150,
        }}>
          {error}
        </div>
      )}

      {/* メインコンテンツ */}
      <div style={{
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
      }}>
        {/* 感情の説明文（白い四角） */}
        {selectedEmotion && (
          <div style={{
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
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center',
            }}>
              <span style={{
                fontWeight: 'bold',
                fontSize: '24px',
                lineHeight: 1.2,
                margin: 0,
                color: '#333',
              }}>
                {selectedEmotion.label}
              </span>
              <span style={{
                fontWeight: '600',
                fontSize: '16px',
                lineHeight: 1.4,
                margin: 0,
                color: '#666',
              }}>
                このきもち　どのくらいかな？
              </span>
            </div>
          </div>
        )}

        {/* 感情強度選択ボタン */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '19px',
          width: '100%',
          maxWidth: '320px',
          boxSizing: 'border-box',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {intensities.map((intensity, index) => (
            <button
              key={intensity.id}
              onClick={() => handleIntensitySelect(intensity)}
              style={{
                background: '#ffffff', // カード自体は白
                border: `8px solid ${hexToRgba(selectedEmotion.color, intensity.colorModifier)}`,
                borderRadius: '12px',
                padding: '16px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#000000',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minHeight: '100px',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                gap: '12px',
              }}>
                <Image
                  src={(() => {
                    // 感情の強度レベルに応じて画像ファイル名を生成
                    const baseName = EMOTION_NAME_TO_FILENAME[selectedEmotion.label] || 'ureshii';
                    let fileName = baseName;
                    
                    if (intensity.level === 'low') {
                      fileName = `${baseName}1`; // 弱い強度 → 1
                    } else if (intensity.level === 'high') {
                      fileName = `${baseName}3`; // 強い強度 → 3
                    }
                    // 中程度の強度は無印（baseName）
                    
                    return `/images/emotions/${fileName}.webp`;
                  })()}
                  alt={`こころん - ${intensity.description}`}
                  width={120}
                  height={120}
                  style={{
                    objectFit: 'contain',
                    width: '120px',
                    height: '120px',
                  }}
                  onError={(e) => {
                    // 画像の読み込みに失敗した場合はデフォルト画像にフォールバック
                    console.log(`画像読み込みエラー: ${selectedEmotion.image_url} -> デフォルト画像にフォールバック`);
                    try {
                      (e.currentTarget as HTMLImageElement).src = '/images/kokoron/kokoron_greeting.webp';
                    } catch (_) {
                      // no-op
                    }
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
