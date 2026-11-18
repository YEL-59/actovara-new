import type { Metadata } from 'next';
import { PublicSharePage } from '@/components/sharing/PublicSharePage';

/**
 * Public landlord page (P1, TASK-013). No app shell and no sign-in.
 * The token must never leak: no indexing, and no Referer header on outbound links.
 */
export const metadata: Metadata = {
  title: 'Property compliance summary',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function SharePage({ params }: { params: { token: string } }) {
  return <PublicSharePage token={decodeURIComponent(params.token)} />;
}
