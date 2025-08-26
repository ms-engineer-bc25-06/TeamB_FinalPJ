// アプリ内トップページ
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useTodayEntry } from '@/hooks/useTodayEntry';
import { useChildren } from '@/hooks/useChildren';
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
  const { has_subscription, status, is_trial, trial_expires_at, loading: subLoading, error } = useSubscription();
  const { todayEntry } = useTodayEntry();
  const { children, loading: childrenLoading } = useChildren();
  const router = useRouter();

 
  // サブスク未登録の場合のチェック
  const needsSubscription = !has_subscription || status === 'incomplete';

  // childrenのニックネームがあるかどうかで判定
  const needsSetup = !needsSubscription && children.length === 0;

  useEffect(() => {
    // ローディング中は処理をスキップ
    if (subLoading || childrenLoading) {
      console.log('ローディング中: 処理をスキップ');
      return;
    }
    
    console.log('=== useEffect デバッグ ===');
    console.log('needsSubscription:', needsSubscription);
    console.log('needsSetup:', needsSetup);
    console.log('has_subscription:', has_subscription);
    console.log('status:', status);
    console.log('children count:', children.length);
    console.log('========================');
    
    if (needsSubscription) {
      console.log('リダイレクト: /subscription');
      router.push('/subscription');
    } else if (needsSetup) {
      console.log('リダイレクト: /app/setup');
      router.push('/app/setup');
    }
  }, [needsSubscription, needsSetup, router, has_subscription, status, subLoading, childrenLoading, children.length]); // childrenLoadingとchildren.lengthも追加


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
  if (isLoading || subLoading || childrenLoading) {
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

  {
    /* メインコンテンツ */
  }
  const getSpeechBubbleText = () => {
    return `${children[0]?.nickname || ''}、\n\nきょうも いっしょに きもちを \n\nたんけんしよう！`;
  };

  // デバッグ情報を表示（一時的に）
  console.log('=== デバッグ情報 ===');
  console.log('has_subscription:', has_subscription);
  console.log('status:', status);
  console.log('trial:', is_trial);
  console.log('trial_expires_at:', trial_expires_at);
  console.log('loading:', subLoading);
  console.log('error:', error);
  console.log('========================');

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />
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
                きょうのきろく
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
                もういちどきろくする
              </button>
            </>
          ) : (
            <PrimaryButton onClick={handleStartEmotion}>
              きもちをきろくする
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
