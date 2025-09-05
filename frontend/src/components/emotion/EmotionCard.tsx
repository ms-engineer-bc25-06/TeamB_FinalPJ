import Image from 'next/image';
import { Emotion, EmotionIntensity } from '@/types/emotion';
import { EMOTION_NAME_TO_FILENAME } from '@/constants/emotion';

interface EmotionCardProps {
  selectedEmotion: Emotion;
  selectedIntensity: EmotionIntensity;
  cardTransform: { x: number; y: number; rotation: number };
  isDragging: boolean;
  swipeDirection: 'left' | 'right' | null;
  onTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  onTouchEnd: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const EmotionCard: React.FC<EmotionCardProps> = ({
  selectedEmotion,
  selectedIntensity,
  cardTransform,
  isDragging,
  swipeDirection,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  cardRef,
}) => {
  // HEXカラーをRGBAに変換する関数
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onTouchStart}
      onMouseMove={onTouchMove}
      onMouseUp={onTouchEnd}
      onMouseLeave={onTouchEnd}
    >
      {/* 感情画像 */}
      <Image
        src={(() => {
          const baseName = EMOTION_NAME_TO_FILENAME[selectedEmotion.label] || 'ureshii';
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
            (e.currentTarget as HTMLImageElement).src = '/images/kokoron/kokoron_greeting.webp';
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
            background: swipeDirection === 'right' ? '#4CAF50' : '#F44336',
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

      {/* 左スワイプ（いいえ）の赤い矢印 */}
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

      {/* 右スワイプ（はい）の緑の矢印 */}
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
  );
};
