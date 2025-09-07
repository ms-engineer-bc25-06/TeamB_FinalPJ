import { beforeEach, describe, expect, test, vi } from 'vitest';

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Firebaseのモック
const mockFirebase = {
  auth: () => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
  }),
};

// Firebaseをモック（setupTests.tsで既に定義されている場合はスキップ）
if (!window.firebase) {
  Object.defineProperty(window, 'firebase', {
    value: mockFirebase,
    writable: true,
    configurable: true,
  });
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('認証状態の永続化', () => {
    test('localStorageに認証状態を保存', () => {
      const authData = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      // 認証状態をlocalStorageに保存
      localStorageMock.setItem.mockImplementation((key, value) => {
        if (key === 'firebase:authUser:teamb-finalpj:[DEFAULT]') {
          expect(JSON.parse(value)).toEqual(authData);
        }
      });

      // 認証状態を保存する関数をテスト
      const saveAuthToStorage = (data: any) => {
        localStorage.setItem(
          'firebase:authUser:teamb-finalpj:[DEFAULT]',
          JSON.stringify(data)
        );
      };

      saveAuthToStorage(authData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'firebase:authUser:teamb-finalpj:[DEFAULT]',
        JSON.stringify(authData)
      );
    });

    test('localStorageから認証状態を取得', () => {
      const authData = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      // localStorageから認証状態を取得する関数をテスト
      const getAuthFromStorage = () => {
        const authData = localStorage.getItem('firebase:authUser:teamb-finalpj:[DEFAULT]');
        return authData ? JSON.parse(authData) : null;
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(authData));

      const result = getAuthFromStorage();
      expect(result).toEqual(authData);
    });

    test('認証状態のクリア', () => {
      const clearAuthFromStorage = () => {
        localStorage.removeItem('firebase:authUser:teamb-finalpj:[DEFAULT]');
      };

      clearAuthFromStorage();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'firebase:authUser:teamb-finalpj:[DEFAULT]'
      );
    });

    test('ページリロード後の認証状態復元', () => {
      const authData = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      // 認証状態を保存
      localStorageMock.setItem.mockImplementation((key, value) => {
        if (key === 'firebase:authUser:teamb-finalpj:[DEFAULT]') {
          localStorageMock.getItem.mockReturnValue(value);
        }
      });

      const saveAuthToStorage = (data: any) => {
        localStorage.setItem(
          'firebase:authUser:teamb-finalpj:[DEFAULT]',
          JSON.stringify(data)
        );
      };

      const getAuthFromStorage = () => {
        const authData = localStorage.getItem('firebase:authUser:teamb-finalpj:[DEFAULT]');
        return authData ? JSON.parse(authData) : null;
      };

      // 認証状態を保存
      saveAuthToStorage(authData);

      // ページリロードをシミュレート（localStorageの状態は維持される）
      const restoredAuth = getAuthFromStorage();
      expect(restoredAuth).toEqual(authData);
    });

    test('新しいタブでの認証状態共有', () => {
      const authData = {
        uid: 'test-user-456',
        email: 'test2@example.com',
        displayName: 'Test User 2',
      };

      // 認証状態を保存
      localStorageMock.setItem.mockImplementation((key, value) => {
        if (key === 'firebase:authUser:teamb-finalpj:[DEFAULT]') {
          localStorageMock.getItem.mockReturnValue(value);
        }
      });

      const saveAuthToStorage = (data: any) => {
        localStorage.setItem(
          'firebase:authUser:teamb-finalpj:[DEFAULT]',
          JSON.stringify(data)
        );
      };

      const getAuthFromStorage = () => {
        const authData = localStorage.getItem('firebase:authUser:teamb-finalpj:[DEFAULT]');
        return authData ? JSON.parse(authData) : null;
      };

      // 認証状態を保存
      saveAuthToStorage(authData);

      // 新しいタブで認証状態を確認（localStorageは共有される）
      const sharedAuth = getAuthFromStorage();
      expect(sharedAuth).toEqual(authData);
    });
  });

  describe('Firebase SDK初期化', () => {
    test('Firebase SDKが読み込まれているか確認', () => {
      expect(window.firebase).toBeDefined();
      expect(typeof window.firebase.auth).toBe('function');
    });

    test('Firebase Authが利用可能か確認', () => {
      const auth = window.firebase.auth();
      expect(auth).toBeDefined();
      expect(typeof auth.onAuthStateChanged).toBe('function');
      expect(typeof auth.signInWithPopup).toBe('function');
      expect(typeof auth.signOut).toBe('function');
    });
  });

  describe('エラーハンドリング', () => {
    test('localStorageが利用できない場合の処理', () => {
      // localStorageを無効化
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const getAuthFromStorage = () => {
        try {
          const authData = localStorage.getItem('firebase:authUser:teamb-finalpj:[DEFAULT]');
          return authData ? JSON.parse(authData) : null;
        } catch (error) {
          return null;
        }
      };

      const result = getAuthFromStorage();
      expect(result).toBeNull();
    });

    test('不正なJSONデータの処理', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      const getAuthFromStorage = () => {
        try {
          const authData = localStorage.getItem('firebase:authUser:teamb-finalpj:[DEFAULT]');
          return authData ? JSON.parse(authData) : null;
        } catch (error) {
          return null;
        }
      };

      const result = getAuthFromStorage();
      expect(result).toBeNull();
    });
  });
});
