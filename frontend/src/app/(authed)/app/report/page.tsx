'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DailyReport from '@/app/(authed)/app/report/_components/DailyReport';
import WeeklyReport from '@/app/(authed)/app/report/_components/WeeklyReport';
import { commonStyles, spacing } from '@/styles/theme';
import {
  PrimaryButton,
  Spinner,
  HamburgerMenu,
} from '@/components/ui';
import KokoronReadingReport from '@/components/ui/KokoronReadingReport';

export default function ReportPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/app');
  };

  // ログアウト処理
  const handleLogout = async () => {
    await logout();
  };

  // ログインしていない場合のリダイレクト
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // ローディング中（認証）
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合は何も表示しない（useEffectでリダイレクトされる）
  if (!user) {
    return null;
  }

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
      <HamburgerMenu/ >

      <div style={commonStyles.page.mainContent}>

        {/* こころんを表示 */}
        <div style={commonStyles.page.kokoronContainer}>
          <KokoronReadingReport size={200} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg,
            alignItems: 'center',
            maxWidth: '1000px',
            width: '90vw',
          }}
        >
          <PrimaryButton 
            onClick={() => setShowDailyReport(true)}
            style={{ 
              width: '100%', 
              maxWidth: '800px',
              minWidth: 'auto',
              padding: '20px 80px'
            }}
          >
            まいにちのきろく
          </PrimaryButton>

          <PrimaryButton 
            onClick={() => setShowWeeklyReport(true)}
            style={{ 
              width: '100%', 
              maxWidth: '800px',
              minWidth: 'auto',
              padding: '20px 80px'
            }}
          >
            こんしゅうのきろく
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
