'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail } from 'lucide-react';
import { Alert, Button, Card, Checkbox, Input, LoadingRegion, Skeleton, useToast } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { homeFor } from '@/components/layout/nav';
import { safeNext } from '@/lib/password';
import { useSession } from '@/lib/session-mock';
import { DEMO_PASSWORD, LOCKED_DEMO_EMAIL } from '@/mocks/auth';
import { authService, currentMockState, errorMessage, isApiError, USE_MOCKS } from '@/services';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_USERS = [
  { label: 'Org Admin', name: 'Hannah Clarke', email: 'hannah.clarke@demolettings.example' },
  { label: 'Manager', name: 'James Patel', email: 'james.patel@demolettings.example' },
  { label: 'Platform Admin', name: 'Daniel Hughes', email: 'daniel@actovara.example' },
  { label: 'Locked Account', name: 'Olivia Bennett', email: LOCKED_DEMO_EMAIL },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, user, signInAs } = useSession();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<{ title: string; detail: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const mockState = currentMockState();
  const signedOut = searchParams.get('signedOut') === '1';
  const nextParam = searchParams.get('next');

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(safeNext(nextParam, homeFor(user.role)));
  }, [ready, user, nextParam, router]);

  useEffect(() => {
    if (mockState === 'error') {
      setFormError({
        title: 'Unable to reach sign-in service',
        detail: 'The server could not be reached (simulated by ?mockState=error).',
      });
    } else {
      setFormError(null);
    }
  }, [mockState]);

  if (!ready || mockState === 'loading' || user) {
    return <LoginSkeleton />;
  }

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Enter your password.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await authService.login({ email: email.trim(), password, remember });
      signInAs(res.data.user._id, remember);
      toast({ tone: 'success', title: `Welcome back, ${res.data.user.name}` });
      router.replace(safeNext(nextParam, homeFor(res.data.user.role)));
    } catch (err) {
      if (isApiError(err)) {
        if (err.errorSources.length > 0) {
          const nextErrs: { email?: string; password?: string } = {};
          for (const src of err.errorSources) {
            if (src.path === 'email') nextErrs.email = src.message;
            if (src.path === 'password') nextErrs.password = src.message;
          }
          setFieldErrors(nextErrs);
        } else if (err.statusCode === 423) {
          setFormError({ title: 'Account temporarily locked', detail: err.message });
        } else if (err.statusCode === 403) {
          setFormError({ title: 'Organisation access suspended', detail: err.message });
        } else if (err.statusCode >= 500) {
          setFormError({ title: 'Unable to sign in right now', detail: err.message });
        } else {
          setFormError({ title: 'Sign-in failed', detail: err.message });
        }
      } else {
        setFormError({ title: 'Sign-in failed', detail: errorMessage(err) });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFieldErrors({});
    setFormError(null);
  }

  return (
    <div className="space-y-5">
      <Card padding="md" className="sm:p-7 shadow-card">
        <div className="mb-6">
          <h1 className="text-[1.625rem] font-bold leading-8 text-ink">Sign in to Actovara</h1>
          <p className="mt-1 text-sm text-ink-muted">Enter your work email and password to access your portfolio.</p>
        </div>

        {signedOut && !formError && (
          <Alert tone="info" title="You have been signed out" className="mb-5">
            Sign in again when you are ready to continue.
          </Alert>
        )}

        {mockState === 'empty' && !formError && (
          <Alert tone="info" title="Empty demo state" className="mb-5">
            Enter your credentials or select a demo account below to begin.
          </Alert>
        )}

        {formError && (
          <Alert tone="error" title={formError.title} className="mb-5" onDismiss={() => setFormError(null)}>
            {formError.detail}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Work email"
            type="email"
            autoComplete="email"
            placeholder="name@company.co.uk"
            leftIcon={<Mail aria-hidden />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            error={fieldErrors.email}
            required
          />

          <PasswordInput
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
            showLockIcon
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            error={fieldErrors.password}
            required
          />

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <Checkbox label="Remember me" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <Link href="/forgot-password" className="focus-ring rounded-md text-sm font-semibold text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full" isLoading={submitting}>
            Sign in
          </Button>
        </form>
      </Card>

      {USE_MOCKS && (
        <Card padding="md" className="bg-surface/80">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            <Lock className="h-3.5 w-3.5 text-brand-600" aria-hidden />
            Demo quick-fill (Password: {DEMO_PASSWORD})
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillDemo(u.email)}
                className="focus-ring flex flex-col items-start rounded-lg border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand-600/40 hover:bg-brand-50/50"
              >
                <span className="text-xs font-semibold text-ink">{u.name}</span>
                <span className="text-[11px] text-ink-muted">{u.label}</span>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function LoginSkeleton() {
  return (
    <LoadingRegion label="Loading sign-in form">
      <Card padding="md" className="sm:p-7 space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    </LoadingRegion>
  );
}
