//NOTE: ドメイン別関数をこちらでまとめる。
import { loadStripe } from '@stripe/stripe-js';
import { User } from 'firebase/auth';

// Stripe決済検証関数
export const verifyPayment = async (sessionId: string, firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true); 
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/stripe/session-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, 
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

// 子どものプロフィール作成
export const createChild = async (
  childData: {
    nickname: string;
    birth_date: string; // YYYY-MM-DD形式
    gender: string;
  },
  firebaseUser: User
) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/children`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(childData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Create child error:', error);
    throw error;
  }
};

// ユーザーに紐づく子どものリスト取得
export const getChildren = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/children`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get children error:', error);
    throw error;
  }
};

// 子供の数を取得
export const getChildrenCount = async (firebaseUser: User) => {
  try {
    const idToken = await firebaseUser.getIdToken(true);
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    
    const response = await fetch(
      `${API_BASE_URL}/api/v1/children/count`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    return result.count;
  } catch (error) {
    console.error('Get children count error:', error);
    throw error;
  }
};
