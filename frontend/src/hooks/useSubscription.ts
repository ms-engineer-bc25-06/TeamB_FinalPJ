'use client';

import { useState, useEffect } from 'react';
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

  const fetchSubscriptionStatus = async () => {
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
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [firebaseUser]);

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
