'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';
import { Alert, Badge, Button, Card, Input, LoadingRegion, Skeleton, useToast } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { TokenStateCard } from '@/components/auth/TokenStateCard';
import { homeFor } from '@/components/layout/nav';
import { useApi } from '@/lib/hooks/useApi';
import { passwordIssue } from '@/lib/password';
import { roleLabel } from '@/lib/permissions';
import { useSession } from '@/lib/session-mock';
import { authService, errorMessage, isApiError } from '@/services';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = decodeURIComponent(params?.token ?? '');
  const router = useRouter();
  const { signInAs } = useSession();
  const { toast } = useToast();

  const { data: check, loading, error, reload } = useApi(() => authService.checkToken('invite', token), [token]);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (check?.name && !name) setName(check.name);
  }, [check?.name, name]);

  if (loading) {
    return (
      <LoadingRegion label="Verifying invitation">
        <Card padding="md" className="sm:p-7 space-y-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
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
        <Alert tone="error" title="Could not verify invitation" onRetry={reload}>
          {error}
        </Alert>
      </Card>
    );
  }

  if (!check || check.status !== 'valid') {
    const status = check && check.status !== 'valid' ? check.status : 'invalid';
    return (
      <Card padding="md" className="sm:p-7 shadow-card">
        <TokenStateCard kind="invite" status={status} />
      </Card>
    );
  }

  function validate(): boolean {
    const errs: { name?: string; password?: string; confirm?: string } = {};
    if (!name.trim()) errs.name = 'Enter your full name.';
    const issue = passwordIssue(password, check?.email);
    if (issue) errs.password = issue;
    if (!confirm) errs.confirm = 'Confirm your password.';
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
      const res = await authService.acceptInvite(token, { name: name.trim(), password });
      signInAs(res.data.user._id, true);
      toast({ tone: 'success', title: 'Account activated — welcome to Actovara' });
      router.replace(homeFor(res.data.user.role));
    } catch (err) {
      if (isApiError(err) && err.errorSources.length > 0) {
        const nextErrs: { name?: string; password?: string } = {};
        for (const src of err.errorSources) {
          if (src.path === 'name') nextErrs.name = src.message;
          if (src.path === 'password') nextErrs.password = src.message;
        }
        setFieldErrors(nextErrs);
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
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {check.orgName && <Badge tone="info">{check.orgName}</Badge>}
          {check.role && <Badge tone="neutral">{roleLabel[check.role]}</Badge>}
        </div>
        <h1 className="text-[1.625rem] font-bold leading-8 text-ink">Accept your invitation</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Set up your account for <span className="font-semibold text-ink">{check.email}</span>
        </p>
      </div>

      {formError && (
        <Alert tone="error" title="Could not activate account" className="mb-5" onDismiss={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          leftIcon={<UserCheck aria-hidden />}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: undefined }));
          }}
          error={fieldErrors.name}
          required
        />

        <div className="space-y-2.5">
          <PasswordInput
            label="Create password"
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
          label="Confirm password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
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
          Activate account &amp; sign in
        </Button>
      </form>
    </Card>
  );
}
