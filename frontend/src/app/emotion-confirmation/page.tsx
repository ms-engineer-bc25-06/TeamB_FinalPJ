'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui';
import { commonStyles } from '@/styles/theme';

export default function EmotionConfirmationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/emotion-selection');
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
    router.push('/');
    return null;
  }

  return (
    <div style={commonStyles.page.container}>
      {/* ヘッダー */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px',
        backdropFilter: 'blur(10px)',
        zIndex: 100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
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
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
          }}>
            感情確認画面
          </h1>
          <div style={{ width: '50px' }}></div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        padding: '20px',
        zIndex: 50,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 120px)',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#333',
            marginBottom: '16px',
          }}>
            感情確認画面
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '24px',
          }}>
            選択された感情: {searchParams.get('emotion') || 'なし'}
          </p>
          <p style={{
            fontSize: '14px',
            color: '#999',
          }}>
            この画面の実装は後で追加予定です
          </p>
        </div>
      </div>
    </div>
  );
} 