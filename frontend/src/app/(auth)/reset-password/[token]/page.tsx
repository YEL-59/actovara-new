'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Alert, Button, Card, LoadingRegion, Skeleton } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { TokenStateCard } from '@/components/auth/TokenStateCard';
import { useApi } from '@/lib/hooks/useApi';
import { passwordIssue } from '@/lib/password';
import { authService, errorMessage, isApiError } from '@/services';

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params?.token ?? '');

  const { data: check, loading, error, reload } = useApi(() => authService.checkToken('password_reset', token), [token]);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) {
    return (
      <LoadingRegion label="Verifying reset link">
        <Card padding="md" className="sm:p-7 space-y-4">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
        </Card>
      </LoadingRegion>
    );
  }

  if (error) {
    return (
      <Card padding="md" className="sm:p-7 shadow-card">
        <Alert tone="error" title="Could not verify reset link" onRetry={reload}>
          {error}
        </Alert>
      </Card>
    );
  }

  if (!check || check.status !== 'valid') {
    const status = check && check.status !== 'valid' ? check.status : 'invalid';
    return (
      <Card padding="md" className="sm:p-7 shadow-card">
        <TokenStateCard kind="password_reset" status={status} />
      </Card>
    );
  }

  if (done) {
    return (
      <Card padding="md" className="sm:p-7 space-y-5 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ok-100 text-ok-700">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="text-[1.625rem] font-bold leading-8 text-ink">Password updated</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Your password has been changed. You can now sign in with your new credentials.
          </p>
        </div>
        <Link href="/login" className="block">
          <Button size="lg" className="w-full">
            Sign in to Actovara
          </Button>
        </Link>
      </Card>
    );
  }

  function validate(): boolean {
    const errs: { password?: string; confirm?: string } = {};
    const issue = passwordIssue(password, check?.email);
    if (issue) errs.password = issue;
    if (!confirm) errs.confirm = 'Confirm your new password.';
    else if (confirm !== password) errs.confirm = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (isApiError(err) && err.errorSources.some((s) => s.path === 'password')) {
        setFieldErrors({ password: err.errorSources.find((s) => s.path === 'password')?.message });
      } else if (isApiError(err) && (err.statusCode === 410 || err.statusCode === 404)) {
        reload();
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card padding="md" className="sm:p-7 shadow-card">
      <div className="mb-5">
        <h1 className="text-[1.625rem] font-bold leading-8 text-ink">Choose a new password</h1>
        {check.email && (
          <p className="mt-1 text-sm text-ink-muted">
            Resetting password for <span className="font-semibold text-ink">{check.email}</span>
          </p>
        )}
      </div>

      {formError && (
        <Alert tone="error" title="Could not update password" className="mb-5" onDismiss={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2.5">
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            placeholder="Minimum 12 characters"
            showLockIcon
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            error={fieldErrors.password}
            required
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          showLockIcon
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: undefined }));
          }}
          error={fieldErrors.confirm}
          required
        />

        <Button type="submit" size="lg" className="mt-2 w-full" isLoading={submitting}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
