// アプリ内トップページ
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import {
  KokoronDefault,
  SpeechBubble,
  PrimaryButton,
  HamburgerMenu,
  MenuItem,
  Spinner,
} from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function AppHomePage() {
  const { user, logout, login, isLoading } = useAuth();
  const { has_subscription, status, trial_expires_at, loading: subLoading, error } = useSubscription();
  const { todayEntry } = useTodayEntry();
  const router = useRouter();

 
  // サブスク未登録の場合のチェック
  const needsSubscription = !has_subscription || status === 'incomplete';
  // 初回セットアップが必要かチェック（サブスク登録済みの場合のみ）
  const needsSetup = !needsSubscription && !user?.nickname;

  useEffect(() => {
    // ローディング中は処理をスキップ
    if (subLoading) {
      console.log('ローディング中: 処理をスキップ');
      return;
    }
    
    console.log('=== useEffect デバッグ ===');
    console.log('needsSubscription:', needsSubscription);
    console.log('needsSetup:', needsSetup);
    console.log('has_subscription:', has_subscription);
    console.log('status:', status);
    console.log('========================');
    
    if (needsSubscription) {
      console.log('リダイレクト: /subscription');
      router.push('/subscription');
    } else if (needsSetup) {
      console.log('リダイレクト: /app/setup');
      router.push('/app/setup');
    }
  }, [needsSubscription, needsSetup, router, has_subscription, status, subLoading]); // ← subLoadingも追加


  // おしゃべりボタンが押された時の処理
  const handleStartEmotion = () => {
    router.push('/app/emotion-selection');
  };

  const handleViewTodayEntry = () => {
    router.push('/app/entries/today');
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
    router.push('/');
  };

  // ローディング中
  if (isLoading || subLoading) {
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
            onClick={handleLogin}
          >
            Googleでログイン
          </button>
        </div>
      </div>
    );
  }

  // サブスクリプション状態に応じたメッセージ
  const getStatusMessage = () => {
    if (subLoading) return '読み込み中...';

    if (!has_subscription) {
      return '7日間の無料体験中です！';
    }

    if (status === 'trialing') {
      const daysLeft = Math.ceil(
        (new Date(trial_expires_at!).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      );
      return `無料体験あと${daysLeft}日です`;
    }

    if (status === 'active') {
      return 'サブスクリプション会員です！';
    }

    return 'サブスクリプションに登録して全機能を使いましょう';
  };

  {
    /* メインコンテンツ */
  }
  const getSpeechBubbleText = () => {
    if (todayEntry) {
      return 'きょうも きもちを\nきろくしてくれて ありがとう！';
    }
    return 'きょうは どんな きもち？\nおしえて くださいね！';
  };

  // デバッグ情報を表示（一時的に）
  console.log('=== デバッグ情報 ===');
  console.log('has_subscription:', has_subscription);
  console.log('status:', status);
  console.log('trial_expires_at:', trial_expires_at);
  console.log('loading:', subLoading);
  console.log('error:', error);
  console.log('========================');

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu>
        <div style={{ padding: spacing.md, borderBottom: '1px solid #eee' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            {user?.nickname || 'ユーザー'}さん
          </p>
          <p
            style={{
              margin: 0,
              fontSize: fontSize.small,
              color: colors.text.secondary,
            }}
          >
            {getStatusMessage()}
          </p>
        </div>

        <MenuItem onClick={() => router.push('/app/entries/today')}>
          今日の記録
        </MenuItem>
        <MenuItem onClick={() => router.push('/app/voice')}>
          音声を録音
        </MenuItem>

        {/* サブスクリプション機能 */}
        {has_subscription || status === 'trialing' ? (
          <>
            <MenuItem onClick={() => router.push('/app/reports')}>
              詳細レポート
            </MenuItem>
            <MenuItem onClick={() => router.push('/app/roleplay')}>
              ロールプレイ
            </MenuItem>
          </>
        ) : (
          <MenuItem onClick={() => router.push('/subscription')}>
            サブスクリプションにアップグレード
          </MenuItem>
        )}

        <MenuItem onClick={() => router.push('/billing/manage')}>
          請求・解約
        </MenuItem>
        <MenuItem onClick={() => router.push('/help/billing')}>ヘルプ</MenuItem>
        <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
      </HamburgerMenu>

      <div style={commonStyles.page.mainContent}>
        <SpeechBubble text={getSpeechBubbleText()} />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={280} />
        </div>

        {/* メインアクション */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            alignItems: 'center',
            marginTop: spacing.xl,
          }}
        >
          {todayEntry ? (
            <>
              <PrimaryButton onClick={handleViewTodayEntry}>
                今日の記録を見る
              </PrimaryButton>
              <button
                onClick={handleStartEmotion}
                style={{
                  background: 'none',
                  border: `2px solid ${colors.primary}`,
                  color: colors.primary,
                  borderRadius: '25px',
                  padding: `${spacing.sm} ${spacing.lg}`,
                  fontSize: fontSize.base,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                新しく記録する
              </button>
            </>
          ) : (
            <PrimaryButton onClick={handleStartEmotion}>
              感情を記録する
            </PrimaryButton>
          )}
        </div>

        {/* サブスクリプション状態表示 */}
        {!has_subscription && (
          <div
            style={{
              marginTop: spacing.xl,
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.medium,
              padding: spacing.lg,
              textAlign: 'center',
              boxShadow: colors.shadow.light,
              border: `2px solid ${colors.primary}`,
            }}
          >
            <h3
              style={{
                color: colors.primary,
                fontSize: fontSize.base,
                fontWeight: 'bold',
                marginBottom: spacing.sm,
              }}
            >
              🎉 7日間無料体験中！
            </h3>
            <p
              style={{
                color: colors.text.secondary,
                fontSize: fontSize.small,
                marginBottom: spacing.md,
              }}
            >
              すべての機能を無料でお試しいただけます
            </p>
            <button
              onClick={() => router.push('/subscription')}
              style={{
                background: colors.primary,
                color: colors.text.white,
                border: 'none',
                borderRadius: '20px',
                padding: `${spacing.xs} ${spacing.md}`,
                fontSize: fontSize.small,
                cursor: 'pointer',
              }}
            >
              サブスクリプションプランについて
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
