'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DailyReport from '@/components/report/DailyReport';
import WeeklyReport from '@/components/report/WeeklyReport';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';
import {
  PrimaryButton,
  Spinner,
  HamburgerMenu,
  MenuItem,
} from '@/components/ui';
import styles from '../page.module.css';
import KokoronReadingReport from '@/components/ui/KokoronReadingReport';

export default function ReportPage() {
  const { user, isLoading, logout, login } = useAuth();
  const router = useRouter();
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/');
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

  // ローディング中（認証）
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

  // TODO: userオブジェクトに紐づくsubscription.is_paidなどの会員状態で表示を切り替える
  const isPaidMember = false; // 仮の変数

  return (
    <div style={commonStyles.page.container}>
      <button
        onClick={handleBack}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          color: '#333',
        }}
      >
        ← もどる
      </button>
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
          <MenuItem>レポート</MenuItem>
          {/* 有料会員でない場合にアップグレードメニューを表示 */}
          {!isPaidMember && <MenuItem>サブスクリプション</MenuItem>}
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </ul>
      </HamburgerMenu>
      <div style={commonStyles.page.mainContent}>
        <h1
          style={{
            color: colors.text.primary,
            fontSize: fontSize.xxl,
            fontWeight: 'bold',
            marginBottom: spacing.xl,
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          〇〇のこころん
        </h1>
        {/* こころんを表示 */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronReadingReport size={120} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
            alignItems: 'center',
          }}
        >
          <PrimaryButton
            onClick={() => setShowDailyReport(true)}
          >
            毎日のきろく
          </PrimaryButton>

          <PrimaryButton
            onClick={() => setShowWeeklyReport(true)}
          >
            今週のきろく
          </PrimaryButton>
        </div>

        {/* 説明テキスト */}
        <div
          style={{
            marginTop: spacing.xl,
            textAlign: 'center',
            maxWidth: '300px',
          }}
        ></div>
      </div>
      {/* 日次レポートモーダル */}
      {showDailyReport && (
        <DailyReport onClose={() => setShowDailyReport(false)} />
      )}
      {/* 週次レポートモーダル */}
      {showWeeklyReport && (
        <WeeklyReport onClose={() => setShowWeeklyReport(false)} />
      )}
    </div>
  );
}
