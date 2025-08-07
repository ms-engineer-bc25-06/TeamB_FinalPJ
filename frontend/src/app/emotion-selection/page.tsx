'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/components/ui';
import { commonStyles } from '@/styles/theme';
import { useState, useEffect } from 'react';

// TODO: 画像データが完成した時の対応
// 1. 以下のフォルダ構造を作成:
//    frontend/public/assets/emotions/
//    - anshin-40.webp (あんしん表情)
//    - bikkuri-40.webp (びっくり表情)
//    - kowai-40.webp (こわい表情)
//    - kanashii-40.webp (かなしい表情)
//    - komatta-40.webp (こまった表情)
//    - ureshii-40.webp (うれしい表情)
//    - yukai-40.webp (ゆかい表情)
//    - fuyukai-40.webp (ふゆかい表情)
//    - ikari-40.webp (いかり表情)
//    - hazukashii-40.webp (はずかしい表情)
//    - kincho-40.webp (きんちょう表情)
//    - wakaranai-40.webp (わからない表情)
//
// 2. 画像仕様:
//    - サイズ: 40x40px
//    - 形式: WebP（最適化のため）
//    - 背景: 透明
//    - 各感情に適したこころんの表情
//
// 3. フォールバック対応:
//    画像が読み込めない場合は現在の"/こころん（仮）.png"を使用するよう
//    onErrorハンドラーを追加することを検討

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

// 感情データの型定義
interface Emotion {
  id: string;
  name: string;
  color: string;
  imageUrl: string;
  category?: string;
}

// デフォルトの感情データ（API呼び出しに失敗した場合のフォールバック）
const DEFAULT_EMOTIONS: Emotion[] = [
  // 黄色の感情
  { id: 'ureshii', name: 'うれしい', color: '#FFD700', imageUrl: '/assets/emotions/ureshii-40.webp' },
  { id: 'yukai', name: 'ゆかい', color: '#FFD700', imageUrl: '/assets/emotions/yukai-40.webp' },
  
  // 緑色の感情
  { id: 'anshin', name: 'あんしん', color: '#00D4AA', imageUrl: '/assets/emotions/anshin-40.webp' },
  { id: 'bikkuri', name: 'びっくり', color: '#00D4AA', imageUrl: '/assets/emotions/bikkuri-40.webp' },
  
  // 青色の感情
  { id: 'kowai', name: 'こわい', color: '#0066FF', imageUrl: '/assets/emotions/kowai-40.webp' },
  { id: 'kanashii', name: 'かなしい', color: '#0066FF', imageUrl: '/assets/emotions/kanashii-40.webp' },
  { id: 'komatta', name: 'こまった', color: '#0066FF', imageUrl: '/assets/emotions/komatta-40.webp' },
  
  // 赤色の感情
  { id: 'fuyukai', name: 'ふゆかい', color: '#FF1744', imageUrl: '/assets/emotions/fuyukai-40.webp' },
  { id: 'ikari', name: 'いかり', color: '#FF1744', imageUrl: '/assets/emotions/ikari-40.webp' },
  { id: 'hazukashii', name: 'はずかしい', color: '#FF1744', imageUrl: '/assets/emotions/hazukashii-40.webp' },
  { id: 'kincho', name: 'きんちょう', color: '#FF1744', imageUrl: '/assets/emotions/kincho-40.webp' },
  
  // 灰色の感情
  { id: 'wakaranai', name: 'わからない', color: '#424242', imageUrl: '/assets/emotions/wakaranai-40.webp' },
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
        // TODO: 実際のAPIエンドポイントに変更
        // const response = await fetch('/api/emotions');
        // if (!response.ok) {
        //   throw new Error('感情データの取得に失敗しました');
        // }
        // const data = await response.json();
        // setEmotions(data);
        
        // 現在はデフォルトデータを使用（API実装後に削除）
        console.log('感情データをDBから取得する予定です');
        setEmotions(DEFAULT_EMOTIONS);
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
    router.push(`/emotion-confirmation?emotion=${emotionId}`);
  };

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/');
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
      {/* ヘッダー */}
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
            きもちを　えらんでね
          </h1>
          <div style={{ width: '50px' }}></div>
        </div>
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
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        padding: 0,
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
                background: emotion.color, // DBから取得した色を使用
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
            >
              <Image
                src={emotion.imageUrl}
                alt={`こころん - ${emotion.name}`}
                width={40}
                height={40}
                style={{
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  // TODO: 画像が読み込めない場合のフォールバック
                  // 現在はコンソールにエラーを出力
                  // 将来的には"/こころん（仮）.png"にフォールバックする実装を追加
                  console.warn(`画像の読み込みに失敗しました: ${emotion.imageUrl}`);
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