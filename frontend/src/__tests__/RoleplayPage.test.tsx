import RoleplayPage from '@/app/(authed)/app/roleplay/page';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 可変モック: 各テストで上書き
let authState: any;
// let pushMock: ReturnType<typeof vi.fn>;

const pushMock = vi.fn();

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: pushMock,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  };
  });

// AuthContext のモック（テストごとに authState を差し替え）
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

// HamburgerMenu 内で参照されるサブスクフックを安定モック
vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    has_subscription: false,
    status: 'none',
    is_trial: false,
    is_paid: false,
    trial_expires_at: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('RoleplayPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authState = {
      user: { id: 'u1', name: 'Tester' },
      firebaseUser: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    };
  });

  it('正常系: 認証済みでシナリオ一覧が表示され、1つ目のみ選択可能', () => {
    render(<RoleplayPage />);

    // シナリオ一覧の導入メッセージ
    expect(screen.getByText('シナリオをえらんでね')).toBeInTheDocument();

    // 1つ目のシナリオは有効
    const firstScenario = screen.getByRole('button', {
      name: /おもちゃをおともだちにとられた/,
    });
    expect(firstScenario).toBeEnabled();

    // 2つ目以降は無効（ロック）
    const secondScenario = screen.getByRole('button', {
      name: /おともだちとけんか/,
    });
    expect(secondScenario).toBeDisabled();
  });

  it('正常系: 1つ目のシナリオをクリックすると感情選択画面に遷移する', () => {
    render(<RoleplayPage />);

    const firstScenario = screen.getByRole('button', {
      name: /おもちゃをおともだちにとられた/,
    });
    fireEvent.click(firstScenario);

    // シナリオ説明の一部で存在確認（日本語・改行・記号の誤差吸収）
    expect(screen.getByText(/どんな きもちかな/)).toBeInTheDocument();
    // 戻るリンクも表示
    expect(screen.getByText('← もどる')).toBeInTheDocument();
    // 感情カードのラベルが表示されている
    expect(screen.getByText('かなしい')).toBeInTheDocument();
    expect(screen.getByText('こまった')).toBeInTheDocument();
    expect(screen.getByText('ふゆかい')).toBeInTheDocument();
    expect(screen.getByText('いかり')).toBeInTheDocument();
  })}); 
