import { cn } from '@/lib/utils';

/** Screen title block from the mock-ups: bold H1, muted subtitle, actions on the right. */
export function PageHeader({ title, description, actions, className }: { title: string; description?: string; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold leading-tight text-ink sm:text-h1">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-ink-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
