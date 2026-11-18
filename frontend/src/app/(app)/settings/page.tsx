'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Mail, Phone, Save } from 'lucide-react';
import { SettingsFormSkeleton } from '@/components/settings';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Input, Select, useToast } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDate } from '@/lib/format';
import { useSession } from '@/lib/session-mock';
import { errorMessage, isApiError, organisationService } from '@/services';

const TIMEZONE_OPTIONS = [
  { value: 'Europe/London', label: 'Europe/London (UK — GMT / BST)' },
  { value: 'Europe/Dublin', label: 'Europe/Dublin (Ireland)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

export default function OrganisationSettingsPage() {
  const { can } = useSession();
  const { toast } = useToast();
  const canEdit = can('org.settings');

  const { data: org, error, loading, reload } = useApi(() => organisationService.get(), []);

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [timezone, setTimezone] = useState('Europe/London');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!org) return;
    setName(org.name ?? '');
    setLegalName(org.legalName ?? '');
    setEmail(org.email ?? '');
    setPhone(org.phone ?? '');
    setLine1(org.address?.line1 ?? '');
    setLine2(org.address?.line2 ?? '');
    setCity(org.address?.city ?? '');
    setPostcode(org.address?.postcode ?? '');
    setTimezone(org.settings?.timezone ?? 'Europe/London');
  }, [org]);

  if (loading) return <SettingsFormSkeleton />;

  if (error) {
    return (
      <Alert tone="error" title="Could not load organisation profile" onRetry={reload}>
        {error}
      </Alert>
    );
  }

  if (!org) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="h-7 w-7" />}
          title="No organisation found"
          description="Organisation details are not available right now."
        />
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSaveError(null);
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Enter the organisation name.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!line1.trim()) errs['address.line1'] = 'Enter the street address.';
    if (!city.trim()) errs['address.city'] = 'Enter the city.';
    if (!postcode.trim()) errs['address.postcode'] = 'Enter the postcode.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const res = await organisationService.update({
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        address: {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          postcode: postcode.trim().toUpperCase(),
        },
        timezone,
      });
      toast({ tone: 'success', title: res.message ?? 'Organisation saved' });
    } catch (err) {
      if (isApiError(err) && err.errorSources?.length) {
        const mapped: Record<string, string> = {};
        err.errorSources.forEach((s) => {
          if (s.path) mapped[s.path] = s.message;
        });
        setFieldErrors(mapped);
      }
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!canEdit && (
        <Alert tone="info" title="Read-only view">
          Only Organisation Admins can update the organisation profile. Contact your admin if any details need changing.
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Organisation Profile"
          description="Details shown on compliance reports and landlord communications."
          actions={
            <div className="flex items-center gap-2">
              <Badge tone={org.status === 'active' ? 'ok' : 'danger'}>
                {org.status === 'active' ? 'Active' : 'Suspended'}
              </Badge>
              <Badge tone="neutral">{org.seatLimit} seats</Badge>
            </div>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          {saveError && <Alert tone="error" title="Could not save organisation">{saveError}</Alert>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Organisation name"
              required
              disabled={!canEdit}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((p) => ({ ...p, name: '' }));
              }}
              error={fieldErrors.name}
            />
            <Input
              label="Legal entity name"
              disabled={!canEdit}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Demo Lettings Limited"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Primary contact email"
              type="email"
              required
              disabled={!canEdit}
              leftIcon={<Mail />}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: '' }));
              }}
              error={fieldErrors.email}
            />
            <Input
              label="Phone number"
              type="tel"
              disabled={!canEdit}
              leftIcon={<Phone />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0161 496 0000"
            />
          </div>

          <div className="border-t border-line pt-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">Registered address &amp; timezone</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Address line 1"
                required
                disabled={!canEdit}
                value={line1}
                onChange={(e) => {
                  setLine1(e.target.value);
                  setFieldErrors((p) => ({ ...p, 'address.line1': '' }));
                }}
                error={fieldErrors['address.line1']}
              />
              <Input
                label="Address line 2"
                disabled={!canEdit}
                value={line2}
                onChange={(e) => setLine2(e.target.value)}
                placeholder="Suite, floor or building (optional)"
              />
              <Input
                label="City / Town"
                required
                disabled={!canEdit}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setFieldErrors((p) => ({ ...p, 'address.city': '' }));
                }}
                error={fieldErrors['address.city']}
              />
              <Input
                label="Postcode"
                required
                disabled={!canEdit}
                value={postcode}
                onChange={(e) => {
                  setPostcode(e.target.value);
                  setFieldErrors((p) => ({ ...p, 'address.postcode': '' }));
                }}
                error={fieldErrors['address.postcode']}
              />
              <Select
                label="Timezone"
                disabled={!canEdit}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={TIMEZONE_OPTIONS}
                hint="Used for reminder schedules and report timestamps."
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-meta text-ink-muted">Organisation created {formatDate(org.createdAt)}</span>
            {canEdit && (
              <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
                Save changes
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
