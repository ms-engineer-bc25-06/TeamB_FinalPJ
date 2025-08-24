// 公開トップページ
'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  SpeechBubble,
  PrimaryButton,
} from '@/components/ui';
import { FeatureList } from '@/components/ui/FeatureList';
import KokoronWelcome from '@/components/ui/KokoronWelcome';
import {
  colors,
  spacing,
  fontSize,
} from '@/styles/theme';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      zIndex: 0,
    }}>
      {/* 背景画像 */}
      <Image
        src="/images/background.webp"
        alt="背景画像"
        fill
        priority
        style={{
          objectFit: 'cover',
          zIndex: -1,
        }}
      />

      {/* アプリタイトル - 左上に固定 */}
      <div style={{
        position: 'absolute',
        left: '20px',
        zIndex: 10,
      }}>
        <Image 
          src="/images/app_title.webp" 
          alt="きもちみっけ！" 
          width={250} 
          height={120} 
          style={{ 
            objectFit: 'contain',
            maxWidth: '100%',
            height: 'auto', // アスペクト比保持
            width: 'auto',
          }}
        />
      </div>

      {/* メインコンテンツ */}
      <div style={{
        position: 'absolute',
        top: '63%', // 65%から55%に変更して上部に移動
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // centerからflex-startに変更
        width: '90%', // 80%から90%に変更
        maxWidth: '600px', // 500pxから600pxに変更
        zIndex: 1,
      }}>
        <div style={{
          width: '80%',
          maxWidth: '80%',
          backgroundColor: '#f8f9fa',
          border: '2px solid #e0e0e0',
          borderRadius: '12px',
          boxShadow: '#f8f9fa',
          padding: '10px', // 20pxから15pxに変更
          marginBottom: '20px',
        }}>
          {/* 説明文を上部に追加 */}
          <p style={{
            fontSize: fontSize.large,
            color: colors.text.secondary,
            textAlign: 'left',
            marginBottom: spacing.sm, // mdからsmに変更
            lineHeight: 1.4, // 1.6から1.4に変更
            fontWeight: '500',
          }}>
            本アプリはお子さまの感情理解をサポートするツールを提供しております。
          </p>
          
          <FeatureList 
            title="✨ このアプリの機能 ✨"
            variant="detailed" // フォントサイズを大きくする
          />
        </div>

        {/* こころん吹き出し */}
        <div style={{
          width: '80%', // 幅を60%に制限
          maxWidth: '400px', // 最大幅も制限
          display: 'flex',
          justifyContent: 'center',
        }}>
          <SpeechBubble 
            text="
            いっしょに きもちを たんけんしよう！"
          />
        </div>
        
        {/* こころんキャラクター */}
        <KokoronWelcome />
        
        {/* CTA ボタン */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            alignItems: 'center',
            marginTop: '15px', // 30pxから15pxに変更
          }}
        >
          <PrimaryButton
            onClick={() => router.push('/login')}
          >
            はじめる
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
