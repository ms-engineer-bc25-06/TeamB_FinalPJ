'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { KokoronDefault, SpeechBubble, Spinner, HamburgerMenu } from '@/components/ui';
import { commonStyles, colors, spacing, fontSize, borderRadius, animation } from '@/styles/theme';
import { useState } from 'react';

export default function EmotionEducationPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('what');

  const handleBack = () => {
    router.push('/app');
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
    router.push('/');
    return null;
  }

  const educationContent = {
    what: {
      title: '感情教育とは？',
      content: `感情教育は、子どもたちが自分の感情を理解し、適切に表現し、コントロールする力を育てる教育です。

感情教育の目的は以下の通りです。

• 感情を識別し、理解を深めること
• 感情の適切な表現方法を学ぶこと
• 感情の自己調整能力を身につけること
• 他者の感情への共感力を育てること

これらは、子どもの社会性や精神的な健康に大きく影響します。`
    },
    importance: {
      title: 'なぜ感情教育が大切？',
      content: `現代社会では、感情を抑圧したり、適切に表現できない子どもが増えています。

感情教育の効果として以下のような例があります。

• ストレス耐性の向上
• 人間関係の改善
• 学習意欲の向上
• 問題解決能力の育成
• メンタルヘルスの維持

感情教育に取り組むことで、生き抜く力を身につけることが期待され、子どもの将来の成功と幸福につながると考えられています。`

    }, 
    how: {
      title: 'どうやって育てる？',
      content: `感情教育は、日常の小さな積み重ねで実現できます。

具体的な方法としては以下のようなことが挙げられます。

• 感情の名前を教える
• 感情を表現する機会を作る
• 感情を受け止める
• 感情の理由を聞く
• 感情の対処法を一緒に考える

このアプリは、そんな感情教育を楽しく続けられるツールです。`
    }
  };

  const currentContent = educationContent[activeSection as keyof typeof educationContent];

  return (
    <div style={commonStyles.page.container}>
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      {/* 左上の戻るボタン */}
      <button onClick={handleBack} style={{
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
        padding: '20px',
        zIndex: 50,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '600px',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        {/* タイトル */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: '40px 0 20px 0',
          color: '#333',
        }}>
          感情教育について
        </h1>

        {/* ナビゲーションタブ */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
        }}>
          {Object.entries(educationContent).map(([key, content]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                background: activeSection === key ? colors.primary : colors.background.light,
                color: activeSection === key ? colors.text.white : colors.text.primary,
                border: activeSection === key ? 'none' : `1px solid ${colors.border.light}`,
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
              }}
            >
              {content.title}
            </button>
          ))}
        </div>

        {/* コンテンツ表示 */}
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <h2 style={{
            fontSize: fontSize.xl,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: spacing.md,
            textAlign: 'center',
          }}>
            {currentContent.title}
          </h2>
          
          <div style={{ textAlign: 'left' }}>
            <SpeechBubble text={currentContent.content} />
          </div>
        </div>

        {/* こころん */}
        <div style={{ margin: '20px 0 0 0' }}>
          <KokoronDefault size={200} />
        </div>

        {/* 次のステップ */}
        <div style={{
          textAlign: 'center',
          marginTop: spacing.lg,
        }}>
          <button
            onClick={() => router.push('/app/emotion-selection')}
            style={{
              ...commonStyles.button.base,
              ...commonStyles.button.primary,
              fontSize: '25px',
              padding: '30px 60px',
              minWidth: '240px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.primaryHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,107,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = colors.shadow.medium;
            }}
          >
            感情記録を始める
          </button>
        </div>
      </div>
    </div>
  );
}
