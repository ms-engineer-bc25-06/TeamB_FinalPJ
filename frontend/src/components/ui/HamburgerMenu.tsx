import { useState } from 'react';
import { colors, commonStyles, animation, spacing } from '@/styles/theme';

interface HamburgerMenuProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  position?: 'left' | 'right';
  width?: string;
}

export default function HamburgerMenu({ 
  children, 
  className = '',
  style = {},
  position = 'right',
  width = '300px'
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  // ハンバーガーボタンのスタイル
  const hamburgerStyle: React.CSSProperties = {
    position: 'fixed',
    top: spacing.md,
    right: spacing.md,
    cursor: 'pointer',
    width: '40px',
    height: '40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '3px',
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'none',
    borderRadius: '6px',
    padding: '0',
    zIndex: 1001,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    ...style,
  };

  // ハンバーガーアイコンのスタイル
  const lineStyle: React.CSSProperties = {
    width: '24px',
    height: '3px',
    backgroundColor: colors.text.primary,
    borderRadius: '2px',
    transition: animation.transition,
    transformOrigin: 'center',
  };

  // ドロワーメニューのスタイル
  const drawerMenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    [position]: isOpen ? 0 : '-280px',
    width: '280px',
    height: '100vh',
    background: colors.background.white,
    boxShadow: position === 'right' 
      ? '-2px 0 10px rgba(0, 0, 0, 0.1)' 
      : '2px 0 10px rgba(0, 0, 0, 0.1)',
    transition: animation.transition,
    zIndex: 999,
  };

  // 閉じるボタンのスタイル
  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing.md,
    [position === 'right' ? 'right' : 'left']: spacing.md,
    width: '30px',
    height: '30px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: colors.text.primary,
    zIndex: 1002,
  };

  // オーバーレイのスタイル（削除済み）

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleMenu}
        style={hamburgerStyle}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
        className={className}
      >
        <span style={lineStyle} />
        <span style={lineStyle} />
        <span style={lineStyle} />
      </button>

      {/* ドロワーメニュー */}
      <div style={drawerMenuStyle}>
        {/* 閉じるボタン */}
        <button 
          onClick={closeMenu}
          style={closeButtonStyle}
          aria-label="メニューを閉じる"
        >
          ×
        </button>
        
        {/* メニューコンテンツ */}
        <div style={{ 
          padding: spacing.md, 
          paddingTop: '60px', 
          height: '100vh', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
        }}>
          {children}
        </div>
      </div>

      {/* オーバーレイを削除 */}
    </>
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
    width: '100%',
    padding: `${spacing.md} ${spacing.sm}`,
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1.4',
    color: colors.text.primary,
    transition: animation.transition,
    borderBottom: '1px solid #eee',
    borderRadius: '4px',
    marginBottom: spacing.xs,
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
          e.currentTarget.style.backgroundColor = colors.primary;
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