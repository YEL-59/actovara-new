'use client';

import React, { useId, useRef, useState } from 'react';
import { CircleAlert, FileText, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/format';

export interface FileDropzoneProps {
  label: string;
  /** e.g. ".pdf,.jpg,.png" */
  accept?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

/** ".pdf,.jpg,.png" → "PDF, JPG or PNG" */
function describeAccept(accept: string) {
  const parts = accept.split(',').map((s) => s.trim().replace(/^\./, '').toUpperCase()).filter(Boolean);
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} or ${parts[parts.length - 1]}` : parts[0] ?? '';
}

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .some((rule) => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule));
}

/** Drag-and-drop or click/keyboard to choose files, with type and size validation. */
export function FileDropzone({
  label,
  accept,
  maxSizeBytes = 20 * 1024 * 1024,
  multiple = false,
  files,
  onFilesChange,
  hint,
  error,
  disabled,
  className,
}: FileDropzoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const shownError = error ?? localError;

  const accept_ = (list: FileList | null) => {
    if (!list || disabled) return;
    const incoming = Array.from(list);
    const bad = incoming.find((f) => !matchesAccept(f, accept));
    if (bad) return setLocalError(`"${bad.name}" can't be uploaded. Only ${describeAccept(accept ?? '')} files are accepted.`);
    const big = incoming.find((f) => f.size > maxSizeBytes);
    if (big) return setLocalError(`"${big.name}" is ${formatFileSize(big.size)}. Files must be ${formatFileSize(maxSizeBytes)} or smaller.`);
    setLocalError(undefined);
    onFilesChange(multiple ? [...files, ...incoming] : incoming.slice(0, 1));
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span id={`${id}-label`} className="text-sm font-medium text-ink">
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-help`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept_(e.dataTransfer.files);
        }}
        className={cn(
          'focus-ring flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          dragging ? 'border-brand-600 bg-brand-50' : shownError ? 'border-danger-600 bg-danger-50' : 'border-line bg-canvas hover:border-brand-200 hover:bg-brand-50/50',
        )}
      >
        <UploadCloud className={cn('h-8 w-8', dragging ? 'text-brand-600' : 'text-ink-subtle')} aria-hidden />
        <span className="text-[15px] font-semibold text-ink">
          <span className="text-brand-600">Choose {multiple ? 'files' : 'a file'}</span> or drag and drop
        </span>
        <span id={`${id}-help`} className="text-meta text-ink-muted">
          {hint ?? `${accept ? accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ') : 'Any file'} · up to ${formatFileSize(maxSizeBytes)}`}
        </span>
      </button>
      <input ref={inputRef} type="file" className="sr-only" tabIndex={-1} accept={accept} multiple={multiple} onChange={(e) => {
        accept_(e.target.files);
        e.target.value = '';
      }} />

      {shownError && (
        <p className="flex items-center gap-1.5 text-meta font-medium text-danger-700" role="alert">
          <CircleAlert className="h-3.5 w-3.5" aria-hidden />
          {shownError}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2" aria-label="Selected files">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
              <FileText className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{f.name}</span>
              <span className="text-meta text-ink-muted">{formatFileSize(f.size)}</span>
              <button
                type="button"
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
                className="focus-ring rounded-md p-1 text-ink-subtle hover:bg-table-head hover:text-ink"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
