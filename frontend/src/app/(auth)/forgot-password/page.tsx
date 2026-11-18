'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { Alert, Button, Card, Input, LoadingRegion, Skeleton } from '@/components/ui';
import { DEMO_TOKENS } from '@/mocks/auth';
import { authService, currentMockState, errorMessage, isApiError, USE_MOCKS } from '@/services';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotSkeleton />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Read after mount so the server render and first client render match (no hydration mismatch).
  const [mockState, setMockState] = useState<ReturnType<typeof currentMockState> | undefined>(undefined);
  useEffect(() => setMockState(currentMockState()), []);

  useEffect(() => {
    if (mockState === 'error') setFormError('The server could not be reached (simulated by ?mockState=error).');
  }, [mockState]);

  if (mockState === undefined || mockState === 'loading') {
    return <ForgotSkeleton />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.forgotPassword(trimmed);
      setSubmittedEmail(trimmed);
    } catch (err) {
      if (isApiError(err) && err.errorSources.some((s) => s.path === 'email')) {
        setEmailError(err.errorSources.find((s) => s.path === 'email')?.message);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="md" className="sm:p-7 shadow-card">
      <Link
        href="/login"
        className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to sign in
      </Link>

      <h1 className="text-[1.625rem] font-bold leading-8 text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Enter the email address for your account and we will send a password reset link.
      </p>

      {formError && (
        <Alert tone="error" title="Could not send reset link" className="mt-5" onDismiss={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {submittedEmail ? (
        <div className="mt-5 space-y-4">
          <Alert tone="success" title="Check your email">
            If an account exists for <span className="font-semibold text-ink">{submittedEmail}</span>, a reset link is on
            its way. The link expires in 60 minutes.
          </Alert>
          {USE_MOCKS && (
            <div className="rounded-xl border border-line bg-canvas p-3.5 text-xs text-ink-muted">
              <p className="font-semibold text-ink">Demo preview links:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/reset-password/${DEMO_TOKENS.resetValid}`} className="font-semibold text-brand-600 hover:underline">
                  Valid reset link
                </Link>
                <span>·</span>
                <Link href={`/reset-password/${DEMO_TOKENS.resetExpired}`} className="font-semibold text-brand-600 hover:underline">
                  Expired link
                </Link>
                <span>·</span>
                <Link href={`/reset-password/${DEMO_TOKENS.resetUsed}`} className="font-semibold text-brand-600 hover:underline">
                  Used link
                </Link>
              </div>
            </div>
          )}
          <Link href="/login" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              Return to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <Input
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="name@company.co.uk"
            leftIcon={<Mail aria-hidden />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
            required
          />
          <Button type="submit" size="lg" className="w-full" isLoading={submitting}>
            Send reset link
          </Button>
        </form>
      )}
    </Card>
  );
}

function ForgotSkeleton() {
  return (
    <LoadingRegion label="Loading password reset form">
      <Card padding="md" className="sm:p-7 space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    </LoadingRegion>
  );
}
