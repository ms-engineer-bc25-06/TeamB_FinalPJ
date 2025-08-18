'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { commonStyles } from '@/styles/theme';

export default function EmotionConfirmationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ローディング中（認証）
  if (isLoading) {
    return (
      <div style={commonStyles.loading.container}>
        <p>読み込み中...</p>
      </div>
    );
  }

  // ログインしていない場合
  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div style={commonStyles.page.container}>
      {/* 左上の戻るボタン */}
      <button style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '6px',
        color: '#000000',
        zIndex: 200,
        fontWeight: 'bold',
      }}>
        ← もどる
      </button>

      {/* メインコンテンツ */}
      <div style={{
        position: 'fixed',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        padding: '10px 0 0 0',
        zIndex: 50,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '600px',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
        background: 'transparent',
        gap: '20px',
      }}>
        {/* 感情確認画面の内容は後で実装 */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
          width: '80%',
          maxWidth: '400px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '0 0 16px 0',
            color: '#333',
          }}>
            感情確認画面
          </h2>
          <p style={{
            fontSize: '16px',
            margin: '0 0 20px 0',
            color: '#666',
            lineHeight: 1.5,
          }}>
            この画面の実装は後で追加予定です
          </p>
        </div>
      </div>
    </div>
  );
}
