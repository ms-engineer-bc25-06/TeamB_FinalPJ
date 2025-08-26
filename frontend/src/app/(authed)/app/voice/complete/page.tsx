'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AudioPlayer, PrimaryButton } from '@/components/ui';
import { commonStyles, colors } from '@/styles/theme';

export default function VoiceCompletePage() {
  const router = useRouter();

  // ホームに戻る処理
  const handleGoHome = () => {
    router.push('/app');
  };

  // 白いボタンのスタイル（ホームに戻る用）
  const whiteButtonStyle = {
    ...commonStyles.button.base,
    backgroundColor: '#ffffff',
    color: colors.primary, // ピンクのテキスト
    border: `2px solid ${colors.primary}`, // ピンクのボーダー
    fontSize: '22px',
    padding: '25px 50px',
    minWidth: '200px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: colors.shadow.medium,
    borderRadius: '12px',
    fontWeight: 'bold',
  };

  return (
    <div style={commonStyles.page.container}>
      {/* 音声再生 */}
      <AudioPlayer 
        src="/sounds/characterThankYou05.mp3"
        autoPlay={true}
        volume={0.8}
        onEnded={() => console.log('[AUDIO] 入力完了音声再生完了')}
        onError={(error) => console.log('[AUDIO] 音声エラー:', error)}
      />

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
        gap: '20px',
      }}>
        {/* こころんキャラクター */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <Image
            src="/images/kokoron/kokoron_thanks.webp"
            alt="感謝のこころん"
            width={450}
            height={450}
            priority={true}
            style={{
              objectFit: 'contain',
            }}
          />
        </div>

          {/* ボタン1: おしえてくれてありがとう（ピンク - PrimaryButton） */}
          <PrimaryButton onClick={() => console.log('ありがとうボタンが押されました')}>
            おしえてくれてありがとう
          </PrimaryButton>

          {/* ボタン2: ホームにもどる（白 - カスタムスタイル） */}
          <button
            onClick={handleGoHome}
            style={whiteButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,107,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.color = colors.primary;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow.medium;
            }}
          >
            ホームにもどる
          </button>
        </div>
    </div>
  );
}