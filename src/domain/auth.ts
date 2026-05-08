import type { UserSummary } from './jobs';

type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

const accessTokenStorageKey = 'fieldops.accessToken';

export type AuthSession = {
  accessToken: string;
  user: UserSummary;
};

export const getBrowserStorage = (): StorageLike | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
};

export const loadAccessToken = (storage: StorageLike | null): string | null =>
  storage?.getItem(accessTokenStorageKey) ?? null;

export const saveAccessToken = (storage: StorageLike | null, token: string) => {
  storage?.setItem(accessTokenStorageKey, token);
};

export const clearAccessToken = (storage: StorageLike | null) => {
  storage?.removeItem(accessTokenStorageKey);
};
