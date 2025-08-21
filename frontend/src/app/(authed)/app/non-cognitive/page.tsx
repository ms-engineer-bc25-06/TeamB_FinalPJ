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
      content: `非認知能力とは、<strong>テストの点数やIQなどでは測れない、人間の内面的な力</strong>のことで、具体的には、以下のような<strong>意欲・感情・社会性</strong>に関わるスキルが含まれます。<br><br>🧩 非認知能力に含まれる力<br><br>🎯 目標に向かって粘り強く取り組む力（やり抜く力）<br>🛠️ 状況に応じて工夫し行動を調整する力（柔軟性、自己調整力）<br>🤝 他者と協力して取り組む力（共感力、協調性、コミュニケーション）<br>❤️ 感情のコントロールと自己肯定感（情動制御、自尊感情）<br><br>これらは、「<strong>学びに向かう力・人間性</strong>」として認識され、<strong>「知識・技能」「思考力・判断力・表現力」</strong>と並ぶ重要な教育目標とされています。`
    },
    importance: {
      title: '非認知能力の重要性',
      content: `### 🌱 心の発達・人格形成に不可欠<br><br>- 自己肯定感や情動のコントロール力が、<strong>健全な人格形成の土台</strong>になる。<br><br>### 🗣️ 社会生活の基盤<br><br>- 他者との関係を築き、<strong>信頼や協力を生むコミュニケーション力</strong>の基礎に。<br>- チームでの活動や集団生活でも適応しやすくなる。<br><br>### 💪 レジリエンスと問題解決力<br><br>- ストレスや困難に直面した時も、<strong>感情をコントロールし柔軟に対応する力</strong>として働く。<br><br>### 🎓 長期的な成功・幸福感に寄与<br><br>- 学業成績や職業的な成功だけでなく、<strong>生涯を通じた幸福感や社会的適応力</strong>にまで影響！`
    },
    development: {
      title: 'どうやって育つの？',
      content: `- 🏡 <strong>家庭での関わり</strong>：共感を持った対話や、感情を言語化する習慣<br>- 🎨 <strong>遊びや体験活動</strong>：ロールプレイ、感情カード遊び、集団遊びなど<br>- 🧸 <strong>日常のやりとり</strong>：小さな挑戦や失敗体験を通じて、「自分で考える力」が育つ<br>- 📊 「21世紀出生児縦断調査」などでも、<strong>幼児期の体験活動が非認知能力の発達に直結する</strong>ことが明らかになっています。`
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
        top: spacing.lg,
        left: spacing.lg,
        background: 'none',
        border: 'none',
        fontSize: fontSize.base,
        cursor: 'pointer',
        padding: spacing.sm,
        borderRadius: borderRadius.small,
        color: colors.text.primary,
        zIndex: 200,
        fontWeight: 'bold',
        transition: animation.transition,
      }}>
        ← もどる
      </button>

      {/* メインコンテンツ */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 0,
        padding: spacing.lg,
        zIndex: 50,
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '370px',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.lg,
      }}>
        {/* タイトル */}
        <h1 style={{
          fontSize: fontSize.xxl,
          fontWeight: 'bold',
          textAlign: 'center',
          margin: `${spacing.xl} 0 ${spacing.lg} 0`,
          color: colors.text.primary,
        }}>
          非認知能力について
        </h1>

        {/* こころん */}
        <div style={{ margin: `${spacing.lg} 0` }}>
          <KokoronDefault size={120} />
        </div>

        {/* ナビゲーションタブ */}
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          marginBottom: spacing.lg,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {Object.entries(nonCognitiveContent).map(([key, content]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              style={{
                background: activeSection === key ? colors.primary : '#f0f0f0',
                color: activeSection === key ? colors.text.white : colors.text.primary,
                border: 'none',
                borderRadius: borderRadius.button,
                padding: `${spacing.sm} ${spacing.md}`,
                fontSize: fontSize.small,
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: animation.transition,
                whiteSpace: 'nowrap',
                boxShadow: activeSection === key ? colors.shadow.medium : 'none',
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
          maxWidth: '400px',
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
            onClick={() => router.push('/app・')}
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
