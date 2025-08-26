'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useChildren';
import { updateChildProfile } from '@/lib/api';
import {
  KokoronDefault,
  SpeechBubble,
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

export default function SettingsPage() {
  const { user, firebaseUser, isLoading: authLoading, logout } = useAuth();
  const { children, loading: childrenLoading } = useChildren();
  const router = useRouter();

  const [childName, setChildName] = useState('');
  const [childBirthYear, setChildBirthYear] = useState('');
  const [childBirthMonth, setChildBirthMonth] = useState('');
  const [childBirthDay, setChildBirthDay] = useState('');
  const [childGender, setChildGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 既存の子供の情報をフォームに設定
  useEffect(() => {
    if (children.length > 0) {
      const child = children[0]; // 最初の子供の情報を使用
      setChildName(child.nickname);

      // 誕生日を分解して設定
      const birthDate = new Date(child.birth_date);
      setChildBirthYear(birthDate.getFullYear().toString());
      setChildBirthMonth(
        (birthDate.getMonth() + 1).toString().padStart(2, '0'),
      );
      setChildBirthDay(birthDate.getDate().toString().padStart(2, '0'));

      setChildGender(child.gender);
    }
  }, [children]);

  // 戻るボタンの処理
  const handleBack = () => {
    router.push('/app');
  };

  // ログアウト処理
  const handleLogout = async () => {
    await logout();
  };

  // ローディング中（認証）
  if (authLoading || childrenLoading) {
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

  // 子供の情報がない場合はセットアップへリダイレクト
  if (children.length === 0) {
    router.push('/app/setup');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !childName.trim() ||
      !childBirthYear ||
      !childBirthMonth ||
      !childBirthDay ||
      !childGender
    )
      return;

    setIsSubmitting(true);
    try {
      // 誕生日をDate型に変換
      const birthDate = new Date(
        parseInt(childBirthYear),
        parseInt(childBirthMonth) - 1,
        parseInt(childBirthDay),
      );

      // プロフィール情報を更新
      console.log('プロフィール更新:', {
        childName,
        birthDate: birthDate.toISOString().split('T')[0], // YYYY-MM-DD形式
        childGender,
      });

      if (firebaseUser && children.length > 0) {
        const childData = {
          nickname: childName,
          birth_date: birthDate.toISOString().split('T')[0], // YYYY-MM-DD形式
          gender: childGender,
        };

        await updateChildProfile(children[0].id, childData, firebaseUser);
        console.log('子どもプロフィール更新完了');

        // 成功メッセージを表示
        alert('設定を保存しました！');
        router.push('/app');
      } else {
        throw new Error('Firebase user or child not found');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={commonStyles.page.container}>
      <HamburgerMenu>
        <MenuItem onClick={handleBack}>ホームに戻る</MenuItem>
        <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
      </HamburgerMenu>

      {/* ← もどる */}
      <p
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: spacing.xl,
          left: spacing.xl,
          fontSize: fontSize.large,
          color: colors.text.primary,
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 200,
        }}
      >
        ← もどる
      </p>

      <div style={commonStyles.page.mainContent}>
        <SpeechBubble text="お子さんの情報を編集できます！" />

        <div style={commonStyles.page.kokoronContainer}>
          <KokoronDefault size={200} />
        </div>

        <div
          style={{
            backgroundColor: colors.background.white,
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: colors.shadow.heavy,
            maxWidth: '400px',
            width: '100%',
            margin: `${spacing.lg} 0`,
          }}
        >
          <h1
            style={{
              color: colors.text.primary,
              fontSize: fontSize.xl,
              fontWeight: 'bold',
              marginBottom: spacing.lg,
              textAlign: 'center',
            }}
          >
            お子さんの情報
          </h1>

          <form onSubmit={handleSubmit}>
            {/* 名前 */}
            <div style={{ marginBottom: spacing.lg }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.base,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                おなまえ
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="例: たろう"
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  fontSize: fontSize.xl,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.xl }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                おたんじょうび
              </label>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                {/* 年選択 */}
                <select
                  value={childBirthYear}
                  onChange={(e) => setChildBirthYear(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    fontSize: fontSize.xl,
                    outline: 'none',
                    backgroundColor: colors.background.white,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">年</option>
                  {Array.from(
                    { length: 18 },
                    (_, i) => new Date().getFullYear() - i,
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>

                {/* 月選択 */}
                <select
                  value={childBirthMonth}
                  onChange={(e) => setChildBirthMonth(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    fontSize: fontSize.xl,
                    outline: 'none',
                    backgroundColor: colors.background.white,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">月</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option
                      key={month}
                      value={month.toString().padStart(2, '0')}
                    >
                      {month}月
                    </option>
                  ))}
                </select>

                {/* 日選択 */}
                <select
                  value={childBirthDay}
                  onChange={(e) => setChildBirthDay(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.medium,
                    fontSize: fontSize.xl,
                    outline: 'none',
                    backgroundColor: colors.background.white,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">日</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day.toString().padStart(2, '0')}>
                      {day}日
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: spacing.xl }}>
              <label
                style={{
                  display: 'block',
                  color: colors.text.primary,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  marginBottom: spacing.sm,
                }}
              >
                せいべつ
              </label>
              <select
                value={childGender}
                onChange={(e) => setChildGender(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: spacing.md,
                  border: `2px solid ${colors.primary}`,
                  borderRadius: borderRadius.medium,
                  fontSize: fontSize.xl,
                  outline: 'none',
                  backgroundColor: colors.background.white,
                  boxSizing: 'border-box',
                }}
              >
                <option value="">せいべつ（こたえなくてもOKだよ）</option>
                {['おとこのこ', 'おんなのこ', 'こたえない'].map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                disabled={!childName.trim() || isSubmitting}
                style={{
                  background: colors.primary,
                  color: colors.text.white,
                  border: 'none',
                  borderRadius: borderRadius.button,
                  padding: `${spacing.md} ${spacing.xl}`,
                  fontSize: fontSize.xl,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minWidth: '200px',
                }}
              >
                {isSubmitting ? '保存中...' : '保存する'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
