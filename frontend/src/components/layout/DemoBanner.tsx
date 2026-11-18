'use client';

import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { Button, Modal, useToast } from '@/components/ui';
import { demoService } from '@/services/demo.service';

/** S2 requirement: a persistent label on every screen while fictitious demo data is shown. */
export function DemoBanner() {
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();
  if (!demoService.enabled) return null;

  return (
    <>
      <div role="note" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-warn-100 bg-warn-50 px-4 py-2 text-center text-meta text-warn-700 sm:text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
          Demo environment. All organisations, properties and people are fictitious.
        </span>
        <button type="button" onClick={() => setConfirming(true)} className="focus-ring inline-flex items-center gap-1 rounded font-semibold underline underline-offset-2 hover:text-ink">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset demo data
        </button>
      </div>
      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        size="sm"
        title="Reset demo data?"
        description="All changes made during this demo will be removed, including new properties, uploads and action updates."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
              onClick={() => {
                demoService.reset();
                setConfirming(false);
                toast.success('Demo data reset', 'Every screen now shows the original sample data.');
              }}
            >
              Reset data
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">Dates are recalculated from today, so overdue and due-soon examples stay realistic.</p>
      </Modal>
    </>
  );
}
