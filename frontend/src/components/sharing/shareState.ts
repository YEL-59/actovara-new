import type { Tone } from '@/lib/status';
import type { ShareAccess, ShareLink } from '@/types/domain';

export type ShareLinkState = 'active' | 'expired' | 'revoked';

export function shareLinkState(link: ShareLink, now = Date.now()): ShareLinkState {
  if (link.revokedAt) return 'revoked';
  return Date.parse(link.expiresAt) <= now ? 'expired' : 'active';
}

export const shareStateMeta: Record<ShareLinkState, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'ok' },
  expired: { label: 'Expired', tone: 'neutral' },
  revoked: { label: 'Revoked', tone: 'danger' },
};

export const accessOutcomeMeta: Record<ShareAccess['outcome'], { label: string; tone: Tone }> = {
  granted: { label: 'Viewed', tone: 'ok' },
  bad_password: { label: 'Wrong password', tone: 'warn' },
  expired: { label: 'Blocked: expired', tone: 'neutral' },
  revoked: { label: 'Blocked: revoked', tone: 'danger' },
};
