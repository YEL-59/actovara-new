'use client';

import React, { useState } from 'react';
import {
  Archive,
  Building2,
  CheckSquare,
  Eye,
  FileText,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  CountChip,
  DatePicker,
  Drawer,
  DropdownMenu,
  EmptyState,
  FileDropzone,
  Gauge,
  IconButton,
  Input,
  KpiTile,
  LoadingRegion,
  Modal,
  Pagination,
  SegmentedControl,
  Select,
  Skeleton,
  StatusPill,
  Switch,
  TabPanel,
  Table,
  Tabs,
  Textarea,
  TBody,
  TD,
  TH,
  THead,
  Timeline,
  Tooltip,
  TR,
  TypePill,
  useToast,
  type SortDirection,
} from '@/components/ui';
import { formatDate, formatDateTime, formatFileSize, formatRelativeDue } from '@/lib/format';
import type { ActionStatus, Priority, PropertyType, Rag, RequirementStatus } from '@/types/domain';

const swatches: { name: string; className: string; hex: string }[] = [
  { name: 'sidebar', className: 'bg-sidebar', hex: '#0F223D' },
  { name: 'brand-600', className: 'bg-brand-600', hex: '#1D58B0' },
  { name: 'brand-700', className: 'bg-brand-700', hex: '#174A94' },
  { name: 'brand-50', className: 'bg-brand-50', hex: '#E2EDFB' },
  { name: 'canvas', className: 'bg-canvas', hex: '#F7F9FC' },
  { name: 'line', className: 'bg-line', hex: '#E5E9EF' },
  { name: 'table-head', className: 'bg-table-head', hex: '#F0F2F5' },
  { name: 'ink', className: 'bg-ink', hex: '#0F172A' },
  { name: 'ink-muted', className: 'bg-ink-muted', hex: '#5B6576' },
  { name: 'ok-600', className: 'bg-ok-600', hex: '#037D1B' },
  { name: 'ok-100', className: 'bg-ok-100', hex: '#D6F2DC' },
  { name: 'warn-600', className: 'bg-warn-600', hex: '#E59306' },
  { name: 'warn-100', className: 'bg-warn-100', hex: '#FEEBBF' },
  { name: 'danger-600', className: 'bg-danger-600', hex: '#D4050F' },
  { name: 'danger-100', className: 'bg-danger-100', hex: '#FCDADC' },
];

const rows = [
  { ref: 'REF-001', name: 'Brookfield House', city: 'Manchester', type: 'residential' as PropertyType, rag: 'green' as Rag, open: 0, due: 92 },
  { ref: 'REF-002', name: 'Maple Court', city: 'Leeds', type: 'hmo' as PropertyType, rag: 'amber' as Rag, open: 2, due: 56 },
  { ref: 'REF-003', name: 'Riverside Business Park', city: 'Bristol', type: 'commercial' as PropertyType, rag: 'green' as Rag, open: 1, due: 133 },
  { ref: 'REF-004', name: 'Wellington Court', city: 'Birmingham', type: 'residential' as PropertyType, rag: 'red' as Rag, open: 5, due: -3 },
];

const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-line pb-2 text-card-title text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function UiGallery() {
  const toast = useToast();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [tab, setTab] = useState<'overview' | 'register' | 'actions'>('overview');
  const [sort, setSort] = useState<SortDirection>('asc');
  const [page, setPage] = useState(3);
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [notify, setNotify] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const sorted = [...rows].sort((a, b) => (sort === 'desc' ? -1 : 1) * a.name.localeCompare(b.name));

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">TASK-003 · Developer preview</p>
        <h1 className="text-h1 text-ink">Actovara UI kit</h1>
        <p className="mt-1 text-ink-muted">Every component in every state. Tab through the page to check focus rings.</p>
      </header>

      <Section title="Colour tokens">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className={`h-12 ${s.className}`} />
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-meta text-ink-muted">{s.hex}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <p className="text-h1">Heading 1 — Dashboard</p>
          <p className="text-card-title">Card title — Property Overview</p>
          <p>Body 15px — Your compliance and action overview</p>
          <p className="text-meta text-ink-muted">Meta 13px — REF-001 · Manchester</p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Property</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Archive</Button>
          <Button variant="link">Clear</Button>
          <Button
            isLoading={loadingBtn}
            onClick={() => {
              setLoadingBtn(true);
              setTimeout(() => setLoadingBtn(false), 1500);
            }}
          >
            {loadingBtn ? 'Saving…' : 'Click to load'}
          </Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <IconButton label="Refresh data" variant="secondary">
            <RefreshCw className="h-5 w-5" />
          </IconButton>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Search" hideLabel placeholder="Search properties (address, name or reference)" leftIcon={<Search />} className="sm:col-span-2" />
          <Select
            label="Property Type"
            defaultValue="all"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'residential', label: 'Residential' },
              { value: 'hmo', label: 'HMO' },
              { value: 'commercial', label: 'Commercial' },
            ]}
          />
          <Input label="Property name" required placeholder="e.g. Brookfield House" hint="Shown on reports and reminders." />
          <Input label="Postcode" required defaultValue="M14" error="Enter a full UK postcode, like M14 6TP." />
          <DatePicker label="Expiry date" hint="Leave blank to calculate from the issue date." />
          <Textarea label="Notes" placeholder="Anything the next person should know" className="sm:col-span-2" />
          <div className="space-y-4">
            <Checkbox label="Store only" description="Keep the document without expiry reminders." />
            <Checkbox label="Disabled option" disabled />
            <Switch label="Email reminders" description="60, 30 and 7 days before expiry" checked={notify} onChange={setNotify} />
          </div>
          <FileDropzone label="Certificate file" accept=".pdf,.jpg,.png" files={files} onFilesChange={setFiles} className="sm:col-span-2 lg:col-span-3" />
        </div>
      </Section>

      <Section title="Status pills & chips">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['green', 'amber', 'red'] as Rag[]).map((r) => (
              <StatusPill key={r} kind="rag" value={r} />
            ))}
            {(['green', 'amber', 'red'] as Rag[]).map((r) => (
              <StatusPill key={`d-${r}`} kind="rag" value={r} variant="dot" size="md" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['valid', 'due_soon', 'overdue', 'missing', 'not_applicable', 'store_only'] as RequirementStatus[]).map((s) => (
              <StatusPill key={s} kind="requirement" value={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['open', 'in_progress', 'awaiting_verification', 'closed'] as ActionStatus[]).map((s) => (
              <StatusPill key={s} kind="action" value={s} />
            ))}
            {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((s) => (
              <StatusPill key={s} kind="priority" value={s} variant="dot" />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['residential', 'hmo', 'commercial', 'mixed'] as PropertyType[]).map((t) => (
              <TypePill key={t} type={t} />
            ))}
            <CountChip count={0} label="open actions" />
            <CountChip count={2} label="open actions" />
            <CountChip count={5} label="open actions" />
            <Badge tone="neutral">Expiry calculated</Badge>
          </div>
        </div>
      </Section>

      <Section title="Gauges & KPI tiles">
        <div className="grid gap-4 md:grid-cols-3">
          <Gauge title="Overall indicator" value={82} info="Average of certificates in date and actions closed." caption="Operational indicator, not a legal compliance statement" />
          <Gauge title="Certificates (In Date)" value={88} info="(Valid + Due soon + Stored) ÷ applicable requirements" />
          <Gauge title="Actions (Closed)" value={64} info="Closed ÷ all actions created in the last 12 months" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Certificates (In Date)" value={132} tone="ok" icon={<FileText />} trend={{ value: 88, direction: 'up' }} />
          <KpiTile label="Overdue Items" value={18} tone="danger" icon={<TriangleAlert />} trend={{ value: 12, direction: 'down' }} />
          <KpiTile label="Open Actions" value={27} tone="warn" icon={<CheckSquare />} trend={{ value: 18, direction: 'down' }} />
          <KpiTile label="Total Properties" value={12} tone="neutral" icon={<Building2 />} />
        </div>
      </Section>

      <Section title="Cards, tabs & segmented control">
        <Card>
          <CardHeader
            title="Property Overview"
            description="Compliance status and key information for each property"
            actions={
              <SegmentedControl
                label="Property layout"
                value={view}
                onChange={setView}
                items={[
                  { value: 'grid', label: 'Grid View', icon: <LayoutGrid /> },
                  { value: 'list', label: 'List View', icon: <List /> },
                ]}
              />
            }
          />
          <SegmentedControl
            label="Property layout (properties page style)"
            variant="soft"
            value={view}
            onChange={setView}
            items={[
              { value: 'list', label: 'List view', icon: <List /> },
              { value: 'grid', label: 'Grid view', icon: <LayoutGrid /> },
            ]}
          />
          <Tabs
            className="mt-6"
            idBase="demo"
            label="Property sections"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'register', label: 'Compliance register', count: 12 },
              { value: 'actions', label: 'Actions', count: 3 },
            ]}
          />
          <TabPanel idBase="demo" value={tab} active>
            <p className="text-ink-muted">Selected tab: {tab}. Use ← → Home End on the tab list.</p>
          </TabPanel>
        </Card>
      </Section>

      <Section title="Table, menu & pagination">
        <Table label="Properties">
          <THead>
            <tr>
              <TH sortDirection={sort} onSort={() => setSort(sort === 'asc' ? 'desc' : 'asc')}>
                Property
              </TH>
              <TH>Property Type</TH>
              <TH>Compliance Status</TH>
              <TH>Upcoming Certificate</TH>
              <TH className="text-center">Open Actions</TH>
              <TH>
                <span className="sr-only">Row actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {sorted.map((r) => (
              <TR key={r.ref} interactive>
                <TD>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-meta text-ink-muted">
                    {r.city} · {r.ref}
                  </p>
                </TD>
                <TD>
                  <TypePill type={r.type} />
                </TD>
                <TD>
                  <StatusPill kind="rag" value={r.rag} variant="dot" size="md" />
                </TD>
                <TD>
                  <p className="font-semibold">{formatDate(plusDays(r.due))}</p>
                  <p className="text-meta text-ink-muted">{formatRelativeDue(plusDays(r.due))}</p>
                </TD>
                <TD className="text-center">
                  <CountChip count={r.open} label="open actions" />
                </TD>
                <TD className="text-right">
                  <DropdownMenu
                    label={`Actions for ${r.name}`}
                    items={[
                      { label: 'View', icon: <Eye />, onSelect: () => toast.toast({ tone: 'info', title: `View ${r.name}` }) },
                      { label: 'Edit', icon: <Pencil />, onSelect: () => toast.toast({ tone: 'info', title: `Edit ${r.name}` }) },
                      { label: 'Archive', icon: <Archive />, danger: true, onSelect: () => toast.error(`${r.name} archived`, 'You can restore it from Settings.') },
                    ]}
                  />
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Pagination page={page} totalPages={9} total={86} limit={10} onPageChange={setPage} />
      </Section>

      <Section title="Overlays, tooltip & toasts">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
          <Tooltip content="Visible on hover and on keyboard focus">
            <Button variant="secondary">Hover or focus me</Button>
          </Tooltip>
          <Button variant="secondary" onClick={() => toast.success('Certificate uploaded', 'Gas Safety Certificate · v2')}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Upload failed', 'The file could not be saved. Try again.')}>
            Error toast
          </Button>
        </div>
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          title="Archive property?"
          description="Brookfield House will be hidden from dashboards and reminders."
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setModal(false)}>
                Archive
              </Button>
            </>
          }
        >
          <Input label="Reason" required placeholder="e.g. Property sold" data-autofocus />
        </Modal>
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          title="Upload certificate"
          description="Maple Court · Electrical Installation (EICR)"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDrawer(false)}>
                Cancel
              </Button>
              <Button leftIcon={<Upload className="h-4 w-4" />} onClick={() => setDrawer(false)}>
                Upload
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <DatePicker label="Issue date" required />
            <DatePicker label="Expiry date" />
            <Textarea label="Notes" />
          </div>
        </Drawer>
      </Section>

      <Section title="Alerts, loading & empty states">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert tone="info" title="Demo environment">
            All organisations, properties and people are fictitious.
          </Alert>
          <Alert tone="success" title="Action closed">
            Verified by Sarah Patel on {formatDateTime(new Date())}.
          </Alert>
          <Alert tone="warning" title="3 certificates expire within 30 days" />
          <Alert tone="error" title="We couldn't load your properties" onRetry={() => toast.toast({ tone: 'info', title: 'Retrying…' })}>
            Check your connection and try again.
          </Alert>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingRegion label="Loading properties…" className="space-y-3 rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-24 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </LoadingRegion>
          <EmptyState
            icon={<Building2 />}
            title="No properties yet"
            description="Add your first property to start tracking certificates and actions."
            action={<Button leftIcon={<Plus className="h-4 w-4" />}>Add Property</Button>}
          />
        </div>
      </Section>

      <Section title="Avatar, timeline & formatting">
        <div className="flex items-center gap-3">
          <Avatar name="Sarah Patel" size="sm" />
          <Avatar name="James O'Connor" />
          <Avatar name="Amira Hassan" size="lg" />
        </div>
        <Card>
          <Timeline
            items={[
              { id: '1', title: 'Action created', meta: `ACT-0012 · ${formatDateTime(plusDays(-14))}`, tone: 'info', icon: <Plus /> },
              { id: '2', title: 'Contractor booked', meta: `James O'Connor · ${formatDateTime(plusDays(-6))}`, tone: 'purple', body: 'Electrician attending Thursday morning.' },
              { id: '3', title: 'Evidence uploaded', meta: `invoice-4471.pdf · ${formatFileSize(1_482_000)}`, tone: 'warn', icon: <Upload /> },
              { id: '4', title: 'Verified and closed', meta: `Sarah Patel · ${formatDateTime(plusDays(-1))}`, tone: 'ok' },
            ]}
          />
        </Card>
      </Section>
    </main>
  );
}
