import { colors, commonStyles } from '@/styles/theme';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export default function PrimaryButton({ 
  children, 
  onClick,
  disabled = false
}: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...commonStyles.button.base,
        ...commonStyles.button.primary,
        fontSize: '36px',
        padding: '36px 68px',
        minWidth: '360px',
        ...(disabled && {
          backgroundColor: '#ccc',
          cursor: 'not-allowed',
          transform: 'none',
          boxShadow: 'none',
        }),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.primaryHover;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,107,107,0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.primary;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = colors.shadow.medium;
        }
      }}
    >
      {children}
    </button>
  );
} 