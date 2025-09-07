import RoleplayPage from '@/app/(authed)/app/roleplay/page';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 可変モック: 各テストで上書き
let authState: any;
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
    vi.clearAllMocks();
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
  });

  it('正常系: 感情を選択するとモーダルが開き、アドバイスの表示/非表示を切り替えられる', () => {
    render(<RoleplayPage />);

    // 感情選択へ
    fireEvent.click(
      screen.getByRole('button', { name: /おもちゃをおともだちにとられた/ }),
    );

    // ふゆかいを選択 → モーダルオープン
    fireEvent.click(screen.getByRole('button', { name: /ふゆかい/ }));
    expect(screen.getByText('えらんだきもち')).toBeInTheDocument();
    const modal = screen.getByText('えらんだきもち').closest('div')!;
    expect(within(modal).getByText('ふゆかい')).toBeInTheDocument();

    // アドバイスを表示
    const toggleBtn = screen.getByRole('button', {
      name: /こころんのおまじない/,
    });
    fireEvent.click(toggleBtn);
    expect(
      screen.getByText('「いやだな」って いってみよう'),
    ).toBeInTheDocument();

    // とじるで非表示
    fireEvent.click(screen.getByRole('button', { name: 'とじる' }));
    expect(
      screen.queryByText('「いやだな」って いってみよう'),
    ).not.toBeInTheDocument();
  });

  it('正常系: モーダルの×ボタンで閉じられる', () => {
    render(<RoleplayPage />);

    fireEvent.click(
      screen.getByRole('button', { name: /おもちゃをおともだちにとられた/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: /かなしい/ }));

    // モーダルが開いている
    expect(screen.getByText('えらんだきもち')).toBeInTheDocument();

    // 閉じる
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(screen.queryByText('えらんだきもち')).not.toBeInTheDocument();
  });

  it('正常系: 「← もどる」でシナリオ一覧に戻れる（状態リセット）', () => {
    render(<RoleplayPage />);

    fireEvent.click(
      screen.getByRole('button', { name: /おもちゃをおともだちにとられた/ }),
    );
    fireEvent.click(screen.getByText('← もどる'));

    // 一覧に戻る
    expect(screen.getByText('シナリオをえらんでね')).toBeInTheDocument();
  });

it('異常系: 2つ目以降のシナリオはクリックしても遷移しない', () => {
    render(<RoleplayPage />)

    const secondScenario = screen.getByRole('button', { name: /おともだちとけんか/ })
    expect(secondScenario).toBeDisabled()

    // 念のため click しても変化がないことを確認
    fireEvent.click(secondScenario)
    expect(screen.getByText('シナリオをえらんでね')).toBeInTheDocument()
  })

  it('異常系: isLoading=true のときローディング表示', () => {
    authState = {
      ...authState,
      isLoading: true,
      user: null,
    }
    render(<RoleplayPage />)
    expect(screen.getByText('読み込み中...')).toBeInTheDocument()
  })

  it('異常系: 未認証時はトップへリダイレクト', () => {
    authState = {
      ...authState,
      isLoading: false,
      user: null,
    }
    render(<RoleplayPage />)
    expect(pushMock).toHaveBeenCalledWith('/')
  })
})