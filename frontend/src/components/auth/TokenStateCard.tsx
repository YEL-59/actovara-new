'use client';

import Link from 'next/link';
import { ClockAlert, Link2Off, CheckCircle2 } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import type { TokenStatus } from '@/services';

interface TokenStateCardProps {
  kind: 'password_reset' | 'invite';
  status: Exclude<TokenStatus, 'valid'>;
}

const copy: Record<
  TokenStateCardProps['kind'],
  Record<Exclude<TokenStatus, 'valid'>, { title: string; description: string }>
> = {
  password_reset: {
    expired: {
      title: 'Reset link has expired',
      description: 'Password reset links are valid for 60 minutes. Request a new link to continue.',
    },
    used: {
      title: 'Reset link already used',
      description: 'This link has already been used to update a password. Request another link if you still need help.',
    },
    invalid: {
      title: 'Reset link is not valid',
      description: 'This link could not be verified. Check the full URL or request a fresh password reset.',
    },
  },
  invite: {
    expired: {
      title: 'Invitation has expired',
      description: 'This team invitation has expired. Ask your organisation administrator to send a new invite.',
    },
    used: {
      title: 'Invitation already accepted',
      description: 'This invitation has already been used to activate an account. Sign in with your email and password.',
    },
    invalid: {
      title: 'Invitation link is not valid',
      description: 'This invitation link could not be verified. Ask your organisation administrator for a fresh invite.',
    },
  },
};

export function TokenStateCard({ kind, status }: TokenStateCardProps) {
  const { title, description } = copy[kind][status];
  const icon = status === 'expired' ? <ClockAlert /> : status === 'used' ? <CheckCircle2 /> : <Link2Off />;

  return (
    <EmptyState
      className="border-solid"
      icon={icon}
      title={title}
      description={description}
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          {kind === 'password_reset' && (
            <Link href="/forgot-password">
              <Button variant="primary">Request new link</Button>
            </Link>
          )}
          <Link href="/login">
            <Button variant={kind === 'invite' ? 'primary' : 'secondary'}>Back to sign in</Button>
          </Link>
        </div>
      }
    />
  );
}
