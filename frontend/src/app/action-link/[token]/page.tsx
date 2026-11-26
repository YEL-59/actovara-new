import type { Metadata } from 'next';
import { PublicActionPage } from '@/components/sharing/PublicActionPage';

/**
 * Public page for an external contact (contractor, landlord, tenant…) sent an action by email.
 * No app shell and no sign-in. The token must never leak: no indexing and no Referer header.
 */
export const metadata: Metadata = {
  title: 'Action from your property manager',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function ActionLinkPage({ params }: { params: { token: string } }) {
  return <PublicActionPage token={decodeURIComponent(params.token)} />;
}
