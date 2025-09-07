/// <reference types="vitest/globals" />
import UsagePage from '@/app/(authed)/app/usage/page';
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

describe('UsagePage', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  // 共通 setup
  const setup = ({
    user = { id: '1' },
    isLoading = false,
  }: { user?: { id: string } | null; isLoading?: boolean } = {}) => {
    (useAuth as any).mockReturnValue({ user, isLoading });
    render(<UsagePage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    expect(screen.getByText('使い方')).toBeInTheDocument();
    expect(screen.getByText('感情記録を始める')).toBeInTheDocument();
  });

  it('タブ切り替えが動作する', () => {
    setup();
    // ボタンの「毎日の流れ」をクリック
    const tabButton = screen.getByRole('button', { name: '毎日の流れ' });
    fireEvent.click(tabButton);
    // h2の「毎日の流れ」が表示されることを確認
    expect(
      screen.getByRole('heading', { name: '毎日の流れ' }),
    ).toBeInTheDocument();
  });

  it('ボタンクリックが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('← もどる'));
    expect(mockPush).toHaveBeenCalledWith('/app');
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
