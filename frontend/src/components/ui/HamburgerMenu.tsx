import { useState } from 'react';
import { colors, commonStyles, animation, spacing, borderRadius } from '@/styles/theme';

interface HamburgerMenuProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function HamburgerMenu({ 
  children, 
  className = '',
  style = {}
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const hamburgerStyle: React.CSSProperties = {
    position: 'relative',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    padding: '0',
    ...style,
  };

  const lineStyle: React.CSSProperties = {
    width: '100%',
    height: '3px',
    backgroundColor: colors.text.primary,
    borderRadius: '2px',
    transition: animation.transition,
    transformOrigin: 'center',
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: '0',
    zIndex: 1000,
    ...commonStyles.menu,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
    transition: animation.transition,
    marginTop: spacing.sm,
  };

  return (
    <div style={{ position: 'relative' }} className={className}>
      <button
        onClick={toggleMenu}
        style={hamburgerStyle}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <div
          style={{
            ...lineStyle,
            transform: isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0)',
          }}
        />
        <div
          style={{
            ...lineStyle,
            opacity: isOpen ? 0 : 1,
          }}
        />
        <div
          style={{
            ...lineStyle,
            transform: isOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'rotate(0)',
          }}
        />
      </button>
      
      <div style={menuStyle}>
        {children}
      </div>
    </div>
  );
}

// メニューアイテム用のコンポーネント
interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function MenuItem({ 
  children, 
  onClick,
  disabled = false 
}: MenuItemProps) {
  const itemStyle: React.CSSProperties = {
    ...commonStyles.menuItem,
    ...(disabled && {
      opacity: 0.5,
      cursor: 'not-allowed',
    }),
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={itemStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = colors.background.gradient;
          e.currentTarget.style.color = colors.text.white;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.text.primary;
        }
      }}
    >
      {children}
    </button>
  );
} 