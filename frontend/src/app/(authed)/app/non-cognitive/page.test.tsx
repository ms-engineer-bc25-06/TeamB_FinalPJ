/// <reference types="vitest/globals" />
import NonCognitivePage from '@/app/(authed)/app/non-cognitive/page';
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

describe('NonCognitivePage', () => {
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
    render(<NonCognitivePage />);
  };

  it('正常にレンダリングされる', () => {
    setup();
    expect(screen.getByText('非認知能力について')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '非認知能力とは？' }),
    ).toBeInTheDocument();
  });

  it('タブ切り替えが動作する', () => {
    setup();
    fireEvent.click(screen.getByText('非認知能力の重要性'));
    expect(
      screen.getByRole('heading', { name: '非認知能力の重要性' }),
    ).toBeInTheDocument();
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
