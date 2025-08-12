'use client';

import { useCallback, useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '@/contexts/AuthContext';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function SubscriptionButton() {
  const { firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribeClick = useCallback(async () => {
    if (!firebaseUser) {
      alert('ログインしてください。');
      return;
    }
    setIsLoading(true);

    try {
      // 1) Firebaseの最新IDトークン
      const idToken = await firebaseUser.getIdToken(true);

      // 2) Checkout Session 作成（sessionId を受け取る想定）
      const res = await fetch(
        `${API_BASE_URL}/api/v1/stripe/checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(
          `Failed to create checkout session: ${msg || res.status}`,
        );
      }

      const data: { sessionId?: string } = await res.json();
      if (!data.sessionId) {
        throw new Error('Response does not include sessionId');
      }

      // 3) Stripe.jsでリダイレクト
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Subscription error:', err);
      alert('決済ページの作成に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser]);

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleSubscribeClick}
      disabled={isLoading}
    >
      {isLoading ? <CircularProgress size={24} /> : '7日間無料で試す'}
    </Button>
  );
}
