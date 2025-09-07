import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

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

Object.defineProperty(window, 'firebase', {
  value: mockFirebase,
});

// テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});
