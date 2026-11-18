import { authMock } from '@/mocks/auth';
import { mockStore } from '@/mocks/store';
import { DEMO_SHARE_PASSWORD, DEMO_SHARE_TOKENS } from '@/mocks/seed';
import { USE_MOCKS } from './config';

/** Client-demo helpers. They do nothing when talking to the real API. */
export const demoService = {
  enabled: USE_MOCKS,
  /** Restore the original fixtures, discarding every change made during the demo. */
  reset() {
    if (!USE_MOCKS) return;
    authMock.reset(); // passwords, lockouts and used links
    mockStore.reset();
  },
  /** Public token of a seeded landlord link (demo only — real tokens are shown once and never stored). */
  shareToken(shareLinkId: string): string | undefined {
    return USE_MOCKS ? DEMO_SHARE_TOKENS[shareLinkId] : undefined;
  },
  sharePassword: USE_MOCKS ? DEMO_SHARE_PASSWORD : undefined,
  subscribe(listener: () => void) {
    return USE_MOCKS ? mockStore.subscribe(listener) : () => undefined;
  },
};
