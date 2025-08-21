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
      content: `感情教育とは、<strong>感情を理解し、適切に表現し、コントロールする力を育てる教育</strong>のことです。<br><br>🧩 感情教育の目的<br><br>🎯 自分の感情を正確に認識できるようになる<br>🛠️ 感情を適切に表現できるようになる<br>🤝 他者の感情を理解し、共感できるようになる<br>❤️ 感情をコントロールし、適切な行動を選択できるようになる<br><br>これらは、<strong>健全な心の発達と社会性の育成</strong>に不可欠な要素です。`
    },
    importance: {
      title: '感情教育の重要性',
      content: `### 🌱 心の発達・人格形成に不可欠<br><br>- 感情の理解と表現が、<strong>健全な人格形成の土台</strong>になる。<br><br>### 🗣️ コミュニケーション力の向上<br><br>- 自分の感情を適切に表現し、<strong>他者との関係を築く力</strong>が身につく。<br>- 感情の言語化により、より深い理解と信頼関係が生まれる。<br><br>### 💪 ストレス対処力の向上<br><br>- 感情をコントロールする力が、<strong>ストレスや困難への対応力</strong>として働く。<br><br>### 🎓 学習効果の向上<br><br>- 感情が安定することで、<strong>集中力や学習意欲</strong>が向上する。`
    },
    methods: {
      title: '感情教育の方法',
      content: `- 🏡 <strong>家庭での関わり</strong>：感情を言語化する習慣、共感を持った対話<br>- 🎨 <strong>遊びや体験活動</strong>：感情カード遊び、ロールプレイ、絵本の読み聞かせ<br>- 🧸 <strong>日常のやりとり</strong>：感情の名前を教える、感情の理由を聞く<br>- 📊 <strong>感情記録</strong>：日々の感情を記録し、パターンを理解する<br><br>感情教育は、<strong>継続的な取り組み</strong>が大切です。お子様のペースに合わせて、無理なく進めていきましょう。`
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

        {/* こころん */}
        <div style={{ margin: '20px 0' }}>
          <KokoronDefault size={120} />
        </div>

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
                background: activeSection === key ? '#4CAF50' : '#f0f0f0',
                color: activeSection === key ? 'white' : '#333',
                border: 'none',
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
        <div style={{
          ...commonStyles.card,
          width: '100%',
          maxWidth: '500px',
          minHeight: '400px',
        }}>
          <h2 style={{
            fontSize: fontSize.xl,
            fontWeight: 'bold',
            color: colors.text.primary,
            marginBottom: spacing.md,
            textAlign: 'center',
          }}>
            {currentContent.title}
          </h2>
          
          <div 
            style={{
              fontSize: fontSize.small,
              color: colors.text.primary,
              lineHeight: '1.6',
              marginBottom: spacing.lg,
            }}
            dangerouslySetInnerHTML={{ __html: currentContent.content }}
          />
        </div>

        {/* 次のステップ */}
        <div style={{
          textAlign: 'center',
          marginTop: spacing.lg,
        }}>
          <button
            onClick={() => router.push('/app/emotion-selection')}
            style={{
              ...commonStyles.button.primary,
              padding: `${spacing.md} ${spacing.lg}`,
              fontSize: fontSize.small,
              transition: animation.transition,
            }}
          >
            感情記録を始める
          </button>
        </div>
      </div>
    </div>
  );
}
