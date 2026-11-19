'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FilePlus2, Loader2, MessageSquarePlus, MoreHorizontal, RotateCcw, Send, ShieldCheck, Undo2 } from 'lucide-react';
import { Button, DropdownMenu, useToast, type MenuItem } from '@/components/ui';
import { useSession } from '@/lib/session-mock';
import { actionsService, errorMessage } from '@/services';
import type { ActionView, Evidence } from '@/types/domain';
import {
  ProgressNoteModal,
  ReopenActionModal,
  RequestVerificationModal,
  UploadEvidenceModal,
  VerifyActionModal,
} from './ActionLifecycleModals';

type Dialog = 'verify' | 'request_more' | 'request_verify' | 'note' | 'evidence' | 'reopen' | null;

/**
 * Row/card lifecycle menu for the Actions tab: verify & close, request more evidence,
 * request verification, progress note, upload evidence and reopen — reusing the same
 * modals and service rules as the action record page.
 */
export function ActionQuickActions({
  action,
  onChanged,
  showPrimaryVerify = true,
}: {
  action: ActionView;
  onChanged?: () => void;
  showPrimaryVerify?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { can } = useSession();
  const canWrite = can('action.write');
  const canVerify = can('action.verify');

  const [dialog, setDialog] = useState<Dialog>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [current, setCurrent] = useState<ActionView>(action);
  /** Which control is fetching: the primary button or the ⋯ menu. */
  const [loading, setLoading] = useState<'button' | 'menu' | null>(null);

  /** Loads the latest action + evidence (needed by the verify modal) before opening a dialog. */
  const openWithDetail = async (next: Exclude<Dialog, null>, source: 'button' | 'menu' = 'menu') => {
    setLoading(source);
    try {
      const res = await actionsService.get(action._id);
      const valid = res.data.evidence.filter((e) => e.status !== 'rejected');
      setCurrent(res.data.action);
      setEvidence(res.data.evidence);
      if (next === 'request_verify' && valid.length === 0) {
        toast.error('Upload evidence first', 'At least one piece of evidence is needed before requesting verification.');
        setDialog('evidence');
        return;
      }
      setDialog(next);
    } catch (err) {
      toast.error('Could not load action', errorMessage(err));
    } finally {
      setLoading(null);
    }
  };

  const items: MenuItem[] = [];
  if (action.status === 'awaiting_verification' && canVerify) {
    items.push(
      { label: 'Verify & close', icon: <ShieldCheck />, onSelect: () => openWithDetail('verify') },
      { label: 'Request more evidence', icon: <Undo2 />, onSelect: () => openWithDetail('request_more') },
    );
  }
  if ((action.status === 'open' || action.status === 'in_progress') && canWrite) {
    items.push(
      { label: 'Request verification', icon: <Send />, onSelect: () => openWithDetail('request_verify') },
      { label: 'Add progress note', icon: <MessageSquarePlus />, onSelect: () => openWithDetail('note') },
      { label: 'Upload evidence', icon: <FilePlus2 />, onSelect: () => openWithDetail('evidence') },
    );
  }
  if (action.status === 'closed' && canVerify) {
    items.push({ label: 'Reopen action', icon: <RotateCcw />, onSelect: () => openWithDetail('reopen') });
  }
  items.push({ label: 'Open action record', icon: <ArrowRight />, onSelect: () => router.push(`/actions/${action._id}`) });

  const close = () => setDialog(null);
  const done = () => onChanged?.();

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        {showPrimaryVerify && action.status === 'awaiting_verification' && canVerify && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<ShieldCheck className="h-3.5 w-3.5 text-ok-700" />}
            onClick={() => openWithDetail('verify', 'button')}
            isLoading={loading === 'button'}
            disabled={loading === 'menu'}
            className="whitespace-nowrap border-ok-100 bg-ok-50 text-ok-700 hover:bg-ok-100"
          >
            Verify &amp; close
          </Button>
        )}
        <DropdownMenu
          label={`Actions for ${action.reference}`}
          items={items}
          trigger={
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-table-head hover:text-brand-600">
              {loading === 'menu' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <MoreHorizontal className="h-5 w-5" aria-hidden />}
              <span className="sr-only">Actions for {action.reference}</span>
            </span>
          }
        />
      </div>

      <VerifyActionModal
        open={dialog === 'verify' || dialog === 'request_more'}
        action={current}
        evidence={evidence}
        initialDecision={dialog === 'request_more' ? 'request_more' : 'accept'}
        onClose={close}
        onDone={done}
      />
      <RequestVerificationModal
        open={dialog === 'request_verify'}
        action={current}
        evidenceCount={evidence.filter((e) => e.status !== 'rejected').length}
        onClose={close}
        onDone={done}
      />
      <ProgressNoteModal open={dialog === 'note'} action={current} onClose={close} onDone={done} />
      <UploadEvidenceModal open={dialog === 'evidence'} action={current} onClose={close} onDone={done} />
      <ReopenActionModal open={dialog === 'reopen'} action={current} onClose={close} onDone={done} />
    </>
  );
}
