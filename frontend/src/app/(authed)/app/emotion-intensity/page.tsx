'use client';

import { ErrorDisplay } from '@/components/emotion/ErrorDisplay';
import { IntensityButton } from '@/components/emotion/IntensityButton';
import { AudioPlayer, KokoronDefault, Spinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useEmotionIntensity } from '@/hooks/useEmotionIntensity';
import { commonStyles } from '@/styles/theme';
import { EmotionIntensity } from '@/types/emotion';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

function EmotionIntensityContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // カスタムフックを使用
  const { selectedEmotion, intensities, isLoadingEmotion, error } =
    useEmotionIntensity();

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
        <ErrorDisplay error={error} onBack={handleBack} />
      </div>
    );
  }

  // 感情が選択されていない場合
  if (!selectedEmotion || intensities.length === 0) {
    return (
      <div style={commonStyles.page.container}>
        <ErrorDisplay
          error="感情データが見つかりません"
          onBack={handleBack}
          title="感情強度選択"
        />
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      {/* こころんによる強度選択の問いかけ音声再生 */}
      <AudioPlayer
        src="/sounds/characterAskIntensity02.mp3"
        autoPlay={true}
        volume={0.8}
        onEnded={() => console.log('強度選択音声再生完了')}
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

      {/* デフォルトのこころん*/}
      <div
        style={{
          position: 'fixed',
          top: '130px',
          right: '2px',
          zIndex: 250,
        }}
      >
        <KokoronDefault size={100} />
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div
          style={{
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
          }}
        >
          {error}
        </div>
      )}

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
        {/* 感情の説明文（白い四角） */}
        {selectedEmotion && (
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
                {selectedEmotion.label}
              </span>
              <span
                style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  lineHeight: 1.4,
                  margin: 0,
                  color: '#666',
                }}
              >
                このきもち　どのくらいかな？
              </span>
            </div>
          </div>
        )}

        {/* 感情強度選択ボタン */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '19px',
            width: '100%',
            maxWidth: '320px',
            boxSizing: 'border-box',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {intensities.map((intensity) => (
            <IntensityButton
              key={intensity.id}
              intensity={intensity}
              selectedEmotion={selectedEmotion}
              onSelect={handleIntensitySelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EmotionIntensityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmotionIntensityContent />
    </Suspense>
  );
}
