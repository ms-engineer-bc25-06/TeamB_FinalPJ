//NOTE: ドメイン別関数をこちらでまとめる。
import { loadStripe } from '@stripe/stripe-js';

// Stripe決済検証関数
export const verifyPayment = async (sessionId: string) => {
  try {

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stripe/session-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// チェックアウトセッション作成関数
export const createCheckoutSession = async (idToken: string) => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    
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

    return data.sessionId;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error;
  }
};

// Stripeリダイレクト関数
export const redirectToStripeCheckout = async (sessionId: string) => {
  const stripe = await loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  );
  
  if (!stripe) {
    throw new Error('Stripe.js failed to initialize');
  }

  const { error } = await stripe.redirectToCheckout({
    sessionId,
  });

  if (error) {
    throw error;
  }
};

// サブスクリプション状態取得
export const getSubscriptionStatus = async () => {
};
