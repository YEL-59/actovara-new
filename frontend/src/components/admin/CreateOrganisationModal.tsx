'use client';

import React, { useState } from 'react';
import { Alert, Button, Input, Modal, useToast } from '@/components/ui';
import { adminService, errorMessage, isApiError } from '@/services';

interface CreateOrganisationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateOrganisationModal({ open, onClose, onCreated }: CreateOrganisationModalProps) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [seatLimit, setSeatLimit] = useState('15');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setName('');
    setLegalName('');
    setEmail('');
    setPhone('');
    setLine1('');
    setLine2('');
    setCity('');
    setPostcode('');
    setSeatLimit('15');
    setAdminName('');
    setAdminEmail('');
    setFormError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await adminService.createOrganisation({
        name,
        legalName: legalName || undefined,
        email,
        phone: phone || undefined,
        address: { line1, line2: line2 || undefined, city, postcode },
        seatLimit: Number(seatLimit || 15),
        adminName,
        adminEmail,
      });
      toast({
        tone: 'success',
        title: 'Organisation created',
        description: res.message || `Invite sent to ${adminEmail}.`,
      });
      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      if (isApiError(err) && err.errorSources.length > 0) {
        const mapped: Record<string, string> = {};
        for (const src of err.errorSources) {
          if (src.path) mapped[src.path] = src.message;
        }
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
      onClose={handleClose}
      title="New organisation"
      description="Create a customer workspace and invite its first Organisation Admin."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <Alert tone="error" title="Could not create organisation">
            {formError}
          </Alert>
        )}

        <div className="space-y-3">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
            Organisation details
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Organisation name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oakwood Lettings"
              error={fieldErrors.name}
            />
            <Input
              label="Legal entity name (optional)"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. Oakwood Lettings Ltd"
            />
            <Input
              label="Organisation contact email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="compliance@oakwood.example"
              error={fieldErrors.email}
            />
            <Input
              label="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="020 7946 0123"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Address line 1"
              required
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="12 High Street"
              error={fieldErrors['address.line1']}
            />
            <Input
              label="Address line 2 (optional)"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Suite 4"
            />
            <Input
              label="City / Town"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="London"
              error={fieldErrors['address.city']}
            />
            <Input
              label="Postcode"
              required
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="SW1A 1AA"
              error={fieldErrors['address.postcode']}
            />
          </div>

          <div className="sm:w-48">
            <Input
              label="Seat limit"
              type="number"
              min={1}
              max={500}
              required
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              error={fieldErrors.seatLimit}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
            First Organisation Admin
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Admin full name"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              error={fieldErrors.adminName}
            />
            <Input
              label="Admin email"
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="sarah.jenkins@oakwood.example"
              error={fieldErrors.adminEmail}
              hint="Receives an invitation link valid for 7 days."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Create & send invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
