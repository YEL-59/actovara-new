'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Trash2, Upload } from 'lucide-react';
import { Alert, Button, Input, Modal, Select, useToast } from '@/components/ui';
import { useSession } from '@/lib/session-mock';
import { errorMessage, isApiError, propertiesService, teamService, UK_POSTCODE_RE, type PropertyInput } from '@/services';
import type { Property, PropertyType, User } from '@/types/domain';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'hmo', label: 'HMO' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed', label: 'Mixed use' },
];

export const DEFAULT_PHOTO = '/images/properties/wellington-court.svg';

const PHOTO_PRESETS = [
  { value: '', label: 'Default building illustration' },
  { value: '/images/properties/brookfield-house.svg', label: 'Red brick apartment block' },
  { value: '/images/properties/maple-court.svg', label: 'Victorian terrace row' },
  { value: '/images/properties/riverside-business-park.svg', label: 'Modern glass office' },
  { value: '/images/properties/wellington-court.svg', label: 'Contemporary residential block' },
  { value: '/images/properties/oakfield-house.svg', label: 'Stone townhouse' },
  { value: '/images/properties/hillside-works.svg', label: 'Industrial / warehouse unit' },
  { value: '/images/properties/elm-house.svg', label: 'Suburban residential block' },
  { value: '/images/properties/westpark-business-centre.svg', label: 'Business park pavilion' },
];

interface ContactDraft {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface PropertyFormModalProps {
  open: boolean;
  property?: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
}

export function PropertyFormModal({ open, property, onClose, onSaved }: PropertyFormModalProps) {
  const isEdit = !!property;
  const toast = useToast();
  const { can, user } = useSession();

  const [name, setName] = useState('');
  const [reference, setReference] = useState('');
  const [type, setType] = useState<PropertyType>('residential');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [units, setUnits] = useState('');
  const [floors, setFloors] = useState('');
  const [managerId, setManagerId] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [contacts, setContacts] = useState<ContactDraft[]>([]);

  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFieldErrors({});
    setFormError(null);
    setPhotoError(null);
    if (property) {
      setName(property.name);
      setReference(property.reference);
      setType(property.type);
      setLine1(property.address.line1);
      setLine2(property.address.line2 ?? '');
      setCity(property.address.city);
      setPostcode(property.address.postcode);
      setUnits(property.units != null ? String(property.units) : '');
      setFloors(property.floors != null ? String(property.floors) : '');
      setManagerId(property.managerId ?? '');
      setCoverImageUrl(property.coverImageUrl ?? '');
      setContacts(
        property.contacts.map((c) => ({
          name: c.name,
          role: c.role ?? '',
          email: c.email ?? '',
          phone: c.phone ?? '',
        })),
      );
    } else {
      setName('');
      setReference('');
      setType('residential');
      setLine1('');
      setLine2('');
      setCity('');
      setPostcode('');
      setUnits('');
      setFloors('');
      setManagerId(user?._id ?? '');
      setCoverImageUrl('/images/properties/brookfield-house.svg');
      setContacts([]);
    }
  }, [open, property, user?._id]);

  useEffect(() => {
    if (!open || !can('team.manage')) return;
    let active = true;
    teamService
      .list()
      .then((res) => {
        if (active) setTeamUsers(res.data.users.filter((u) => u.status === 'active'));
      })
      .catch(() => {
        // Non-blocking: manager dropdown falls back to current user.
      });
    return () => {
      active = false;
    };
  }, [open, can]);

  const validateClient = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter the property name.';
    if (!line1.trim()) next['address.line1'] = 'Enter the first line of the address.';
    if (!city.trim()) next['address.city'] = 'Enter the town or city.';
    if (!postcode.trim()) {
      next['address.postcode'] = 'Enter the postcode.';
    } else if (!UK_POSTCODE_RE.test(postcode.trim())) {
      next['address.postcode'] = 'Enter a valid UK postcode (e.g. M14 6TP).';
    }
    if (units && (Number(units) < 0 || !Number.isInteger(Number(units)))) {
      next.units = 'Enter a whole number of units.';
    }
    if (floors && (Number(floors) < 0 || !Number.isInteger(Number(floors)))) {
      next.floors = 'Enter a whole number of floors.';
    }
    contacts.forEach((c, i) => {
      const touched = c.name.trim() || c.role.trim() || c.email.trim() || c.phone.trim();
      if (touched && !c.name.trim()) next[`contacts.${i}.name`] = 'Enter the contact name, or remove this contact.';
      if (c.email.trim() && !EMAIL_RE.test(c.email.trim())) next[`contacts.${i}.email`] = 'Enter a valid email address.';
    });
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validateClient()) return;

    const payload: PropertyInput = {
      name: name.trim(),
      reference: reference.trim() || undefined,
      type,
      address: {
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        postcode: postcode.trim().toUpperCase(),
      },
      units: units.trim() ? Number(units) : undefined,
      floors: floors.trim() ? Number(floors) : undefined,
      managerId: managerId || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      contacts: contacts
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          role: c.role.trim() || undefined,
          email: c.email.trim() || undefined,
          phone: c.phone.trim() || undefined,
        })),
    };

    setSubmitting(true);
    try {
      const res = isEdit && property
        ? await propertiesService.update(property._id, payload)
        : await propertiesService.create(payload);
      toast.success(
        isEdit ? 'Property updated' : 'Property created',
        isEdit
          ? `${res.data.name} has been updated.`
          : `${res.data.name} added and compliance requirements seeded.`,
      );
      onSaved(res.data);
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorSources.length > 0) {
        setFieldErrors((prev) => ({
          ...prev,
          ...Object.fromEntries(err.errorSources.map((src) => [src.path, src.message])),
        }));
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addContact = () => {
    setContacts((prev) => [...prev, { name: '', role: '', email: '', phone: '' }]);
  };

  const updateContact = (index: number, patch: Partial<ContactDraft>) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const managerOptions = [
    { value: '', label: 'Unassigned' },
    ...(teamUsers.length > 0
      ? teamUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.jobTitle || u.role})` }))
      : user
        ? [{ value: user._id, label: `${user.name} (You)` }]
        : []),
  ];
  // Managers cannot list the team: keep the current assignee selectable so editing never silently unassigns.
  if (managerId && !managerOptions.some((o) => o.value === managerId)) {
    managerOptions.push({ value: managerId, label: 'Current manager' });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${property?.name}` : 'Add property'}
      description={
        isEdit
          ? 'Update property details, assigned manager, and site contacts.'
          : 'Requirements are automatically seeded from the compliance catalogue for the selected property type.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="property-form" isLoading={submitting}>
            {isEdit ? 'Save changes' : 'Create property'}
          </Button>
        </>
      }
    >
      <form id="property-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && (
          <Alert tone="error" title="Could not save property">
            {formError}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Property name"
            required
            placeholder="e.g. Brookfield House"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />
          <Input
            label="Reference"
            placeholder="Auto-generated if blank (e.g. REF-009)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            error={fieldErrors.reference}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Property type"
            required
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType)}
            options={PROPERTY_TYPE_OPTIONS}
          />
          <Input
            label="Units"
            type="number"
            min={0}
            placeholder="e.g. 12"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            error={fieldErrors.units}
          />
          <Input
            label="Floors"
            type="number"
            min={0}
            placeholder="e.g. 3"
            value={floors}
            onChange={(e) => setFloors(e.target.value)}
            error={fieldErrors.floors}
          />
        </div>

        <fieldset className="space-y-3 rounded-xl border border-line bg-canvas/50 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">Address</legend>
          <Input
            label="Address line 1"
            required
            placeholder="e.g. 12 Brookfield Road"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            error={fieldErrors['address.line1']}
          />
          <Input
            label="Address line 2 (optional)"
            placeholder="Building, suite, or estate"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Town / City"
              required
              placeholder="e.g. Manchester"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              error={fieldErrors['address.city']}
            />
            <Input
              label="Postcode"
              required
              placeholder="e.g. M14 6TP"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              error={fieldErrors['address.postcode']}
            />
          </div>
        </fieldset>

        <div className="space-y-4">
          <Select
            label="Assigned manager"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            options={managerOptions}
          />

          <div className="space-y-3 rounded-xl border border-line bg-canvas/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">Property photograph</h3>
                <p className="text-meta text-ink-muted">Upload a building photo (PNG, JPG, WebP up to 5 MB) or choose an illustration.</p>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  if (!file.type.startsWith('image/')) {
                    setPhotoError('Please select a valid image file (PNG, JPG, WebP, or SVG).');
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setPhotoError('Image must be 5 MB or smaller.');
                    return;
                  }
                  setPhotoError(null);
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setCoverImageUrl(reader.result);
                    }
                  };
                  reader.onerror = () => setPhotoError('Could not read the selected image.');
                  reader.readAsDataURL(file);
                }}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl || DEFAULT_PHOTO}
                  alt={name ? `${name} preview` : 'Property photograph preview'}
                  className="h-full w-full object-cover"
                />
                {!coverImageUrl && (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/70 px-2 py-0.5 text-center text-[11px] font-medium text-white">
                    Default illustration
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={coverImageUrl ? <Upload className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {coverImageUrl ? 'Replace photo' : 'Upload photo'}
                  </Button>
                  {coverImageUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      leftIcon={<Trash2 className="h-4 w-4" />}
                      onClick={() => {
                        setCoverImageUrl('');
                        setPhotoError(null);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <Select
                  label="Or select a preset illustration"
                  value={PHOTO_PRESETS.some((p) => p.value === coverImageUrl) ? coverImageUrl : ''}
                  onChange={(e) => {
                    setCoverImageUrl(e.target.value);
                    setPhotoError(null);
                  }}
                  options={PHOTO_PRESETS}
                />
              </div>
            </div>

            {photoError && (
              <p className="text-sm font-medium text-danger-700" role="alert">
                {photoError}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-line p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">Site contacts</h3>
              <p className="text-meta text-ink-muted">Keyholders, caretakers, or managing contacts.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addContact}>
              Add contact
            </Button>
          </div>

          {contacts.length === 0 ? (
            <p className="text-sm text-ink-muted">No contacts added yet.</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((c, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-3 rounded-lg border border-line bg-canvas/40 p-3 sm:grid-cols-2">
                  <Input
                    label="Name"
                    placeholder="Contact name"
                    required
                    value={c.name}
                    onChange={(e) => updateContact(idx, { name: e.target.value })}
                    error={fieldErrors[`contacts.${idx}.name`]}
                  />
                  <Input
                    label="Role"
                    placeholder="e.g. Caretaker, Landlord"
                    value={c.role}
                    onChange={(e) => updateContact(idx, { role: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="name@example.co.uk"
                    value={c.email}
                    onChange={(e) => updateContact(idx, { email: e.target.value })}
                    error={fieldErrors[`contacts.${idx}.email`]}
                  />
                  <div className="flex items-end gap-2">
                    <Input
                      label="Phone"
                      placeholder="07700 900123"
                      className="flex-1"
                      value={c.phone}
                      onChange={(e) => updateContact(idx, { phone: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove contact ${idx + 1}`}
                      onClick={() => removeContact(idx)}
                      className="mb-0.5 text-danger-700 hover:bg-danger-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
