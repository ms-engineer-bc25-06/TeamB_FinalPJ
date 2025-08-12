'use client';
// トップページ
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  KokoronDefault,
  SpeechBubble,
  PrimaryButton,
  Spinner,
  HamburgerMenu,
  MenuItem,
} from '@/components/ui';
import SubscriptionButton from '@/components/ui/SubscriptionButton';
import { commonStyles } from '@/styles/theme';
import styles from './page.module.css';

export default function Home() {
  const { user, isLoading, logout, login } = useAuth();
  const router = useRouter();

  // ツールチップ用の状態管理
  const [showTooltip, setShowTooltip] = useState(false);

  // ツールチップの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTooltip(false);
    };

    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTooltip]);

  // おしゃべりボタンが押された時の処理
  const handleTalk = () => {
    router.push('/emotion-selection');
  };

  // ログイン処理
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('ログインエラー:', error);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    await logout();
  };

  // タッチイベントハンドラー
  const handleTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowTooltip(!showTooltip);
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
            onClick={handleLogin}
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  // --- ログイン済みの場合 ---
  // TODO: userオブジェクトに紐づくsubscription.is_paidなどの会員状態で表示を切り替える
  const isPaidMember = false; // 仮の変数

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu>
        <div className={styles.userInfo}>
          <p>ようこそ、{user.nickname}さん！</p>
        </div>
        <ul className={styles.menuList}>
          <MenuItem>使い方</MenuItem>
          <MenuItem>保護者向けTips</MenuItem>
          <MenuItem>レポートページの見かた</MenuItem>
          <MenuItem>感情教育について</MenuItem>
          <MenuItem>非認知能力について</MenuItem>
          <MenuItem>プライバシーポリシー</MenuItem>
          <MenuItem>FAQ</MenuItem>
          <MenuItem>設定</MenuItem>
          <MenuItem>ロールプレイ</MenuItem>
          <MenuItem onClick={() => router.push('/report')}>レポート</MenuItem>
          {/* 有料会員でない場合にアップグレードメニューを表示 */}
          {!isPaidMember && <MenuItem>アップグレード</MenuItem>}
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </ul>
      </HamburgerMenu>

      {/* メインコンテンツ */}
      <div style={commonStyles.page.mainContent}>
        {/* 吹き出し（こころんの上に表示） */}
        <SpeechBubble text="きょうは　どんな　きもち　かな？" />

        {/* こころんキャラクター（画面の真ん中に配置） */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={280} />
        </div>

        {/* おしゃべりボタン */}
        <PrimaryButton onClick={handleTalk}>おしゃべりする</PrimaryButton>

        {/* --- 決済ボタン --- */}
        {!isPaidMember && (
          <div
            className={styles.subscriptionContainer}
            style={{ marginTop: '2rem', textAlign: 'center' }}
          >
            <div className={styles.tooltipContainer} onClick={handleTouch}>
              <SubscriptionButton />
              <span
                className={`${styles.tooltipText} ${showTooltip ? styles.show : ''}`}
              >
                プレミアムプランに登録して、全ての機能を使ってみましょう！
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
