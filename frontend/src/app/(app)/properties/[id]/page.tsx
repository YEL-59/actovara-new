'use client';

import { Suspense, useCallback, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { ActionFormModal } from '@/components/actions/ActionFormModal';
import { CertificateUploadModal } from '@/components/certificates/CertificateUploadModal';
import { ArchivePropertyModal, PropertyFormModal } from '@/components/properties';
import {
  ActionsTab,
  CertificatesTab,
  OverviewTab,
  PropertyDetailSkeleton,
  PropertyHeader,
  RegisterTab,
  ReportsTab,
  RequirementDrawer,
  SharingTab,
  STATUS_FILTERS,
} from '@/components/property-detail';
import { Alert, Button, EmptyState, LoadingRegion, Skeleton, TabPanel, Tabs, useToast, type TabItem } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { errorMessage, propertiesService, reportsService, teamService } from '@/services';
import type { RequirementStatus, RequirementView } from '@/types/domain';

type TabKey = 'overview' | 'register' | 'certificates' | 'actions' | 'reports' | 'sharing';
const TAB_KEYS: TabKey[] = ['overview', 'register', 'certificates', 'actions', 'reports', 'sharing'];
const ID_BASE = 'property-detail';

function PropertyDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { can } = useSession();

  const tabParam = searchParams.get('tab');
  const tab: TabKey = TAB_KEYS.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'overview';
  const statusParam = searchParams.get('status') ?? '';
  const statusFilter = (STATUS_FILTERS.some((s) => s.value === statusParam) ? statusParam : '') as RequirementStatus | '';

  const property = useApi(() => propertiesService.get(id), [id]);
  const requirements = useApi(() => propertiesService.requirements(id), [id]);
  const team = useApi(() => teamService.assignees(), []);

  const [uploadFor, setUploadFor] = useState<{ requirementId?: string } | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v) params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const p = property.data;
  const reqs: RequirementView[] = requirements.data ?? [];

  if (property.loading && !p) return <PropertyDetailSkeleton />;
  if (property.error || !p) {
    const notFound = /not found/i.test(property.error ?? '');
    return notFound ? (
      <EmptyState
        icon={<Building2 />}
        title="Property not found"
        description="It may have been removed, or the link is wrong."
        action={
          <Button variant="secondary" onClick={() => router.push('/properties')}>
            Back to properties
          </Button>
        }
      />
    ) : (
      <Alert tone="error" title="Could not load this property" onRetry={property.reload}>
        {property.error ?? 'Unknown error.'}
      </Alert>
    );
  }

  const archived = p.status === 'archived';
  const perms = {
    property: can('property.write'),
    requirement: can('requirement.write') && !archived,
    certificate: can('certificate.write') && !archived,
    action: can('action.write') && !archived,
    report: can('report.generate') && !archived,
  };
  const managerName = team.data?.find((u) => u._id === p.managerId)?.name;
  const drawerReq = reqs.find((r) => r._id === drawerId) ?? null;

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await reportsService.generate(p._id);
      toast.success('Report generated', res.data.reference);
      setQuery({ tab: 'reports' });
    } catch (err) {
      toast.error('Could not generate the report', errorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const restore = async () => {
    try {
      await propertiesService.restore(p._id);
      toast.success('Property restored', `${p.name} is active again.`);
    } catch (err) {
      toast.error('Could not restore property', errorMessage(err));
    }
  };

  const tabs: TabItem<TabKey>[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'register', label: 'Register', count: reqs.length || undefined },
    { value: 'certificates', label: 'Certificates', count: p.counts?.certificates },
    { value: 'actions', label: 'Actions', count: p.counts?.openActions || undefined },
    { value: 'reports', label: 'Reports' },
    { value: 'sharing', label: 'Sharing · P1' },
  ];

  const requirementsBlock = (node: React.ReactNode) =>
    requirements.loading && !requirements.data ? (
      <LoadingRegion label="Loading the compliance register…" className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </LoadingRegion>
    ) : requirements.error ? (
      <Alert tone="error" title="Could not load the compliance register" onRetry={requirements.reload}>
        {requirements.error}
      </Alert>
    ) : (
      node
    );

  return (
    <div className="space-y-5">
      <PropertyHeader
        property={p}
        managerName={managerName}
        can={{ property: perms.property, certificate: perms.certificate, action: perms.action, report: perms.report }}
        generating={generating}
        onUpload={() => setUploadFor({})}
        onNewAction={() => setActionOpen(true)}
        onGenerateReport={() => void generateReport()}
        onEdit={() => setEditOpen(true)}
        onArchive={() => setArchiveOpen(true)}
        onRestore={() => void restore()}
      />

      <div>
        <Tabs<TabKey> idBase={ID_BASE} label="Property sections" items={tabs} value={tab} onChange={(t) => setQuery({ tab: t === 'overview' ? null : t, status: null })} />

        <TabPanel idBase={ID_BASE} value="overview" active={tab === 'overview'}>
          {requirementsBlock(<OverviewTab property={p} requirements={reqs} onOpenStatus={(s) => setQuery({ tab: 'register', status: s })} />)}
        </TabPanel>
        <TabPanel idBase={ID_BASE} value="register" active={tab === 'register'}>
          {requirementsBlock(
            <RegisterTab
              requirements={reqs}
              editable={perms.requirement}
              canUpload={perms.certificate}
              statusFilter={statusFilter}
              onStatusFilter={(s) => setQuery({ status: s || null })}
              onOpen={(r) => setDrawerId(r._id)}
              onUpload={(r) => setUploadFor({ requirementId: r._id })}
            />,
          )}
        </TabPanel>
        <TabPanel idBase={ID_BASE} value="certificates" active={tab === 'certificates'}>
          <CertificatesTab propertyId={p._id} canUpload={perms.certificate} onUpload={() => setUploadFor({})} />
        </TabPanel>
        <TabPanel idBase={ID_BASE} value="actions" active={tab === 'actions'}>
          <ActionsTab propertyId={p._id} canCreate={perms.action} onCreate={() => setActionOpen(true)} />
        </TabPanel>
        <TabPanel idBase={ID_BASE} value="reports" active={tab === 'reports'}>
          <ReportsTab propertyId={p._id} canGenerate={perms.report} generating={generating} onGenerate={() => void generateReport()} />
        </TabPanel>
        <TabPanel idBase={ID_BASE} value="sharing" active={tab === 'sharing'}>
          <SharingTab propertyId={p._id} propertyName={p.name} canManage={can('share.manage')} archived={p.status === 'archived'} />
        </TabPanel>
      </div>

      <RequirementDrawer
        requirement={drawerReq}
        canUpload={perms.certificate}
        onClose={() => setDrawerId(null)}
        onUpload={(r) => {
          setDrawerId(null);
          setUploadFor({ requirementId: r._id });
        }}
      />
      <CertificateUploadModal open={!!uploadFor} requirements={reqs} requirementId={uploadFor?.requirementId} onClose={() => setUploadFor(null)} />
      <ActionFormModal
        open={actionOpen}
        propertyId={p._id}
        propertyName={p.name}
        certificates={reqs.filter((r) => r.currentCertificate).map((r) => ({ _id: r.currentCertificate!._id, label: `${r.complianceType.name} v${r.currentCertificate!.version}` }))}
        onClose={() => setActionOpen(false)}
      />
      <PropertyFormModal open={editOpen} property={p} onClose={() => setEditOpen(false)} onSaved={() => property.reload()} />
      <ArchivePropertyModal property={archiveOpen ? p : null} onClose={() => setArchiveOpen(false)} onArchived={() => property.reload()} />
    </div>
  );
}

export default function PropertyDetailPage() {
  return (
    <Suspense fallback={<PropertyDetailSkeleton />}>
      <PropertyDetailContent />
    </Suspense>
  );
}
