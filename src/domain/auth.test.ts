import { describe, expect, it } from 'vitest';
import { clearAccessToken, loadAccessToken, saveAccessToken } from './auth';

type MemoryStorage = {
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
  values: Record<string, string>;
};

const createMemoryStorage = (): MemoryStorage => {
  const values: Record<string, string> = {};

  return {
    values,
    getItem: (key) => values[key] ?? null,
    removeItem: (key) => {
      delete values[key];
    },
    setItem: (key, value) => {
      values[key] = value;
    },
  };
};

describe('auth token persistence', () => {
  it('saves and loads the access token', () => {
    const storage = createMemoryStorage();

    saveAccessToken(storage, 'token-123');

    expect(loadAccessToken(storage)).toBe('token-123');
  });

  it('clears the access token', () => {
    const storage = createMemoryStorage();
    saveAccessToken(storage, 'token-123');

    clearAccessToken(storage);

    expect(loadAccessToken(storage)).toBeNull();
  });
});
