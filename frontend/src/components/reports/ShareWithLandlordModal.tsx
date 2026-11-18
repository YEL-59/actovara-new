'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import { Alert, Badge, Button, DatePicker, Input, Modal, useToast } from '@/components/ui';
import { useSession } from '@/lib/session-mock';
import { errorMessage, SHARE_DEFAULT_DAYS, SHARE_MAX_DAYS, sharingService } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

/** Local `YYYY-MM-DD`, `days` from today. */
function dateInDays(days: number) {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const defaultExpiryDate = () => dateInDays(SHARE_DEFAULT_DAYS);

export function ShareWithLandlordModal({ open, onClose, propertyId, propertyName }: Props) {
  const { can } = useSession();
  const toast = useToast();
  const canManage = can('share.manage');

  const [expiresAt, setExpiresAt] = useState(defaultExpiryDate);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setExpiresAt(defaultExpiryDate());
    setPassword('');
    setError(null);
    setCreatedUrl(null);
    setCopied(false);
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await sharingService.create(propertyId, {
        expiresAt,
        password: password.trim() || undefined,
      });
      setCreatedUrl(res.data.url);
      toast.success('Landlord share link created');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function copyUrl() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Copy failed', 'Select and copy the link manually.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share with landlord"
      description={`Create a read-only landlord portal link for ${propertyName}.`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge tone="info">P1 Feature</Badge>
          <span className="text-xs text-ink-muted">Live read-only property view (Q-007)</span>
        </div>

        {!canManage ? (
          <Alert tone="warning" title="Organisation Admin required">
            Only Organisation Admins can create or revoke landlord share links. Switch to Hannah Clarke in the top bar or ask an admin to share this property.
          </Alert>
        ) : createdUrl ? (
          <div className="space-y-4">
            <Alert tone="success" title="Share link created">
              Copy this link now. For security, the full address is only shown once. If you lose it, revoke it and create a new one.
            </Alert>
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas p-3">
              <Link2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <input
                type="text"
                readOnly
                value={createdUrl}
                aria-label="Shareable landlord URL"
                className="w-full bg-transparent text-sm text-ink outline-none"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button type="button" size="sm" variant="secondary" leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={copyUrl}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <Alert tone="error" title="Could not create share link">{error}</Alert>}

            <DatePicker
              id="share-expiry"
              label="Link expires on"
              hint={`Defaults to ${SHARE_DEFAULT_DAYS} days. The link stops working at the end of this day (max ${SHARE_MAX_DAYS} days).`}
              required
              min={dateInDays(0)}
              max={dateInDays(SHARE_MAX_DAYS)}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />

            <Input
              id="share-password"
              label="Optional access password"
              hint="Leave blank for no password, or enter at least 8 characters."
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters (optional)"
              autoComplete="new-password"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" isLoading={saving}>
                Create share link
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
