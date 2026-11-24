'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Archive, CalendarCheck, CalendarClock } from 'lucide-react';
import { Alert, Button, Checkbox, Input, Modal, Switch, Textarea, useToast } from '@/components/ui';
import { DEFAULT_DOCUMENT_CATEGORIES, expiryMode } from '@/lib/documents';
import { cn } from '@/lib/utils';
import { complianceTypesService, errorMessage, isApiError } from '@/services';
import type { ComplianceType, ExpiryMode, PropertyType } from '@/types/domain';

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'hmo', label: 'HMO' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed Use' },
];

const EXPIRY_OPTIONS: { value: ExpiryMode; title: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'renewal',
    title: 'Fixed renewal cycle',
    description: 'Expiry is calculated from the issue date. It can still be changed on upload.',
    icon: <CalendarClock />,
  },
  {
    value: 'on_upload',
    title: 'Expiry date entered on upload',
    description: 'For documents with their own end date, e.g. insurance policies or tenancy agreements.',
    icon: <CalendarCheck />,
  },
  {
    value: 'none',
    title: 'No expiry (store only)',
    description: 'Kept on file against the property. No expiry date and no reminders.',
    icon: <Archive />,
  },
];

interface ComplianceTypeModalProps {
  open: boolean;
  onClose: () => void;
  editing: ComplianceType | null;
  onSaved: () => void;
  /** Categories already used in the catalogue (offered as suggestions alongside the defaults). */
  categories?: string[];
}

/** Org Admin form for compliance certificates and any other property document type (tenancy, insurance, contracts…). */
export function ComplianceTypeModal({ open, onClose, editing, onSaved, categories = [] }: ComplianceTypeModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Other');
  const [applicableTo, setApplicableTo] = useState<PropertyType[]>(['residential', 'hmo']);
  const [mode, setMode] = useState<ExpiryMode>('renewal');
  const [defaultRenewalMonths, setDefaultRenewalMonths] = useState('12');
  const [countsTowardsRag, setCountsTowardsRag] = useState(true);
  const [sortOrder, setSortOrder] = useState('10');
  const [active, setActive] = useState(true);
  const [legislation, setLegislation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const categoryOptions = useMemo(
    () => Array.from(new Set([...DEFAULT_DOCUMENT_CATEGORIES, ...categories.filter(Boolean)])).sort((a, b) => a.localeCompare(b)),
    [categories],
  );

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setFieldErrors({});
    if (editing) {
      setName(editing.name);
      setCode(editing.code);
      setCategory(editing.category || 'Other');
      setApplicableTo(editing.applicableTo);
      setMode(expiryMode(editing));
      setDefaultRenewalMonths(editing.defaultRenewalMonths ? String(editing.defaultRenewalMonths) : '12');
      setCountsTowardsRag(editing.affectsRag !== false);
      setSortOrder(String(editing.sortOrder));
      setActive(editing.active);
      const latest = editing.legislationRefs[editing.legislationRefs.length - 1];
      setLegislation(latest?.text ?? '');
    } else {
      setName('');
      setCode('');
      setCategory('Other');
      setApplicableTo(['residential', 'hmo']);
      setMode('renewal');
      setDefaultRenewalMonths('12');
      setCountsTowardsRag(true);
      setSortOrder('15');
      setActive(true);
      setLegislation('');
    }
  }, [open, editing]);

  const clearError = (key: string) => setFieldErrors((p) => (p[key] ? { ...p, [key]: '' } : p));

  const toggleType = (pt: PropertyType) => {
    setApplicableTo((prev) => (prev.includes(pt) ? prev.filter((x) => x !== pt) : [...prev, pt]));
    clearError('applicableTo');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter a document type name.';
    if (!editing && !code.trim()) errs.code = 'Enter a short code (e.g. GSC, TEN).';
    if (!category.trim()) errs.category = 'Enter or choose a category.';
    if (applicableTo.length === 0) errs.applicableTo = 'Select at least one property type.';
    const monthsNum = Number(defaultRenewalMonths);
    if (mode === 'renewal' && (!Number.isFinite(monthsNum) || monthsNum < 1 || monthsNum > 120)) {
      errs.defaultRenewalMonths = 'Enter a renewal cycle between 1 and 120 months.';
    }
    const orderNum = Number(sortOrder);
    if (!Number.isFinite(orderNum) || orderNum < 1) errs.sortOrder = 'Enter a sort order of 1 or more.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const expiryFields = {
      storeOnly: mode === 'none',
      defaultRenewalMonths: mode === 'renewal' ? monthsNum : null,
    };

    setSubmitting(true);
    try {
      const res = editing
        ? await complianceTypesService.update(editing._id, {
            name: name.trim(),
            category: category.trim(),
            applicableTo,
            ...expiryFields,
            affectsRag: countsTowardsRag,
            active,
            sortOrder: orderNum,
            legislation: legislation.trim() || undefined,
          })
        : await complianceTypesService.create({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            category: category.trim(),
            applicableTo,
            ...expiryFields,
            affectsRag: countsTowardsRag,
            sortOrder: orderNum,
            legislation: legislation.trim() || undefined,
          });
      toast.success(res.message ?? (editing ? 'Document type updated' : 'Document type added'));
      onSaved();
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorSources?.length) {
        const mapped: Record<string, string> = {};
        err.errorSources.forEach((s) => {
          if (s.path) mapped[s.path] = s.message;
        });
        setFieldErrors(mapped);
      }
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? `Edit ${editing.name}` : 'Add document type'}
      description={
        editing
          ? 'Changes apply to every property. Editing the legislation text creates a new version in the history.'
          : 'Add a compliance certificate or any other property document, e.g. tenancy agreements, insurance or maintenance contracts.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="compliance-type-form" isLoading={submitting}>
            {editing ? 'Save changes' : 'Add document type'}
          </Button>
        </>
      }
    >
      <form id="compliance-type-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <Alert tone="error" title="Could not save document type">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            placeholder="e.g. Tenancy Agreement"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('name');
            }}
            error={fieldErrors.name}
          />
          <Input
            label="Code"
            required
            disabled={!!editing}
            placeholder="e.g. TEN"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              clearError('code');
            }}
            hint={editing ? 'Code cannot be changed once created.' : 'Short uppercase identifier, used in CSV imports.'}
            error={fieldErrors.code}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Input
              label="Category"
              required
              list="document-category-options"
              placeholder="Choose or type a new category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                clearError('category');
              }}
              hint="Pick one from the list or type your own."
              error={fieldErrors.category}
            />
            <datalist id="document-category-options">
              {categoryOptions.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <Input
            label="Sort order"
            type="number"
            min={1}
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              clearError('sortOrder');
            }}
            error={fieldErrors.sortOrder}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-ink">
            Applicable property types <span className="text-danger-600">*</span>
          </span>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-line p-3 sm:grid-cols-4">
            {PROPERTY_TYPE_OPTIONS.map((pt) => (
              <Checkbox key={pt.value} label={pt.label} checked={applicableTo.includes(pt.value)} onChange={() => toggleType(pt.value)} />
            ))}
          </div>
          {fieldErrors.applicableTo ? (
            <p className="text-meta font-medium text-danger-700" role="alert">
              {fieldErrors.applicableTo}
            </p>
          ) : (
            <p className="text-meta text-ink-muted">Added to every existing property of these types straight away, and to new ones.</p>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-ink">Expiry and renewal</legend>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {EXPIRY_OPTIONS.map((o) => (
              <label
                key={o.value}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-1',
                  mode === o.value ? 'border-brand-600 bg-brand-50' : 'border-line bg-surface hover:bg-canvas',
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ink [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-brand-600">
                  <input
                    type="radio"
                    name="expiry-mode"
                    value={o.value}
                    checked={mode === o.value}
                    onChange={() => {
                      setMode(o.value);
                      clearError('defaultRenewalMonths');
                    }}
                    className="h-4 w-4 shrink-0 accent-brand-600"
                  />
                  {o.icon}
                  {o.title}
                </span>
                <span className="text-meta text-ink-muted">{o.description}</span>
              </label>
            ))}
          </div>
          {mode === 'renewal' && (
            <Input
              label="Renewal cycle (months)"
              type="number"
              min={1}
              max={120}
              required
              className="sm:max-w-xs"
              value={defaultRenewalMonths}
              placeholder="12"
              onChange={(e) => {
                setDefaultRenewalMonths(e.target.value);
                clearError('defaultRenewalMonths');
              }}
              error={fieldErrors.defaultRenewalMonths}
            />
          )}
        </fieldset>

        <div className="space-y-3 rounded-lg border border-line bg-canvas p-4">
          <Switch
            label="Counts towards RAG status"
            description={
              countsTowardsRag
                ? 'A missing, due-soon or overdue document turns the property amber or red.'
                : 'Stored and tracked against the property, but it never changes the RAG status, dashboard counts or compliance gauge.'
            }
            checked={countsTowardsRag}
            onChange={setCountsTowardsRag}
          />
          {editing && (
            <Switch
              label="Active in catalogue"
              description="Inactive types are not added to new properties."
              checked={active}
              onChange={setActive}
            />
          )}
        </div>

        <Textarea
          label="Legislation or guidance reference"
          rows={3}
          placeholder="e.g. Housing Act 2004, sections 212 to 215"
          value={legislation}
          onChange={(e) => setLegislation(e.target.value)}
          hint={
            editing
              ? 'Saving modified text appends a new legislation version while preserving older versions.'
              : 'Optional. Leave blank for non-statutory documents.'
          }
        />
      </form>
    </Modal>
  );
}
