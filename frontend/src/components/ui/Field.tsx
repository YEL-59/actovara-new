'use client';

import React, { useId } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Visually hide the label but keep it for screen readers. */
  hideLabel?: boolean;
  className?: string;
}

interface ShellProps extends FieldProps {
  id: string;
  children: React.ReactNode;
}

function FieldShell({ id, label, hint, error, required, hideLabel, className, children }: ShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className={cn('text-sm font-medium text-ink', hideLabel && 'sr-only')}>
          {label}
          {required && (
            <span className="ml-0.5 text-danger-600" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-meta font-medium text-danger-700" role="alert">
          <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-meta text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function a11y(id: string, error?: string, hint?: string) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
}

/* ---------------------------------- Input --------------------------------- */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'>, FieldProps {
  leftIcon?: React.ReactNode;
  /** Interactive control inside the right edge (e.g. a show/hide password button). */
  rightSlot?: React.ReactNode;
  inputClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, hideLabel, className, inputClassName, leftIcon, rightSlot, id: idProp, required, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} className={className}>
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ink-subtle [&>svg]:h-[18px] [&>svg]:w-[18px]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          required={required}
          className={cn('control', leftIcon && 'pl-11', rightSlot && 'pr-12', error && 'control-error', inputClassName)}
          {...a11y(id, error, hint)}
          {...props}
        />
        {rightSlot && <span className="absolute inset-y-0 right-1 flex items-center">{rightSlot}</span>}
      </div>
    </FieldShell>
  );
});

/** Native date picker — reliable keyboard + mobile support. Value is `YYYY-MM-DD`. */
export const DatePicker = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'leftIcon'>>(function DatePicker(props, ref) {
  return <Input ref={ref} type="date" {...props} />;
});

/* -------------------------------- Textarea -------------------------------- */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>, FieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, className, id: idProp, required, rows = 4, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} className={className}>
      <textarea
        ref={ref}
        rows={rows}
        required={required}
        className={cn('control resize-y', error && 'control-error')}
        {...a11y(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
});

/* --------------------------------- Select --------------------------------- */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'>, FieldProps {
  options: SelectOption[];
  placeholder?: string;
  selectClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, hideLabel, className, selectClassName, id: idProp, required, options, placeholder, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required} hideLabel={hideLabel} className={className}>
      <div className="group relative">
        <select
          ref={ref}
          required={required}
          className={cn(
            'control cursor-pointer appearance-none pr-10 font-medium transition-all duration-150 hover:bg-canvas/40',
            error && 'control-error',
            selectClassName,
          )}
          {...a11y(id, error, hint)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand-600"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
});

/* -------------------------------- Checkbox -------------------------------- */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, className, id: idProp, ...props },
  ref,
) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="focus-ring mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-line accent-brand-600 disabled:cursor-not-allowed"
        aria-describedby={description ? `${id}-desc` : undefined}
        {...props}
      />
      <div className="flex flex-col">
        <label htmlFor={id} className="cursor-pointer text-[15px] font-medium text-ink">
          {label}
        </label>
        {description && (
          <span id={`${id}-desc`} className="text-meta text-ink-muted">
            {description}
          </span>
        )}
      </div>
    </div>
  );
});

/* --------------------------------- Switch --------------------------------- */
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onChange, label, description, disabled, className }: SwitchProps) {
  const id = useId();
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex flex-col">
        <span id={`${id}-label`} className="text-[15px] font-medium text-ink">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="text-meta text-ink-muted">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'focus-ring relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-brand-600' : 'bg-neutral-100 ring-1 ring-inset ring-line',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
