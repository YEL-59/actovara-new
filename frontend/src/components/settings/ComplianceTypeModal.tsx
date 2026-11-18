'use client';

import React, { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, Input, Modal, Select, Switch, Textarea, useToast } from '@/components/ui';
import { complianceTypesService, errorMessage, isApiError } from '@/services';
import type { ComplianceType, PropertyType } from '@/types/domain';

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'hmo', label: 'HMO' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed Use' },
];

const CATEGORY_OPTIONS = [
  { value: 'Gas', label: 'Gas' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Fire', label: 'Fire Safety' },
  { value: 'Building Safety', label: 'Building Safety' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Water', label: 'Water' },
  { value: 'Asbestos', label: 'Asbestos' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Licensing', label: 'Licensing' },
  { value: 'Other', label: 'Other' },
];

interface ComplianceTypeModalProps {
  open: boolean;
  onClose: () => void;
  editing: ComplianceType | null;
  onSaved: () => void;
}

export function ComplianceTypeModal({ open, onClose, editing, onSaved }: ComplianceTypeModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Other');
  const [applicableTo, setApplicableTo] = useState<PropertyType[]>(['residential', 'hmo']);
  const [storeOnly, setStoreOnly] = useState(false);
  const [defaultRenewalMonths, setDefaultRenewalMonths] = useState('12');
  const [sortOrder, setSortOrder] = useState('10');
  const [active, setActive] = useState(true);
  const [legislation, setLegislation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setFieldErrors({});
    if (editing) {
      setName(editing.name);
      setCode(editing.code);
      setCategory(editing.category || 'Other');
      setApplicableTo(editing.applicableTo);
      setStoreOnly(editing.storeOnly);
      setDefaultRenewalMonths(editing.defaultRenewalMonths ? String(editing.defaultRenewalMonths) : '12');
      setSortOrder(String(editing.sortOrder));
      setActive(editing.active);
      const latest = editing.legislationRefs[editing.legislationRefs.length - 1];
      setLegislation(latest?.text ?? '');
    } else {
      setName('');
      setCode('');
      setCategory('Other');
      setApplicableTo(['residential', 'hmo']);
      setStoreOnly(false);
      setDefaultRenewalMonths('12');
      setSortOrder('15');
      setActive(true);
      setLegislation('');
    }
  }, [open, editing]);

  const toggleType = (pt: PropertyType) => {
    setApplicableTo((prev) => (prev.includes(pt) ? prev.filter((x) => x !== pt) : [...prev, pt]));
    setFieldErrors((p) => ({ ...p, applicableTo: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter a compliance type name.';
    if (!editing && !code.trim()) errs.code = 'Enter a short code (e.g. GSC, EICR).';
    if (applicableTo.length === 0) errs.applicableTo = 'Select at least one property type.';
    const monthsNum = Number(defaultRenewalMonths);
    if (!storeOnly && (!Number.isFinite(monthsNum) || monthsNum < 1 || monthsNum > 120)) {
      errs.defaultRenewalMonths = 'Enter a renewal cycle between 1 and 120 months.';
    }
    const orderNum = Number(sortOrder);
    if (!Number.isFinite(orderNum) || orderNum < 1) errs.sortOrder = 'Enter a sort order of 1 or more.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      if (editing) {
        await complianceTypesService.update(editing._id, {
          name: name.trim(),
          category,
          applicableTo,
          storeOnly,
          defaultRenewalMonths: storeOnly ? null : monthsNum,
          active,
          sortOrder: orderNum,
          legislation: legislation.trim() || undefined,
        });
        toast({ tone: 'success', title: 'Compliance type updated' });
      } else {
        await complianceTypesService.create({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          category,
          applicableTo,
          storeOnly,
          defaultRenewalMonths: storeOnly ? null : monthsNum,
          sortOrder: orderNum,
          legislation: legislation.trim() || undefined,
        });
        toast({ tone: 'success', title: 'Compliance type added' });
      }
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
      title={editing ? `Edit ${editing.name}` : 'Add compliance type'}
      description={
        editing
          ? 'Changes to legislation text automatically create a new version in the history.'
          : 'Define a custom compliance requirement for your organisation.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="compliance-type-form" isLoading={submitting}>
            {editing ? 'Save changes' : 'Add compliance type'}
          </Button>
        </>
      }
    >
      <form id="compliance-type-form" onSubmit={handleSubmit} className="space-y-4">
        {formError && <Alert tone="error" title="Could not save compliance type">{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            placeholder="e.g. Lift LOLER Inspection"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFieldErrors((p) => ({ ...p, name: '' }));
            }}
            error={fieldErrors.name}
          />
          <Input
            label="Code"
            required
            disabled={!!editing}
            placeholder="e.g. LOLER"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setFieldErrors((p) => ({ ...p, code: '' }));
            }}
            hint={editing ? 'Code cannot be changed once created.' : 'Short uppercase identifier.'}
            error={fieldErrors.code}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORY_OPTIONS} />
          <Input
            label="Sort order"
            type="number"
            min={1}
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              setFieldErrors((p) => ({ ...p, sortOrder: '' }));
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
              <Checkbox
                key={pt.value}
                label={pt.label}
                checked={applicableTo.includes(pt.value)}
                onChange={() => toggleType(pt.value)}
              />
            ))}
          </div>
          {fieldErrors.applicableTo && (
            <p className="text-meta font-medium text-danger-700" role="alert">
              {fieldErrors.applicableTo}
            </p>
          )}
        </div>

        <div className="grid gap-4 rounded-lg border border-line bg-canvas p-4 sm:grid-cols-2">
          <Switch
            label="Store-only document"
            description="No expiry date or automated reminders."
            checked={storeOnly}
            onChange={setStoreOnly}
          />
          <Input
            label="Default renewal (months)"
            type="number"
            min={1}
            max={120}
            disabled={storeOnly}
            required={!storeOnly}
            value={storeOnly ? '' : defaultRenewalMonths}
            placeholder={storeOnly ? 'N/A (store-only)' : '12'}
            onChange={(e) => {
              setDefaultRenewalMonths(e.target.value);
              setFieldErrors((p) => ({ ...p, defaultRenewalMonths: '' }));
            }}
            error={fieldErrors.defaultRenewalMonths}
          />
        </div>

        {editing && (
          <Switch
            label="Active in catalogue"
            description="Inactive types are hidden when seeding new properties."
            checked={active}
            onChange={setActive}
          />
        )}

        <Textarea
          label="Legislation reference"
          rows={3}
          placeholder="e.g. Gas Safety (Installation and Use) Regulations 1998, Reg. 36"
          value={legislation}
          onChange={(e) => setLegislation(e.target.value)}
          hint={
            editing
              ? 'Saving modified text appends a new legislation version while preserving older versions.'
              : 'Optional statutory or guidance reference.'
          }
        />
      </form>
    </Modal>
  );
}
