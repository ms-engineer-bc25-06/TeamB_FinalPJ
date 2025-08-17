// 公開トップページ
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  KokoronDefault,
  SpeechBubble,
  PrimaryButton,
  Spinner,
} from '@/components/ui';
import {
  colors,
  commonStyles,
  spacing,
  fontSize,
  borderRadius,
} from '@/styles/theme';

export default function LandingPage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // ログイン済みの場合はアプリに遷移
  if (user) {
    router.push('/app');
    return null;
  }

  const handleLogin = async () => {
    setIsLoginLoading(true);
    try {
      await login();
      router.push('/app');
    } catch (error) {
      console.error('ログインエラー:', error);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleStartFreeTrial = () => {
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <Spinner size="medium" />
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div style={commonStyles.page.container}>
      <div style={commonStyles.page.mainContent}>
        {/* ヒーローセクション */}
        <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: colors.text.primary,
              marginBottom: spacing.lg,
              lineHeight: 1.2,
            }}
          >
            こころんと一緒に
            <br />
            感情を育もう
          </h1>

          <p
            style={{
              fontSize: fontSize.large,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              lineHeight: 1.6,
              maxWidth: '400px',
              margin: `0 auto ${spacing.xl} auto`,
            }}
          >
            AIパートナー「こころん」が、お子さまの感情教育をサポートします。
            まずは7日間無料でお試しください。
          </p>
        </div>

        {/* こころんキャラクター */}
        <SpeechBubble text="はじめまして！\nいっしょに きもちを たんけんしよう！" />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={280} />
        </div>

        {/* CTA ボタン */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md,
            alignItems: 'center',
            marginTop: spacing.xl,
          }}
        >
          <PrimaryButton
            onClick={handleStartFreeTrial}
            disabled={isLoginLoading}
          >
            {isLoginLoading ? '処理中...' : '7日間無料で始める'}
          </PrimaryButton>

          <button
            onClick={handleLogin}
            style={{
              background: 'none',
              border: `2px solid ${colors.primary}`,
              color: colors.primary,
              borderRadius: '25px',
              padding: `${spacing.sm} ${spacing.lg}`,
              fontSize: fontSize.base,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '200px',
            }}
            disabled={isLoginLoading}
          >
            すでにアカウントをお持ちの方
          </button>
        </div>

        {/* 特徴紹介 */}
        <div
          style={{
            marginTop: spacing.xxl,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing.lg,
            maxWidth: '800px',
            width: '100%',
          }}
        >
          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.medium,
              padding: spacing.lg,
              textAlign: 'center',
              boxShadow: colors.shadow.light,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>🎯</div>
            <h3
              style={{ color: colors.text.primary, marginBottom: spacing.sm }}
            >
              感情を理解する
            </h3>
            <p
              style={{ color: colors.text.secondary, fontSize: fontSize.small }}
            >
              AIが子どもの感情を分析し、適切なサポートを提供します
            </p>
          </div>

          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.medium,
              padding: spacing.lg,
              textAlign: 'center',
              boxShadow: colors.shadow.light,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>📊</div>
            <h3
              style={{ color: colors.text.primary, marginBottom: spacing.sm }}
            >
              成長を記録
            </h3>
            <p
              style={{ color: colors.text.secondary, fontSize: fontSize.small }}
            >
              日々の感情の変化を記録し、成長の軌跡を可視化します
            </p>
          </div>

          <div
            style={{
              backgroundColor: colors.background.white,
              borderRadius: borderRadius.medium,
              padding: spacing.lg,
              textAlign: 'center',
              boxShadow: colors.shadow.light,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>🎭</div>
            <h3
              style={{ color: colors.text.primary, marginBottom: spacing.sm }}
            >
              楽しく学習
            </h3>
            <p
              style={{ color: colors.text.secondary, fontSize: fontSize.small }}
            >
              ゲーム感覚で感情について学び、表現力を育みます
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
