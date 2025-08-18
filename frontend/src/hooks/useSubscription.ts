'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Subscription {
  id: string;
  status: 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled';
  trial_end?: string;
  current_period_end: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        // ダミーのサブスクリプション状態
        const dummySubscription: Subscription = {
          id: 'sub_dummy',
          status: 'trialing',
          trial_end: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          current_period_end: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        };
        setSubscription(dummySubscription);
      } catch (error) {
        console.error('サブスクリプション取得エラー:', error);
        setSubscription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return { subscription, isLoading };
}
