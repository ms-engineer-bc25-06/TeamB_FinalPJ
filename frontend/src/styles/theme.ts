// プロジェクトのデザインガイドライン

// カラーパレット
export const colors = {
  primary: '#ff6b6b',
  primaryHover: '#ff5252',
  secondary: '#667eea',
  secondaryHover: '#764ba2',
  text: {
    primary: '#333',
    secondary: '#666',
    white: '#ffffff',
  },
  background: {
    white: '#ffffff',
    transparent: 'transparent',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  border: {
    light: 'rgba(255,255,255,0.5)',
    dark: '#333',
  },
  shadow: {
    light: '0 4px 8px rgba(0,0,0,0.1)',
    medium: '0 4px 12px rgba(255,107,107,0.3)',
    heavy: '0 8px 32px rgba(0,0,0,0.1)',
    menu: '0 4px 12px rgba(0,0,0,0.15)',
  },
} as const;

// サイズとスペーシング
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

// ボーダーラジウス
export const borderRadius = {
  small: '8px',
  medium: '16px',
  large: '20px',
  button: '24px',
  circle: '50%',
} as const;

// フォントサイズ
export const fontSize = {
  small: '0.875rem',
  base: '1rem',
  large: '1.2rem',
  xl: '1.5rem',
  xxl: '2rem',
} as const;

// アニメーション
export const animation = {
  spin: 'spin 1s linear infinite',
  transition: 'all 0.3s ease',
  transitionFast: 'all 0.2s ease',
} as const;

// 共通スタイル
export const commonStyles = {
  // レイアウト
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  fullHeight: {
    minHeight: '100vh',
  },
  
  // ボタン
  button: {
    base: {
      border: 'none',
      cursor: 'pointer',
      transition: animation.transition,
      fontFamily: 'inherit',
    },
    primary: {
      backgroundColor: colors.primary,
      color: colors.text.white,
      borderRadius: borderRadius.button,
      padding: `${spacing.md} ${spacing.xxl}`,
      fontSize: fontSize.large,
      fontWeight: 'bold',
      minWidth: '200px',
      boxShadow: colors.shadow.medium,
    },
    secondary: {
      backgroundColor: colors.background.transparent,
      border: `1px solid ${colors.border.light}`,
      color: colors.text.primary,
      borderRadius: borderRadius.small,
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: fontSize.small,
    },
  },
  
  // カード
  card: {
    background: colors.background.white,
    borderRadius: borderRadius.medium,
    boxShadow: colors.shadow.heavy,
    padding: spacing.xl,
  },
  
  // メニュー
  menu: {
    background: colors.background.white,
    borderRadius: borderRadius.small,
    boxShadow: colors.shadow.menu,
    padding: `${spacing.sm} 0`,
    minWidth: '150px',
  },
  menuItem: {
    width: '100%',
    padding: `${spacing.md} ${spacing.md}`,
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: fontSize.small,
    color: colors.text.primary,
    transition: animation.transitionFast,
  },
  
  // スピナー
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: borderRadius.circle,
    animation: animation.spin,
  },
} as const;

// レスポンシブブレークポイント
export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
} as const;

// メディアクエリ
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
} as const; 