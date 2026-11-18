'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarClock, CircleCheck, Clock, EyeOff, FileLock2, Info, KeyRound, LinkIcon, ShieldOff, SquareCheck, TimerOff } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Alert, Badge, Button, EmptyState, LoadingRegion, Skeleton, StatusPill } from '@/components/ui';
import { daysUntil, formatDate, formatDateTime } from '@/lib/format';
import { isApiError, errorMessage, publicShareService } from '@/services';
import type { PublicShareView, ShareUnavailableReason } from '@/types/domain';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; view: PublicShareView }
  | { kind: 'password'; error?: string; locked?: boolean }
  | { kind: 'invalid' }
  | { kind: 'gone'; reason: ShareUnavailableReason }
  | { kind: 'error'; message: string };

/* ------------------------------- Page chrome ------------------------------ */
function Chrome({ children, organisationName }: { children: React.ReactNode; organisationName?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a href="#share-main" className="focus-ring sr-only z-50 rounded-lg bg-surface px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <header className="bg-sidebar print:bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo tone="light" size="sm" className="print:hidden" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-hover px-3 py-1 text-xs font-medium text-sidebar-muted">
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
            Read-only landlord view
          </span>
        </div>
      </header>
      <main id="share-main" className="page-enter mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-4 text-meta text-ink-muted sm:px-6">
          {organisationName ? `Shared by ${organisationName} using Actovara.` : 'Powered by Actovara.'} This page is private to the person the link was sent to. Please do not forward it.
        </div>
      </footer>
    </div>
  );
}

function StateCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-card sm:mt-12 sm:p-8">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-table-head text-ink-muted [&>svg]:h-6 [&>svg]:w-6" aria-hidden>
        {icon}
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">{title}</h1>
      <div className="mt-2 text-sm text-ink-muted">{children}</div>
    </section>
  );
}

/* --------------------------------- Skeleton ------------------------------- */
function ShareSkeleton() {
  return (
    <LoadingRegion label="Loading property summary" className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </LoadingRegion>
  );
}

/* ------------------------------ Password gate ----------------------------- */
function PasswordGate({ error, locked, submitting, onSubmit }: { error?: string; locked?: boolean; submitting: boolean; onSubmit: (pw: string) => void }) {
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldError = touched && !password ? 'Enter the password you were given.' : error && !locked ? error : undefined;

  useEffect(() => {
    if (error && !locked) inputRef.current?.focus();
  }, [error, locked]);

  return (
    <section className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card sm:mt-12 sm:p-8" aria-labelledby="gate-title">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600" aria-hidden>
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 id="gate-title" className="mt-4 text-xl font-bold text-ink">
        Enter the password
      </h1>
      <p className="mt-1 text-sm text-ink-muted">This property summary is password protected. The property manager will have sent the password separately.</p>
      {locked && (
        <Alert tone="warning" title="Too many attempts" className="mt-4">
          {error}
        </Alert>
      )}
      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (password) onSubmit(password);
        }}
      >
        <PasswordInput
          ref={inputRef}
          id="share-password"
          label="Password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError}
          disabled={locked}
          required
        />
        <Button type="submit" className="w-full" isLoading={submitting} disabled={locked}>
          View property summary
        </Button>
      </form>
    </section>
  );
}

/* ------------------------------- Ready view ------------------------------- */
function Summary({ view }: { view: PublicShareView }) {
  const count = (s: string[]) => view.requirements.filter((r) => s.includes(r.status)).length;
  const tiles = [
    { label: 'Up to date', value: count(['valid', 'store_only']), icon: CircleCheck, tone: 'text-ok-600 bg-ok-50' },
    { label: 'Due soon', value: count(['due_soon']), icon: Clock, tone: 'text-warn-700 bg-warn-50' },
    { label: 'Overdue or missing', value: count(['overdue', 'missing']), icon: CalendarClock, tone: 'text-danger-600 bg-danger-50' },
    { label: 'Open actions', value: view.openActions.length, icon: SquareCheck, tone: 'text-brand-600 bg-brand-50' },
  ];
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">Property compliance summary</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-ink sm:text-[1.75rem]">{view.propertyName}</h1>
          {view.locality && <p className="mt-0.5 text-sm text-ink-muted">{view.locality}</p>}
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <StatusPill kind="rag" value={view.rag} size="md" />
          <span className="text-meta text-ink-muted">Operational indicator, not a legal assessment</span>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-ink-muted">
        <span>
          Generated <time dateTime={view.generatedAt}>{formatDateTime(view.generatedAt)}</time>
        </span>
        <span>
          Link valid until <time dateTime={view.expiresAt}>{formatDate(view.expiresAt)}</time>
        </span>
      </p>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <li key={label} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`} aria-hidden>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl font-bold tabular-nums text-ink">{value}</span>
              <span className="block truncate text-meta text-ink-muted">{label}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-card" aria-labelledby="req-title">
        <h2 id="req-title" className="border-b border-line px-4 py-3.5 text-base font-semibold text-ink sm:px-6">
          Certificates &amp; checks
        </h2>
        {view.requirements.length === 0 ? (
          <EmptyState icon={<FileLock2 />} title="Nothing recorded yet" description="The property manager has not recorded any certificates for this property." className="rounded-none border-0 py-10" />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="divide-y divide-line sm:hidden">
              {view.requirements.map((r, i) => (
                <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{r.complianceTypeName}</p>
                    <p className="text-meta text-ink-muted">{r.expiryDate ? `Expires ${formatDate(r.expiryDate)}` : 'No expiry date'}</p>
                  </div>
                  <StatusPill kind="requirement" value={r.status} variant="dot" />
                </li>
              ))}
            </ul>
            {/* Tablet / desktop: table */}
            <table className="hidden w-full text-left text-sm sm:table">
              <thead className="bg-table-head text-meta font-semibold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="px-6 py-3">Requirement</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Expiry date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {view.requirements.map((r, i) => (
                  <tr key={i} className="hover:bg-canvas">
                    <td className="px-6 py-3.5 font-medium text-ink">{r.complianceTypeName}</td>
                    <td className="px-6 py-3.5">
                      <StatusPill kind="requirement" value={r.status} variant="dot" />
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-ink-muted">{r.expiryDate ? formatDate(r.expiryDate) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-card" aria-labelledby="act-title">
        <h2 id="act-title" className="border-b border-line px-4 py-3.5 text-base font-semibold text-ink sm:px-6">
          Open actions
        </h2>
        {view.openActions.length === 0 ? (
          <EmptyState icon={<SquareCheck />} title="No open actions" description="There is no outstanding remedial work on this property." className="rounded-none border-0 py-10" />
        ) : (
          <ul className="divide-y divide-line">
            {view.openActions.map((a, i) => {
              const overdue = daysUntil(a.dueDate, now) < 0;
              return (
                <li key={i} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
                  <p className="min-w-0 font-medium text-ink">{a.title}</p>
                  <span className="flex shrink-0 items-center gap-2 text-meta text-ink-muted">
                    Due <time dateTime={a.dueDate}>{formatDate(a.dueDate)}</time>
                    {overdue && <Badge tone="danger">Overdue</Badge>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Alert tone="info" title="Files are not downloadable">
        Certificates and documents stay with the property manager. Contact them if you need a copy.
      </Alert>
      <p className="flex gap-2 text-meta leading-relaxed text-ink-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        This summary reflects the records held by the property manager at the time shown above. It is provided for information and does not confirm that the property meets any legal requirement.
      </p>
    </div>
  );
}

/* ---------------------------------- Page ---------------------------------- */
export function PublicSharePage({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (password?: string) => {
      if (password) setSubmitting(true);
      else setState({ kind: 'loading' });
      try {
        const res = await publicShareService.view(token, password);
        setState({ kind: 'ready', view: res.data });
      } catch (e) {
        if (!isApiError(e)) setState({ kind: 'error', message: errorMessage(e) });
        else if (e.statusCode === 401) setState({ kind: 'password', error: password ? e.message : undefined });
        else if (e.statusCode === 429) setState({ kind: 'password', error: e.message, locked: true });
        else if (e.statusCode === 404) setState({ kind: 'invalid' });
        else if (e.statusCode === 410) setState({ kind: 'gone', reason: (e.errorSources[0]?.message as ShareUnavailableReason) ?? 'unavailable' });
        else setState({ kind: 'error', message: e.message });
      } finally {
        setSubmitting(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Chrome organisationName={state.kind === 'ready' ? state.view.organisationName : undefined}>
      {state.kind === 'loading' && <ShareSkeleton />}
      {state.kind === 'ready' && <Summary view={state.view} />}
      {state.kind === 'password' && <PasswordGate error={state.error} locked={state.locked} submitting={submitting} onSubmit={(pw) => void load(pw)} />}
      {state.kind === 'invalid' && (
        <StateCard icon={<LinkIcon />} title="Link not recognised">
          Check you copied the whole address from the message you received. If it still does not work, ask the property manager for a new link.
        </StateCard>
      )}
      {state.kind === 'gone' && state.reason === 'expired' && (
        <StateCard icon={<TimerOff />} title="This link has expired">
          Share links only work for a limited time. Ask the property manager to send you a new one.
        </StateCard>
      )}
      {state.kind === 'gone' && state.reason === 'revoked' && (
        <StateCard icon={<ShieldOff />} title="This link has been withdrawn">
          The property manager has turned this link off. Contact them if you still need access.
        </StateCard>
      )}
      {state.kind === 'gone' && state.reason === 'unavailable' && (
        <StateCard icon={<ShieldOff />} title="No longer shared">
          This property is no longer being shared. Contact the property manager for details.
        </StateCard>
      )}
      {state.kind === 'error' && (
        <div className="mx-auto mt-6 max-w-md sm:mt-12">
          <Alert tone="error" title="Could not load this page" onRetry={() => void load()}>
            {state.message}
          </Alert>
        </div>
      )}
    </Chrome>
  );
}
