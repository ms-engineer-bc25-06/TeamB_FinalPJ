'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AudioPlayer } from '@/components/ui';
import { commonStyles } from '@/styles/theme';

export default function VoiceCompletePage() {
  const router = useRouter();

  // もどるボタンの処理
  const handleBack = () => {
    router.back();
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
      
      {/* 左上のもどるボタン */}
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

        {/* 完了メッセージ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 16px 0',
            lineHeight: 1.3,
          }}>
            おしえてくれてありがとう♡
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#666',
            margin: 0,
            lineHeight: 1.4,
          }}>
            きょうのきもちをきろくできました
          </p>
          
        </div>
      </div>
    </div>
  );
}