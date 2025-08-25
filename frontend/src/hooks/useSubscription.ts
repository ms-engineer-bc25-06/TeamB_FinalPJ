'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  is_trial: boolean;
  is_paid: boolean;
  trial_expires_at: string | null;
  stripe_subscription_id?: string;
}

export const useSubscription = () => {
  const { firebaseUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!firebaseUser) return;
    
    try {
      const idToken = await firebaseUser.getIdToken();
      const response = await fetch('http://localhost:8000/api/v1/stripe/subscription/status', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      
      const data = await response.json();
      
      // デバッグ情報をコンソールに出力
      console.log('=== サブスクリプション状態デバッグ ===');
      console.log('Response data:', data);
      console.log('has_subscription:', data.has_subscription);
      console.log('status:', data.status);
      console.log('is_trial:', data.is_trial);
      console.log('trial_expires_at:', data.trial_expires_at);
      console.log('Current time:', new Date().toISOString());
      if (data.trial_expires_at) {
        const trialExpires = new Date(data.trial_expires_at);
        const now = new Date();
        console.log('Trial expires:', trialExpires.toISOString());
        console.log('Is trial active (calculated):', now < trialExpires);
      }
      console.log('=====================================');
      
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

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
