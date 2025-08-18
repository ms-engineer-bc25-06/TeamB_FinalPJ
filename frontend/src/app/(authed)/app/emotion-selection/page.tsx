'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { KokoronDefault, SpeechBubble, Spinner, HamburgerMenu} from '@/components/ui';
import { commonStyles } from '@/styles/theme';
import { useState, useEffect } from 'react';


// TODO: 感情データをDBから取得する対応
// 1. 現在のハードコードされた感情データを削除
// 2. APIエンドポイント: GET /api/emotions から感情データを取得
// 3. 取得するデータ構造:
//    {
//      id: string,
//      name: string,
//      color: string,      // カラーコード（例: '#00D4AA'）
//      imageUrl: string,   // 画像パス（/assets/emotions/{感情名}-40.webp）

//    }
// 3. 画像ファイル配置: frontend/public/assets/emotions/ フォルダに各感情のWebP画像を配置
// 4. エラーハンドリング: API呼び出しに失敗した場合はデフォルトデータを使用

// 感情データの型定義（APIレスポンスに合わせて修正）
interface Emotion {
  id: string;
  label: string;
  color: string;
  image_url: string;
}

// デフォルトの感情データ（API呼び出しに失敗した場合のフォールバック）
const DEFAULT_EMOTIONS: Emotion[] = [
  // 黄色の感情
  { id: 'ureshii', label: 'うれしい', color: '#FFD700', image_url: '/images/emotions/ureshii.webp' },
  { id: 'yukai', label: 'ゆかい', color: '#FFD700', image_url: '/images/emotions/yukai.webp' },
  
  // 緑色の感情
  { id: 'anshin', label: 'あんしん', color: '#00D4AA', image_url: '/images/emotions/anshin.webp' },
  { id: 'bikkuri', label: 'びっくり', color: '#00D4AA', image_url: '/images/emotions/bikkuri.webp' },
  
  // 青色の感情
  { id: 'kowai', label: 'こわい', color: '#0066FF', image_url: '/images/emotions/kowai.webp' },
  { id: 'kanashii', label: 'かなしい', color: '#0066FF', image_url: '/images/emotions/kanashii.webp' },
  { id: 'komatta', label: 'こまった', color: '#0066FF', image_url: '/images/emotions/komatta.webp' },
  
  // 赤色の感情
  { id: 'fuyukai', label: 'ふゆかい', color: '#FF1744', image_url: '/images/emotions/fuyukai.webp' },
  { id: 'ikari', label: 'いかり', color: '#FF1744', image_url: '/images/emotions/ikari.webp' },
  { id: 'hazukashii', label: 'はずかしい', color: '#FF1744', image_url: '/images/emotions/hazukashii.webp' },
  { id: 'kinchou', label: 'きんちょう', color: '#FF1744', image_url: '/images/emotions/kinchou.webp' },
  
  // 灰色の感情
  { id: 'wakaranai', label: 'わからない', color: '#424242', image_url: '/images/emotions/wakaranai.webp' },
];

export default function EmotionSelectionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
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
        const response = await fetch('http://localhost:8000/emotion/cards');
        if (!response.ok) {
          throw new Error('感情データの取得に失敗しました');
        }
        const data = await response.json();
        
        if (data.success && data.cards) {
          console.log('取得された感情データ:', data.cards);
          console.log('「わからない」の感情データ:', data.cards.find((e: Emotion) => e.label === 'わからない'));
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

  // 感情カードをクリックした時の処理
  const handleEmotionSelect = (emotionId: string) => {
    // 選択された感情のラベルを取得
    const selectedEmotion = emotions.find(e => e.id === emotionId);
    
    // 「わからない」が選択された場合は強度選択画面を飛ばして直接感情確認画面に遷移
    if (selectedEmotion && selectedEmotion.label === 'わからない') {
      router.push(`/app/emotion-confirmation?emotion=${emotionId}&intensity=medium`);
    } else {
      // その他の感情は強度選択画面に遷移
      router.push(`/app/emotion-intensity?emotion=${emotionId}`);
    }
  };

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/app');
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
  if (isLoadingEmotions) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>感情データを読み込み中...</p>
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
        top: '80px',
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
        {/* 感情カードの一番上に配置する白い四角 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          width: '80%',
          maxWidth: '288px',
          boxSizing: 'border-box',
          textAlign: 'center',
          alignSelf: 'flex-start',
          marginLeft: '20px',
        }}>
          <span style={{
        fontWeight: 'bold',
        fontSize: '16px',
        lineHeight: 1.4,
        margin: 0,
        whiteSpace: 'pre-line',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
      }}>
            いまの　きもちを　えらんでね
          </span>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          width: '100%',
          maxWidth: '360px',
          boxSizing: 'border-box',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {emotions.map((emotion) => (
            <button
              key={emotion.id}
              onClick={() => handleEmotionSelect(emotion.id)}
              style={{
                background: '#ffffff', // カード自体は白
                border: `4px solid ${emotion.color}`, 
                borderRadius: '16px',
                padding: '12px 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#000000', 
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                minHeight: '120px',
                justifyContent: 'space-between',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                aspectRatio: '5/6',
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
                justifyContent: 'flex-start',
                width: '100%',
                padding: '8px 8px 8px 8px',
                gap: '8px',
                marginTop: '-10px',
              }}>
                <Image
                  src={emotion.image_url}
                  alt={`こころん - ${emotion.label}`}
                  width={60}
                  height={60}
                  style={{
                    objectFit: 'contain',
                    width: '100%',
                    height: 'auto',
                    maxWidth: '80px',
                    maxHeight: '80px',
                  }}
                  onError={(e) => {
                    // 画像の読み込みに失敗した場合はデフォルト画像にフォールバック
                    console.log(`画像読み込みエラー: ${emotion.image_url} -> デフォルト画像にフォールバック`);
                    try {
                      (e.currentTarget as HTMLImageElement).src = '/images/kokoron/kokoron_greeting.webp';
                    } catch (_) {
                      // no-op
                    }
                  }}
                />
                <span style={{
                  fontSize: '14px',
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
                }}>
                  {emotion.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 