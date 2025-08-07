/**
 * プロジェクト全体のデザインシステム
 * 色、サイズ、アニメーション、共通スタイルを一元管理
 */

// ===== カラーパレット =====
// ブランドカラーとUI要素の色を定義
export const colors = {
  primary: '#ff6b6b',        // メインカラー（ピンク系）
  primaryHover: '#ff5252',   // ホバー時のメインカラー
  secondary: '#667eea',      // サブカラー（青系）
  secondaryHover: '#764ba2', // ホバー時のサブカラー
  text: {
    primary: '#333',         // メインテキスト色
    secondary: '#666',       // サブテキスト色
    white: '#ffffff',        // 白テキスト
  },
  background: {
    white: '#ffffff',        // 白背景
    transparent: 'transparent', // 透明背景
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // グラデーション背景
  },
  border: {
    light: 'rgba(255,255,255,0.5)', // 薄いボーダー
    dark: '#333',                   // 濃いボーダー
  },
  shadow: {
    light: '0 4px 8px rgba(0,0,0,0.1)',           // 軽い影
    medium: '0 4px 12px rgba(255,107,107,0.3)',   // 中程度の影
    heavy: '0 8px 32px rgba(0,0,0,0.1)',          // 重い影
    menu: '0 4px 12px rgba(0,0,0,0.15)',          // メニュー用の影
  },
  login: {
    primary: '#4285F4',      // Googleログインボタン色
    hover: '#3367D6',        // ホバー時のログインボタン色
  },
} as const;

// ===== サイズとスペーシング =====
// レイアウトの間隔を統一管理
export const spacing = {
  xs: '4px',   // 最小間隔
  sm: '8px',   // 小間隔
  md: '16px',  // 中間隔
  lg: '24px',  // 大間隔
  xl: '32px',  // 特大間隔
  xxl: '48px', // 最大間隔
} as const;

// ===== ボーダーラジウス =====
// 角丸のサイズを統一管理
export const borderRadius = {
  small: '8px',   // 小角丸
  medium: '16px', // 中角丸
  large: '20px',  // 大角丸
  button: '24px', // ボタン用角丸
  circle: '50%',  // 円形
} as const;

// ===== フォントサイズ =====
// テキストサイズを統一管理（14px以上に統一）
export const fontSize = {
  small: '14px',     // 最小サイズ（14px）
  base: '16px',      // 基本サイズ（16px）
  large: '18px',     // 大文字（18px）
  xl: '20px',        // 特大文字（20px）
  xxl: '24px',       // 最大文字（24px）
} as const;

// ===== アニメーション =====
// トランジションとアニメーションを定義
export const animation = {
  spin: 'spin 1s linear infinite', // 回転アニメーション（スピナー用）
  transition: 'all 0.3s ease',     // 標準トランジション
  transitionFast: 'all 0.2s ease', // 高速トランジション
} as const;

// ===== 共通スタイル =====
// よく使うスタイルを事前定義
export const commonStyles = {
  // レイアウト用スタイル
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
  
  // ページ全体のレイアウト
  page: {
    container: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'url("/背景（仮）.PNG") no-repeat center center',
      backgroundSize: 'cover',
      overflow: 'hidden',
    },
    mainContent: {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    kokoronContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: `${spacing.lg} 0`,
    },
  },
  
  // ハンバーガーメニュー関連
  menuButton: {
    position: 'fixed' as const,
    top: spacing.md,
    right: spacing.md,
    width: '100px',
    height: '100px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: borderRadius.small,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 200,
  },
  menuIcon: {
    width: '84px',
    height: '12px',
    background: colors.text.primary,
    borderRadius: '6px',
  },
  menuDrawer: {
    position: 'fixed' as const,
    top: 0,
    right: '-500px',
    width: '500px',
    height: '100vh',
    background: colors.background.white,
    boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)',
    transition: animation.transition,
    zIndex: 1000,
  },
  menuDrawerOpen: {
    right: 0,
  },
  menuOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  
  // ログイン画面関連
  login: {
    container: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url("/背景（仮）.PNG") no-repeat center center',
      backgroundSize: 'cover',
      padding: spacing.lg,
      zIndex: 300,
    },
    card: {
      background: colors.background.white,
      borderRadius: borderRadius.large,
      padding: spacing.xl,
      textAlign: 'center' as const,
      boxShadow: colors.shadow.heavy,
      maxWidth: '400px',
      width: '100%',
    },
    button: {
      background: colors.login.primary,
      border: 'none',
      borderRadius: '50px',
      padding: `${spacing.md} ${spacing.xl}`,
      fontSize: fontSize.large,
      fontWeight: 'bold',
      color: colors.text.white,
      cursor: 'pointer',
      transition: animation.transition,
    },
  },
  
  // ローディング画面関連
  loading: {
    container: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      background: 'url("/背景（仮）.PNG") no-repeat center center',
      backgroundSize: 'cover',
      zIndex: 300,
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: `4px solid ${colors.primary}`,
      borderRadius: borderRadius.circle,
      animation: animation.spin,
      marginBottom: spacing.md,
    },
  },
  
  // ボタンスタイル
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
  
  // カードスタイル
  card: {
    background: colors.background.white,
    borderRadius: borderRadius.medium,
    boxShadow: colors.shadow.heavy,
    padding: spacing.xl,
  },
  
  // ドロップダウンメニュー関連
  menu: {
    background: colors.background.white,
    borderRadius: borderRadius.small,
    boxShadow: colors.shadow.menu,
    padding: `${spacing.sm} 0`,
    minWidth: '150px',
  },
  menuItem: {
    width: '100%',
    padding: `${spacing.xxl} ${spacing.xxl}`,
    background: 'none',
    border: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '72px',
    color: colors.text.primary,
    transition: animation.transitionFast,
  },
  
  // 汎用スピナー（ロード中のぐるぐる）
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: `4px solid ${colors.primary}`,
    borderRadius: borderRadius.circle,
    animation: animation.spin,
  },
} as const;

// ===== レスポンシブ対応 =====
// デバイス別のブレークポイント
export const breakpoints = {
  mobile: '480px',   // スマートフォン
  tablet: '768px',   // タブレット
  desktop: '1024px', // デスクトップ
} as const;

// メディアクエリの定義
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
} as const; 