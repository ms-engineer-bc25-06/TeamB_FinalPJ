'use client';

import { ErrorDisplay } from '@/components/emotion/ErrorDisplay';
import {
  AudioPlayer,
  BackButton,
  KokoronDefault,
  Spinner,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useEmotionSelection } from '@/hooks/useEmotionSelection';
import { commonStyles } from '@/styles/theme';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function EmotionSelectionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // カスタムフックを使用
  const { emotions, isLoadingEmotions, error } = useEmotionSelection();

  // ユーザー認証チェック
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // 感情カードをクリックした時の処理
  const handleEmotionSelect = (emotionId: string) => {
    console.log('🎯 感情選択: emotionId =', emotionId);

    // 選択された感情のラベルを取得
    const selectedEmotion = emotions.find((e) => e.id === emotionId);
    console.log('🎯 選択された感情:', selectedEmotion);

    // 「わからない」が選択された場合は強度選択画面を飛ばして直接感情確認画面に遷移
    if (selectedEmotion && selectedEmotion.label === 'わからない') {
      console.log('🎯 「わからない」が選択されました。感情確認画面に直接遷移');
      router.push(
        `/app/emotion-confirmation?emotion=${emotionId}&intensity=medium`,
      );
    } else {
      // その他の感情は強度選択画面に遷移
      console.log(
        '🎯 強度選択画面に遷移:',
        `/app/emotion-intensity?emotion=${emotionId}`,
      );
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
    return null;
  }

  // エラー表示
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onBack={() => router.push('/app')}
        title="感情選択"
      />
    );
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
      {/* こころんによる問いかけ音声再生 */}
      <AudioPlayer
        src="/sounds/characterAskFeeling01.mp3"
        autoPlay={true}
        volume={0.8}
        onEnded={() => console.log('音声再生完了')}
        onError={(error) => console.log('音声エラー:', error)}
      />

      {/* 左上の戻るボタン */}
      <BackButton onClick={handleBack} />

      {/* デフォルトのこころん（右側に配置） */}
      <div
        style={{
          position: 'fixed',
          top: '110px',
          right: '20px',
          zIndex: 250,
        }}
      >
        <KokoronDefault size={100} />
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
        {/* 感情カードの一番上に配置する白い四角 */}
        <div
          style={{
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
          }}
        >
          <span
            style={{
              fontWeight: 'bold',
              fontSize: '16px',
              lineHeight: 1.4,
              margin: 0,
              whiteSpace: 'pre-line',
              wordBreak: 'keep-all',
              overflowWrap: 'break-word',
            }}
          >
            きょうは　どんな　きもちかな？
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            width: '100%',
            maxWidth: '360px',
            boxSizing: 'border-box',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
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
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  width: '100%',
                  padding: '8px 8px 8px 8px',
                  gap: '8px',
                  marginTop: '-10px',
                }}
              >
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
                    console.log(
                      `画像読み込みエラー: ${emotion.image_url} -> デフォルト画像にフォールバック`,
                    );
                    try {
                      (e.currentTarget as HTMLImageElement).src =
                        '/images/kokoron/kokoron_greeting.webp';
                    } catch (_) {
                      // no-op
                    }
                  }}
                />
                <span
                  style={{
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
                  }}
                >
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
