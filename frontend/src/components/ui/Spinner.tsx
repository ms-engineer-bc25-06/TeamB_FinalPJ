import { commonStyles } from '@/styles/theme';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Spinner({ 
  size = 'medium', 
  color,
  className = '',
  style = {}
}: SpinnerProps) {
  // サイズに応じたスタイルを定義
  const sizeStyles = {
    small: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: `2px solid ${color || '#ff6b6b'}`,
    },
    medium: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: `4px solid ${color || '#ff6b6b'}`,
    },
    large: {
      width: '60px',
      height: '60px',
      border: '6px solid rgba(255, 255, 255, 0.3)',
      borderTop: `6px solid ${color || '#ff6b6b'}`,
    },
  };

  const spinnerStyle: React.CSSProperties = {
    ...commonStyles.spinner,
    ...sizeStyles[size],
    ...style,
  };

  return (
    <div 
      className={className}
      style={spinnerStyle}
      role="status"
      aria-label="読み込み中"
    />
  );
} 