'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  has_subscription: boolean;
  status: 'none' | 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled';
  is_trial: boolean;
  is_paid: boolean;
  trial_expires_at?: string;
  stripe_subscription_id?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      // ダミーのサブスクリプション状態（実際のAPIが実装されるまでの仮実装）
      const dummySubscription: SubscriptionStatus = {
        has_subscription: true,
        status: 'trialing',
        is_trial: true,
        is_paid: false,
        trial_expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        stripe_subscription_id: 'sub_dummy',
      };
      setSubscription(dummySubscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    fetchSubscriptionStatus();
  }, [user]);

  return {
    has_subscription: subscription?.has_subscription || false,
    status: subscription?.status || 'none',
    is_trial: subscription?.is_trial || false,
    is_paid: subscription?.is_paid || false,
    trial_expires_at: subscription?.trial_expires_at || null,
    stripe_subscription_id: subscription?.stripe_subscription_id,
    loading,
    error,
    refetch: fetchSubscriptionStatus,
  };
};
