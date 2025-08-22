'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { KokoronDefault, SpeechBubble, Spinner, HamburgerMenu } from '@/components/ui';
import { commonStyles, colors, spacing, fontSize, borderRadius, animation } from '@/styles/theme';
import { useState } from 'react';

export default function UsagePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('purpose');

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

  const usageContent = {
    purpose: {
      title: 'アプリの目的・特徴',
      content: `### 🎯 アプリの目的・特徴

このアプリは感情教育・非認知能力の育成を目的としています。お子様自身が感情を選び、理由や強さも記録でき、保護者のみなさまも見守りやすいように設計してあります。`
    },
    daily: {
      title: '毎日の流れ',
      content: `### 📅 毎日の流れ

#### こどもたち

1. そのときの気持ちを感情カードから選択
2. 感情の強さを選択
3. マイクでいまの気持ちの理由を録音

#### 保護者

1. 子どもの感情記録を確認
2. 週単位での感情の変化を週次レポートで把握

### 効果的なタイミング
一日一回、以下のようなタイミングでご利用ください。

- 登園前: 一日の始まりの気持ちを確認
- 帰宅後: 一日の振り返りと気持ちの整理
- 寝る前: 一日の感情を振り返る習慣作り`
    },
    cards: {
      title: '感情カード',
      content: `### 🃏 感情カード

お子様がそのときの気持ちをカードから選びます。表情や言葉で気持ちを表現する練習になります。

### カードの特徴

- 視覚的な表現: 表情や色で感情が分かりやすく表示されています。
- 感情の種類: 喜び、悲しみ、怒り、驚きなど多様な感情を選ぶことができます。
- 言葉の練習: 感情の名前を覚える機会になります。

### 活用のポイント
登園前や帰宅後、寝る前などのタイミングで活用すると効果的です。`
    },
    intensity: {
      title: '感情の強さ',
      content: `### ⭐ 感情の強さ

気持ちの強さを表情の変化から視覚的に選択することができます。

### 強さの表現方法

- レベル1: 弱い気持ち（薄い色）
- レベル2: 中程度の気持ち（中間の色）
- レベル3: 強い気持ち（濃い色）

#### 効果的な使い方

- 感情の段階: 同じ感情でも強さが違うことを学ぶことができます。
- 自己認識: 自分の感情の強さを客観的に把握する練習ができます。`
    },
    voice: {
      title: '理由を話す',
      content: `### 🎙️ 理由を話す

マイクで気持ちの理由を話します。保護者の皆様は見守るだけでOKです。

### 音声録音のポイント

- 子どものペース: 無理に話させず、自然な流れで話せるようにしましょう。
- 保護者の見守り: 話を聞くだけで、アドバイスは控えめにしましょう。
- 感情の言語化: 気持ちを言葉にする練習ができます。`
    },
    roleplay: {
      title: 'ロールプレイ',
      content: `### 🎭 ロールプレイ

日常で起こるさまざまな場面を「もしものお話あそび」で体験し、気持ちや行動の選び方を練習します。

### ロールプレイの効果

- 感情の理解: 様々な感情を体験的に学ぶことができます。
- 共感力: 相手の気持ちを考える力を育てることができます。
- 問題解決力: 困難な場面での対応方法を練習することができます。

### 親子での活用方法

感情の伝え方や行動の選び方を親子で一緒に話し合いましょう。`

    },
    report: {
      title: 'レポート',
      content: `### 📝 レポート

日々の選んだ気持ちと音声を振り返ることができます。感情の変化や傾向を見える化し、子育ての振り返りに役立ちます。

### 子育てでの活用

- 感情の変化: 子どもの感情の移り変わりを視覚的に捉えることができます。
- 成長の確認: 感情表現の上達を実感することができます。
- 親子の会話: レポートを見ながら振り返り、感情の変化を一緒に考えることができます。

### ご利用方法例

週末のゆったりとした時間にお子様と一緒に一週間を振り返ってみましょう。`

    }
  };

  const currentContent = usageContent[activeSection as keyof typeof usageContent];

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
          使い方
        </h1>

        {/* ナビゲーションタブ */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {Object.entries(usageContent).map(([key, content]) => (
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
                whiteSpace: 'nowrap',
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
