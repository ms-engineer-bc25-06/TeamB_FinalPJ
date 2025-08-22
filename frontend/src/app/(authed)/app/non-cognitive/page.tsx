'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { KokoronDefault, SpeechBubble, Spinner, HamburgerMenu } from '@/components/ui';
import { commonStyles, colors, spacing, fontSize, borderRadius, animation } from '@/styles/theme';
import { useState } from 'react';

export default function NonCognitivePage() {
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

  const nonCognitiveContent = {
    what: {
      title: '非認知能力とは？',
      content: `テストの点数やIQなどでは測れない、人間の内面的な力のことで、具体的には、以下のような意欲・感情・社会性に関わるスキルが含まれます。

### 🎯 目標に向かって粘り強く取り組む力
### 🛠️ 状況に応じて工夫し行動を調整する力
### 🤝 他者と協力して取り組む力
### ❤️ 感情のコントロールと自己肯定感

これらは、「学びに向かう力・人間性」として認識され、「知識・技能」「思考力・判断力・表現力」と並ぶ重要な教育目標とされています。`
    },
    importance: {
      title: '非認知能力の重要性',
      content: `### 🌱 心の発達・人格形成に不可欠

自己肯定感や感情のコントロール力は、健全な人格を育てる土台になります。

### 🗣️ 社会生活の基盤

他者との関係を築き、信頼や協力を生むコミュニケーション力の基礎となります。
チームでの活動や集団生活でも、適応しやすくなります。

### 💪 レジリエンスと問題解決力

ストレスや困難に直面したときも、感情をコントロールして柔軟に対応する力として役立ちます。

### 🎓 長期的な成功・幸福感に寄与

学業や仕事での成果だけでなく、生涯を通しての幸福感や社会的適応力にも影響します。`

    },
    development: {
      title: 'どうやって育つの？',
      content: `### 🏡 家庭での関わり

家庭での会話がとても大切です。子どもが「かなしい」や「うれしい」など自分の気持ちを言葉で表せるように、**共感を持って話しかけて**ください。

### 🎨 遊びや体験活動

ごっこ遊びや感情カードを使った遊び、お友だちとの集団遊びを通して、「**相手はどう思っているのだろう？**」と考える力が育ちます。

### 🧸 日常のやりとり

小さな挑戦や失敗を経験することも重要です。「**こうしたらうまくいくかな？**」と自分で考えて行動する力が身についていきます。`
    }
  };

  const currentContent = nonCognitiveContent[activeSection as keyof typeof nonCognitiveContent];

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
          非認知能力について
        </h1>

        {/* ナビゲーションタブ */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
        }}>
          {Object.entries(nonCognitiveContent).map(([key, content]) => (
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
          
          <SpeechBubble text={currentContent.content} />
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
