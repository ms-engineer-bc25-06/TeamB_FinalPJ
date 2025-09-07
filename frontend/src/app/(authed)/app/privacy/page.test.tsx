/// <reference types="vitest/globals" />
import PrivacyPage from '@/app/(authed)/app/privacy/page';
import { useAuth } from '@/contexts/AuthContext';
import { fireEvent, render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// モック
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('@/components/ui', () => ({
  KokoronDefault: () => <div>Kokoron</div>,
  SpeechBubble: ({ text }: { text: string }) => <div>{text}</div>,
  Spinner: () => <div>Loading</div>,
  HamburgerMenu: () => <div>Menu</div>,
}));

describe('PrivacyPage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  const setup = ({
    user = { id: '1' },
    isLoading = false,
  }: { user?: { id: string } | null; isLoading?: boolean } = {}) => {
    (useAuth as any).mockReturnValue({ user, isLoading });
    render(<PrivacyPage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();
    expect(screen.getByText(/このプライバシーポリシー/)).toBeInTheDocument();
  });

  it('戻るボタンが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('← もどる'));
    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  it('感情記録ボタンが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('感情記録を始める'));
    expect(mockPush).toHaveBeenCalledWith('/app/emotion-selection');
  });

  it('ローディング状態を表示する', () => {
    setup({ user: null, isLoading: true });
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('未ログイン時にリダイレクトする', () => {
    setup({ user: null, isLoading: false });
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
