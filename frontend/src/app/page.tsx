'use client';
// トップページ
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { KokoronDefault, SpeechBubble, PrimaryButton, Spinner } from '@/components/ui';
import { commonStyles } from '@/styles/theme';
import styles from './page.module.css';

export default function Home() {
  const { user, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // メニューの開閉を切り替える
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // おしゃべりボタンが押された時の処理
  const handleTalk = () => {
    console.log('おしゃべりボタンが押されました');
  };

  // ログアウト処理
  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  // ローディング中
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合
  if (!user) {
    return (
      <div style={commonStyles.login.container}>
        <div style={commonStyles.login.card}>
          <h1>ようこそ！</h1>
          <p>続けるにはログインしてください。</p>
          <button 
            style={commonStyles.login.button}
            className={styles.loginButton}
            onClick={() => window.location.href = '/login'}
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      {/* 右上のハンバーガーメニュー */}
      <button style={commonStyles.menuButton} onClick={toggleMenu}>
        <span style={commonStyles.menuIcon}></span>
        <span style={commonStyles.menuIcon}></span>
        <span style={commonStyles.menuIcon}></span>
      </button>

      {/* 右側から出てくるメニュー */}
      <div style={menuOpen ? { ...commonStyles.menuDrawer, ...commonStyles.menuDrawerOpen } : commonStyles.menuDrawer}>
        <div className={styles.drawerContent}>
          <div className={styles.userInfo}>
            <p>ようこそ、{user.nickname}さん！</p>
          </div>
          <ul className={styles.menuList}>
            <li className={styles.menuItem}>使い方</li>
            <li className={styles.menuItem}>保護者向けTips</li>
            <li className={styles.menuItem}>レポートページの見かた</li>
            <li className={styles.menuItem}>感情教育について</li>
            <li className={styles.menuItem}>非認知能力について</li>
            <li className={styles.menuItem}>プライバシーポリシー</li>
            <li className={styles.menuItem}>FAQ</li>
            <li className={styles.menuItem}>設定</li>
            <li className={styles.menuItem}>ロールプレイ</li>
            <li className={styles.menuItem}>レポート</li>
            <li className={styles.menuItem}>アップグレード</li>
            <li className={styles.menuItem} onClick={handleLogout}>ログアウト</li>
          </ul>
        </div>
      </div>

      {/* メニューが開いている時の背景オーバーレイ */}
      {menuOpen && <div style={commonStyles.menuOverlay} onClick={toggleMenu}></div>}

      {/* メインコンテンツ */}
      <div style={commonStyles.page.mainContent}>
        {/* 吹き出し（こころんの上に表示） */}
        <SpeechBubble text="きょうは　どんな　きもち　かな？" />

        {/* こころんキャラクター（画面の真ん中に配置） */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        {/* おしゃべりボタン */}
        <PrimaryButton onClick={handleTalk}>
          おしゃべりする
        </PrimaryButton>
      </div>
    </div>
  );
}
