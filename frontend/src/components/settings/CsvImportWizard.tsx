'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  FileDropzone,
  SegmentedControl,
  Select,
  TD,
  TH,
  Table,
  Textarea,
  useToast,
} from '@/components/ui';
import { fieldsForImportType, parseCsv, suggestColumnMapping } from '@/mocks/imports';
import { cn } from '@/lib/utils';
import {
  SAMPLE_CERTIFICATE_CSV,
  SAMPLE_PROPERTY_CSV,
  errorMessage,
  importsService,
  type ImportCommitResult,
} from '@/services';
import type { ImportDateFormat, ImportPreview, ImportType } from '@/types/domain';

type Step = 1 | 2 | 3 | 4;
type RowFilter = 'all' | 'valid' | 'duplicate' | 'error';

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Upload or paste' },
  { id: 2, label: 'Map columns' },
  { id: 3, label: 'Preview & validate' },
  { id: 4, label: 'Confirm' },
];

const DATE_FORMAT_OPTIONS: { value: ImportDateFormat; label: string }[] = [
  { value: 'dd/mm/yyyy', label: 'dd/mm/yyyy (UK standard, e.g. 15/11/2026)' },
  { value: 'yyyy-mm-dd', label: 'yyyy-mm-dd (ISO, e.g. 2026-11-15)' },
  { value: 'dd Mon yyyy', label: 'dd Mon yyyy (e.g. 15 Nov 2026)' },
];

export function CsvImportWizard({ onImported }: { onImported: () => void }) {
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [maxVisited, setMaxVisited] = useState<Step>(1);

  const [importType, setImportType] = useState<ImportType>('properties');
  const [dateFormat, setDateFormat] = useState<ImportDateFormat>('dd/mm/yyyy');
  const [fileName, setFileName] = useState('pasted-data.csv');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [csvText, setCsvText] = useState('');

  const [columns, setColumns] = useState<string[]>([]);
  const [sampleRow, setSampleRow] = useState<Record<string, string>>({});
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [rowFilter, setRowFilter] = useState<RowFilter>('all');
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);

  const fields = useMemo(() => fieldsForImportType(importType), [importType]);

  const goToStep = (target: Step) => {
    setStepError(null);
    setStep(target);
    if (target > maxVisited) setMaxVisited(target);
  };

  const handleTypeChange = (next: ImportType) => {
    setImportType(next);
    setMapping({});
    setPreview(null);
    setResult(null);
    setMaxVisited(1);
    setStepError(null);
  };

  const handleLoadSample = () => {
    const sample = importType === 'properties' ? SAMPLE_PROPERTY_CSV : SAMPLE_CERTIFICATE_CSV;
    setCsvText(sample);
    setFileName(importType === 'properties' ? 'sample-properties.csv' : 'sample-certificates.csv');
    setDateFormat('dd/mm/yyyy');
    setStepError(null);
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(typeof reader.result === 'string' ? reader.result : '');
      setStepError(null);
    };
    reader.onerror = () => setStepError('Could not read the selected file.');
    reader.readAsText(file);
  };

  const handleStep1Next = () => {
    setStepError(null);
    const parsed = parseCsv(csvText);
    if (parsed.columns.length === 0 || parsed.records.length === 0) {
      setStepError('Provide a CSV with a header row and at least one data row.');
      return;
    }
    setColumns(parsed.columns);
    setSampleRow(parsed.records[0] ?? {});
    const hasExistingMapping = Object.keys(mapping).some((k) => parsed.columns.includes(mapping[k] ?? ''));
    if (!hasExistingMapping) {
      setMapping(suggestColumnMapping(parsed.columns, importType));
    }
    goToStep(2);
  };

  const handleStep2Next = async () => {
    setStepError(null);
    const missingRequired = fields.filter((f) => f.required && !mapping[f.key]);
    if (missingRequired.length > 0) {
      setStepError(`Map all required fields: ${missingRequired.map((f) => f.label).join(', ')}.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await importsService.preview({
        type: importType,
        fileName,
        csvText,
        dateFormat,
        mapping,
      });
      setPreview(res.data);
      setRowFilter('all');
      goToStep(3);
    } catch (err) {
      setStepError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setStepError(null);
    setSubmitting(true);
    try {
      const res = await importsService.commit({
        importId: preview.importId,
        skipDuplicates,
      });
      setResult(res.data);
      toast({
        tone: 'success',
        title: 'Import complete',
        description: `${res.data.importedCount} row${res.data.importedCount === 1 ? '' : 's'} imported.`,
      });
      onImported();
    } catch (err) {
      setStepError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setMaxVisited(1);
    setCsvText('');
    setUploadedFiles([]);
    setFileName('pasted-data.csv');
    setColumns([]);
    setSampleRow({});
    setMapping({});
    setPreview(null);
    setResult(null);
    setStepError(null);
  };

  const filteredRows = useMemo(() => {
    if (!preview) return [];
    if (rowFilter === 'all') return preview.rows;
    return preview.rows.filter((r) => r.status === rowFilter);
  }, [preview, rowFilter]);

  const committableCount = useMemo(() => {
    if (!preview) return 0;
    return preview.validCount + (skipDuplicates ? 0 : preview.duplicateCount);
  }, [preview, skipDuplicates]);

  return (
    <Card>
      <CardHeader
        title="CSV Import Wizard"
        description="Bulk import properties or compliance certificates in four guided steps."
        actions={
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={submitting}>
            Start over
          </Button>
        }
      />

      {/* Stepper */}
      <nav aria-label="Import steps" className="mb-6">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((s) => {
            const active = step === s.id;
            const visited = s.id <= maxVisited && !result;
            const completed = s.id < step || !!result;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!visited || submitting}
                  onClick={() => visited && goToStep(s.id)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'focus-ring flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors',
                    active
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : completed
                        ? 'border-ok-200 bg-ok-50/50 text-ok-700 hover:bg-ok-50'
                        : 'border-line bg-surface-subtle text-ink-muted',
                    (!visited || submitting) && !active && 'cursor-not-allowed opacity-70',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                      active
                        ? 'bg-brand-600 text-white'
                        : completed
                          ? 'bg-ok-600 text-white'
                          : 'bg-surface border border-line text-ink-muted',
                    )}
                  >
                    {completed && !active ? '✓' : s.id}
                  </span>
                  <span className="truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {stepError && (
        <Alert tone="error" title="Check your import" className="mb-4">
          {stepError}
        </Alert>
      )}

      {/* Step 1: Upload or Paste */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink">What are you importing?</span>
              <SegmentedControl
                label="Import type"
                value={importType}
                onChange={(v) => handleTypeChange(v as ImportType)}
                items={[
                  { value: 'properties', label: 'Properties' },
                  { value: 'certificates', label: 'Certificates' },
                ]}
              />
            </div>

            <Select
              label="Date format in CSV"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value as ImportDateFormat)}
              options={DATE_FORMAT_OPTIONS}
              hint="Used when parsing issue, expiry, and review dates."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-subtle px-4 py-3">
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              <FileSpreadsheet className="h-4 w-4 text-brand-600" aria-hidden />
              <span>
                Need an example? Load a sample {importType} CSV (includes valid, duplicate, and error rows).
              </span>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleLoadSample}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Load sample CSV
            </Button>
          </div>

          <FileDropzone
            label="Upload CSV file"
            accept=".csv,text/csv"
            maxSizeBytes={2 * 1024 * 1024}
            files={uploadedFiles}
            onFilesChange={handleFileSelect}
            hint={fileName && csvText ? `Loaded: ${fileName}` : 'CSV files up to 2 MB'}
          />

          <Textarea
            label="Or paste CSV data directly"
            rows={7}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              if (!fileName || fileName.startsWith('sample-')) setFileName('pasted-data.csv');
            }}
            placeholder={
              importType === 'properties'
                ? 'Reference,Property Name,Address Line 1,City,Postcode,Property Type\nPROP-010,Cedar Mews,18 Cedar Way,Manchester,M4 5AA,residential'
                : 'Property Ref,Compliance Code,Issue Date,Expiry Date,Notes\nPROP-001,FRA,15/11/2026,15/11/2027,Annual inspection'
            }
          />

          <div className="flex justify-end">
            <Button type="button" onClick={handleStep1Next}>
              Next: Map columns
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="text-[13.5px] text-ink-muted">
            We auto-detected matching columns from <span className="font-medium text-ink">{fileName}</span>. Review or adjust
            the mapping below before validating rows.
          </p>

          <div className="divide-y divide-line rounded-lg border border-line">
            {fields.map((field) => {
              const selectedCol = mapping[field.key] ?? '';
              const sampleVal = selectedCol ? sampleRow[selectedCol] : '';
              return (
                <div
                  key={field.key}
                  className="grid items-center gap-3 p-3.5 sm:grid-cols-[220px_1fr_200px]"
                >
                  <div>
                    <span className="text-[13.5px] font-medium text-ink">
                      {field.label}
                      {field.required && <span className="ml-1 text-danger-600">*</span>}
                    </span>
                    <p className="text-[12px] text-ink-muted">{field.required ? 'Required' : 'Optional'}</p>
                  </div>

                  <Select
                    aria-label={`CSV column for ${field.label}`}
                    value={selectedCol}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    options={[
                      { value: '', label: '— Not mapped —' },
                      ...columns.map((c) => ({ value: c, label: c })),
                    ]}
                  />

                  <div className="truncate rounded bg-surface-subtle px-2.5 py-1.5 text-[12px] text-ink-muted">
                    {sampleVal ? (
                      <>
                        <span className="font-medium text-ink">Row 1:</span> {sampleVal}
                      </>
                    ) : (
                      <span>No sample value</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => goToStep(1)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </Button>
            <Button type="button" onClick={handleStep2Next} isLoading={submitting}>
              Next: Preview & validate
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Validate */}
      {step === 3 && preview && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-line bg-surface-subtle p-3">
              <p className="text-[12px] text-ink-muted">Total rows</p>
              <p className="mt-0.5 text-[20px] font-bold text-ink">{preview.totalRows}</p>
            </div>
            <div className="rounded-lg border border-ok-200 bg-ok-50/50 p-3">
              <p className="text-[12px] text-ok-700">Valid</p>
              <p className="mt-0.5 text-[20px] font-bold text-ok-700">{preview.validCount}</p>
            </div>
            <div className="rounded-lg border border-warn-200 bg-warn-50/50 p-3">
              <p className="text-[12px] text-warn-700">Duplicates</p>
              <p className="mt-0.5 text-[20px] font-bold text-warn-700">{preview.duplicateCount}</p>
            </div>
            <div className="rounded-lg border border-danger-200 bg-danger-50/50 p-3">
              <p className="text-[12px] text-danger-700">Errors</p>
              <p className="mt-0.5 text-[20px] font-bold text-danger-700">{preview.errorCount}</p>
            </div>
          </div>

          {preview.duplicateCount > 0 && (
            <Alert tone="warning" title={`${preview.duplicateCount} duplicate warning(s) detected`}>
              <Checkbox
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                label="Skip duplicate rows during commit (recommended)"
              />
            </Alert>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              label="Filter preview rows"
              value={rowFilter}
              onChange={(v) => setRowFilter(v as RowFilter)}
              items={[
                { value: 'all', label: `All (${preview.totalRows})` },
                { value: 'valid', label: `Valid (${preview.validCount})` },
                { value: 'duplicate', label: `Duplicates (${preview.duplicateCount})` },
                { value: 'error', label: `Errors (${preview.errorCount})` },
              ]}
            />
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <thead>
                <tr>
                  <TH>Row</TH>
                  <TH>Status</TH>
                  <TH>{preview.type === 'properties' ? 'Reference & Name' : 'Property & Type'}</TH>
                  <TH>{preview.type === 'properties' ? 'Location & Type' : 'Dates'}</TH>
                  <TH>Validation</TH>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.row}>
                    <TD className="font-mono text-[12px] text-ink-muted">#{r.row}</TD>
                    <TD>
                      <Badge
                        tone={r.status === 'valid' ? 'ok' : r.status === 'duplicate' ? 'warn' : 'danger'}
                      >
                        {r.status === 'valid' ? 'Valid' : r.status === 'duplicate' ? 'Duplicate' : 'Error'}
                      </Badge>
                    </TD>
                    <TD>
                      {preview.type === 'properties' ? (
                        <div>
                          <div className="font-medium text-ink">{r.mapped.name || '—'}</div>
                          <div className="text-[12px] text-ink-muted">{r.mapped.reference || '—'}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-ink">{r.mapped.propertyReference || '—'}</div>
                          <div className="text-[12px] text-ink-muted">{r.mapped.complianceCode || '—'}</div>
                        </div>
                      )}
                    </TD>
                    <TD className="text-[13px] text-ink-muted">
                      {preview.type === 'properties'
                        ? `${r.mapped.city || '—'} · ${r.mapped.postcode || '—'} (${r.mapped.type || '—'})`
                        : `Issued: ${r.mapped.issueDate || '—'}${r.mapped.expiryDate ? ` · Exp: ${r.mapped.expiryDate}` : ''}`}
                    </TD>
                    <TD className="text-[12.5px]">
                      {r.errors.length > 0 ? (
                        <ul className="list-disc space-y-0.5 pl-4 text-danger-700">
                          {r.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      ) : r.warning ? (
                        <span className="inline-flex items-center gap-1 text-warn-700">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {r.warning}
                        </span>
                      ) : (
                        <span className="text-ok-700">Ready to import</span>
                      )}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 sm:hidden">
            {filteredRows.map((r) => (
              <div key={r.row} className="rounded-lg border border-line p-3 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] text-ink-muted">Row #{r.row}</span>
                  <Badge tone={r.status === 'valid' ? 'ok' : r.status === 'duplicate' ? 'warn' : 'danger'}>
                    {r.status}
                  </Badge>
                </div>
                <p className="mt-1.5 font-medium text-ink">
                  {preview.type === 'properties'
                    ? `${r.mapped.reference || '—'} · ${r.mapped.name || '—'}`
                    : `${r.mapped.propertyReference || '—'} · ${r.mapped.complianceCode || '—'}`}
                </p>
                {r.errors.length > 0 && (
                  <p className="mt-1 text-[12px] text-danger-700">{r.errors.join(' ')}</p>
                )}
                {r.warning && <p className="mt-1 text-[12px] text-warn-700">{r.warning}</p>}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => goToStep(2)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to mapping
            </Button>
            <Button
              type="button"
              onClick={() => goToStep(4)}
              disabled={committableCount === 0}
            >
              Next: Confirm ({committableCount} row{committableCount === 1 ? '' : 's'})
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm & Commit */}
      {step === 4 && preview && !result && (
        <div className="space-y-5">
          <div className="rounded-xl border border-line bg-surface-subtle p-5">
            <h3 className="text-[16px] font-semibold text-ink">Ready to commit import</h3>
            <dl className="mt-3 grid gap-3 text-[13.5px] sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">Import type</dt>
                <dd className="font-medium capitalize text-ink">{preview.type}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Source file</dt>
                <dd className="font-medium text-ink">{preview.fileName}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Date format</dt>
                <dd className="font-medium text-ink">{preview.dateFormat}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Rows to import</dt>
                <dd className="font-semibold text-ok-700">
                  {committableCount} valid row{committableCount === 1 ? '' : 's'}
                  {preview.duplicateCount > 0 && skipDuplicates ? ` (${preview.duplicateCount} duplicate skipped)` : ''}
                  {preview.errorCount > 0 ? ` (${preview.errorCount} error skipped)` : ''}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="secondary" onClick={() => goToStep(3)} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to preview
            </Button>
            <Button type="button" onClick={handleCommit} isLoading={submitting}>
              <Upload className="h-4 w-4" aria-hidden />
              Commit {committableCount} row{committableCount === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}

      {/* Completed state */}
      {result && (
        <div className="space-y-4 rounded-xl border border-ok-200 bg-ok-50/40 p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-ok-600" aria-hidden />
          <div>
            <h3 className="text-[18px] font-semibold text-ink">Import completed</h3>
            <p className="mt-1 text-[14px] text-ink-muted">
              Imported <span className="font-semibold text-ink">{result.importedCount}</span> row
              {result.importedCount === 1 ? '' : 's'} · Skipped{' '}
              <span className="font-semibold text-ink">{result.skippedCount}</span> · Errors{' '}
              <span className="font-semibold text-ink">{result.errorCount}</span>
            </p>
          </div>
          <div className="flex justify-center">
            <Button type="button" onClick={handleReset}>
              Run another import
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
