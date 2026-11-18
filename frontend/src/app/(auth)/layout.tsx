import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';

const HIGHLIGHTS = [
  'Live portfolio RAG status across gas, electrical, fire & EPC duties',
  'Versioned certificate register with automated 60 / 30 / 7-day reminders',
  'Full remediation action tracking with evidence & verification sign-off',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:grid lg:grid-cols-[minmax(380px,42%)_1fr]">
      <a
        href="#auth-main"
        className="focus-ring sr-only z-50 rounded-lg bg-surface px-4 py-2 font-semibold text-brand-700 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to form
      </a>

      <aside className="flex flex-col justify-between bg-sidebar px-5 py-5 text-white sm:px-8 sm:py-6 lg:px-12 lg:py-12">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Logo tone="light" size="sm" className="lg:hidden" />
          <Logo variant="full" tone="light" size="lg" className="hidden lg:inline-flex" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-hover px-3 py-1 text-xs font-medium text-sidebar-muted lg:hidden">
            <ShieldCheck className="h-3.5 w-3.5 text-gauge-green" aria-hidden />
            UK Property Compliance
          </span>
        </div>

        <div className="hidden lg:my-auto lg:block lg:py-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-sidebar-hover px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-gauge-green" aria-hidden />
            UK Property Compliance Platform
          </p>
          <h1 className="mt-5 text-[1.85rem] font-bold leading-tight tracking-tight text-white">
            Stay ahead of every statutory duty across your portfolio.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-sidebar-muted">
            Centralise certificates, spot upcoming renewals early, and keep an audit-ready trail from inspection to sign-off.
          </p>
          <ul className="stagger-children mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gauge-green" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-sidebar-muted lg:block">
          Audit-ready compliance tracking for landlords, letting agents &amp; property managers.
        </p>
      </aside>

      <main id="auth-main" tabIndex={-1} className="flex flex-1 items-center justify-center px-4 py-8 outline-none sm:px-6 lg:px-12">
        <div className="page-enter w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
