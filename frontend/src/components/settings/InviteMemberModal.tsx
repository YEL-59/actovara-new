'use client';

import React, { useEffect, useState } from 'react';
import { Mail, UserPlus } from 'lucide-react';
import { Alert, Button, Input, Modal, Select } from '@/components/ui';
import { errorMessage, isApiError, teamService } from '@/services';
import type { Role } from '@/types/domain';
import { useToast } from '@/components/ui';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  seatsRemaining: number;
  onInvited: () => void;
}

export function InviteMemberModal({ open, onClose, seatsRemaining, onInvited }: InviteMemberModalProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<Role, 'platform_admin'>>('manager');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
      setRole('manager');
      setFormError(null);
      setFieldErrors({});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Enter their full name.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await teamService.invite({ name: name.trim(), email: email.trim(), role });
      toast({ tone: 'success', title: res.message ?? 'Invitation sent' });
      onInvited();
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
      size="sm"
      title="Invite team member"
      description="Send an invitation link to join this organisation."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-member-form"
            isLoading={submitting}
            disabled={seatsRemaining <= 0}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Send invitation
          </Button>
        </>
      }
    >
      <form id="invite-member-form" onSubmit={handleSubmit} className="space-y-4">
        {seatsRemaining <= 0 && (
          <Alert tone="warning" title="Seat limit reached">
            All seats in your plan are currently in use. Deactivate an existing member before inviting someone new.
          </Alert>
        )}
        {formError && <Alert tone="error" title="Could not send invitation">{formError}</Alert>}
        <Input
          label="Full name"
          required
          placeholder="e.g. Priya Shah"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldErrors((p) => ({ ...p, name: '' }));
          }}
          error={fieldErrors.name}
        />
        <Input
          label="Email address"
          type="email"
          required
          leftIcon={<Mail />}
          placeholder="name@company.example"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((p) => ({ ...p, email: '' }));
          }}
          error={fieldErrors.email}
        />
        <Select
          label="Role"
          required
          value={role}
          onChange={(e) => setRole(e.target.value as Exclude<Role, 'platform_admin'>)}
          options={[
            { value: 'manager', label: 'Manager — manage properties, certificates & actions' },
            { value: 'org_admin', label: 'Org Admin — full access including team, settings & verification' },
          ]}
          hint="Managers cannot verify/close actions or edit organisation settings."
        />
      </form>
    </Modal>
  );
}
