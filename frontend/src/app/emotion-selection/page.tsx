'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmotionSelectionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  // 感情カードのデータ（色分けに従って配置）
      // TODO: 将来的にDBから取得するように変更予定
    const emotions = [
      // 緑色の感情
      { id: 'anshin', name: 'あんしん', color: '#00D4AA', category: 'green', colorId: 'green_1' },
      { id: 'bikkuri', name: 'びっくり', color: '#00D4AA', category: 'green', colorId: 'green_2' },
      
      // 青色の感情
      { id: 'kowai', name: 'こわい', color: '#0066FF', category: 'blue', colorId: 'blue_1' },
      { id: 'kanashii', name: 'かなしい', color: '#0066FF', category: 'blue', colorId: 'blue_2' },
      { id: 'komatta', name: 'こまった', color: '#0066FF', category: 'blue', colorId: 'blue_3' },
      
      // 黄色の感情
      { id: 'ureshii', name: 'うれしい', color: '#FFD700', category: 'yellow', colorId: 'yellow_1' },
      { id: 'yukai', name: 'ゆかい', color: '#FFD700', category: 'yellow', colorId: 'yellow_2' },
      
      // 赤色の感情
      { id: 'fuyukai', name: 'ふゆかい', color: '#FF1744', category: 'red', colorId: 'red_1' },
      { id: 'ikari', name: 'いかり', color: '#FF1744', category: 'red', colorId: 'red_2' },
      { id: 'hazukashii', name: 'はずかしい', color: '#FF1744', category: 'red', colorId: 'red_3' },
      { id: 'kincho', name: 'きんちょう', color: '#FF1744', category: 'red', colorId: 'red_4' },
      
      // 灰色の感情
      { id: 'wakaranai', name: 'わからない', color: '#424242', category: 'gray', colorId: 'gray_1' },
    ];

  // TODO: DBから感情データを取得する関数（将来的に実装予定）
  // const fetchEmotionsFromDB = async () => {
  //   try {
  //     const response = await fetch('/api/emotions');
  //     const data = await response.json();
  //     return data;
  //   } catch (error) {
  //     console.error('感情データの取得に失敗しました:', error);
  //     return emotions; // フォールバック用のデフォルトデータ
  //   }
  // };

  // 感情カードをクリックした時の処理
  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    // 確認画面に遷移
    router.push(`/emotion-confirmation?emotion=${emotionId}`);
  };

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/');
  };

  // ローディング中
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'url("/背景（仮）.PNG") no-repeat center center',
        backgroundSize: 'cover',
        zIndex: 300,
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid #ff6b6b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }}></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'url("/背景（仮）.PNG") no-repeat center center',
      backgroundSize: 'cover',
      overflow: 'hidden',
    }}>
      {/* ヘッダー */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
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
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              color: '#333',
            }}
          >
            ← 戻る
          </button>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            きもちをえらんでね
          </h1>
          <div style={{ width: '50px' }}></div> {/* 中央揃えのためのスペーサー */}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '0',
        padding: '0',
        zIndex: 50,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '600px',
        overflowX: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
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
                background: emotion.color,
                border: '2px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '12px',
                padding: '16px 10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                minHeight: '120px',
                justifyContent: 'center',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                aspectRatio: '5/6',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              }}
            >
              {/* こころんの画像 */}
              <img
                src="/こころん（仮）.png"
                alt="こころん"
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'contain',
                }}
              />
              <span style={{
                textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                fontSize: '18px',
                lineHeight: '1.2',
              }}>
                {emotion.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 