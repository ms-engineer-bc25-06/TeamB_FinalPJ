import { EMOTION_NAME_TO_FILENAME } from '@/constants/emotion';
import { EmotionIntensity } from '@/types/emotion';
import Image from 'next/image';

interface IntensityButtonProps {
  intensity: EmotionIntensity;
  selectedEmotion: {
    label: string;
    color: string;
  };
  onSelect: (intensity: EmotionIntensity) => void;
}

export const IntensityButton: React.FC<IntensityButtonProps> = ({
  intensity,
  selectedEmotion,
  onSelect,
}) => {
  // HEXカラーをRGBAに変換する関数
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <button
      data-testid={`intensity-${intensity.level}`}
      onClick={() => onSelect(intensity)}
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          gap: '12px',
        }}
      >
        <Image
          src={(() => {
            // 感情の強度レベルに応じて画像ファイル名を生成
            const baseName =
              EMOTION_NAME_TO_FILENAME[selectedEmotion.label] || 'ureshii';
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
            console.log(
              `画像読み込みエラー: ${selectedEmotion.label} -> デフォルト画像にフォールバック`,
            );
            try {
              (e.currentTarget as HTMLImageElement).src =
                '/images/kokoron/kokoron_greeting.webp';
            } catch (_) {
              // no-op
            }
          }}
        />
      </div>
    </button>
  );
};
