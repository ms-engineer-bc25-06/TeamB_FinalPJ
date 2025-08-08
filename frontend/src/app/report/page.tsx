// レポートページ
'use client';

import { useState } from 'react';
// import { useAuth } from '@/contexts/AuthContext';
import DailyReport from '@/components/report/DailyReport';
import WeeklyReport from '@/components/report/WeeklyReport';
import { colors, commonStyles, spacing, fontSize } from '@/styles/theme';
import {
  KokoronDefault,
  SpeechBubble,
  PrimaryButton,
  Spinner,
  HamburgerMenu,
  MenuItem,
} from '@/components/ui';
import styles from '../page.module.css';

export default function ReportPage() {
  // const { user } = useAuth();
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー
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
          <MenuItem>アップグレード</MenuItem>
          <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
        </ul>
      </HamburgerMenu> */}

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
          <KokoronDefault size={120} />
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
            className="text-small"
            onClick={() => setShowDailyReport(true)}
          >
            毎日のきろく
          </PrimaryButton>

          <PrimaryButton
            className="text-small"
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
