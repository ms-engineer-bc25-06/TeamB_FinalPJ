'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface TodayEntry {
  id: string;
  date: string;
  emotion: string;
  intensity: number;
  audioUrl?: string;
  transcript?: string;
  createdAt: string;
}

export function useTodayEntry() {
  const { user } = useAuth();
  const [todayEntry, setTodayEntry] = useState<TodayEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTodayEntry(null);
      setIsLoading(false);
      return;
    }

    const fetchTodayEntry = async () => {
      try {
        // ダミーの今日の記録
        const today = new Date().toISOString().split('T')[0];
        const dummyEntry: TodayEntry = {
          id: 'entry_dummy',
          date: today,
          emotion: '嬉しい',
          intensity: 4,
          transcript: '今日は友達と遊んで楽しかった！',
          createdAt: new Date().toISOString(),
        };

        // 50%の確率で今日の記録があることにする
        if (Math.random() > 0.5) {
          setTodayEntry(dummyEntry);
        } else {
          setTodayEntry(null);
        }
      } catch (error) {
        console.error('今日の記録取得エラー:', error);
        setTodayEntry(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayEntry();
  }, [user]);

  return { todayEntry, isLoading };
}
