import { affectsRag } from '@/lib/documents';
import { gauges } from '@/mocks/engine';
import { mockStore } from '@/mocks/store';
import type { ActionView, DashboardSummary } from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { mockCall } from './mock-adapter';

const URGENT_STATUSES = new Set(['overdue', 'missing', 'due_soon']);

export const dashboardService = {
  /** GET /dashboard?propertyId= — omit propertyId for the whole portfolio. */
  get(propertyId?: string) {
    if (!USE_MOCKS) return http.get<DashboardSummary>('/dashboard', { propertyId });
    return mockCall<DashboardSummary>(
      () => {
        const db = mockStore.get();
        const properties = db.properties.filter((p) => p.status === 'active' && (!propertyId || p._id === propertyId));
        const ids = new Set(properties.map((p) => p._id));
        const g = gauges(db, ids);
        const types = new Map(db.complianceTypes.map((t) => [t._id, t]));
        // Documents stored without affecting RAG are not "urgent" and do not count as overdue items.
        const reqs = db.requirements.filter((r) => ids.has(r.propertyId) && affectsRag(types.get(r.complianceTypeId)));
        const acts = db.actions.filter((a) => ids.has(a.propertyId));
        const open = acts.filter((a) => a.status !== 'closed');
        const name = (id: string) => db.properties.find((p) => p._id === id)?.name ?? '';
        const typeName = (id: string) => db.complianceTypes.find((t) => t._id === id)?.name ?? '';
        const rank = { overdue: 0, missing: 1, due_soon: 2 } as Record<string, number>;
        return {
          data: {
            gauges: { overall: g.overall, certificatesInDate: g.certificatesInDate, actionsClosed: g.actionsClosed },
            kpis: {
              certificatesInDate: g.inDateCount,
              overdueItems: reqs.filter((r) => r.status === 'overdue').length + open.filter((a) => a.isOverdue).length,
              openActions: open.length,
              totalProperties: properties.length,
              // Q-015: trend source not yet agreed. These fixed demo values show the layout only.
              trends: { certificatesInDate: 4, overdueItems: -12, openActions: -18 },
            },
            urgentRequirements: reqs
              .filter((r) => URGENT_STATUSES.has(r.status))
              .sort((a, b) => rank[a.status]! - rank[b.status]! || (a.nextDueDate ?? '').localeCompare(b.nextDueDate ?? ''))
              .map((r) => ({ ...r, propertyName: name(r.propertyId), complianceTypeName: typeName(r.complianceTypeId) })),
            openActions: open
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .map((a): ActionView => ({ ...a, propertyName: name(a.propertyId), ownerName: db.users.find((u) => u._id === a.ownerId)?.name ?? '—' })),
            properties,
            lastUpdated: new Date().toISOString(),
          },
        };
      },
      {
        empty: () => ({
          gauges: { overall: 0, certificatesInDate: 0, actionsClosed: 0 },
          kpis: { certificatesInDate: 0, overdueItems: 0, openActions: 0, totalProperties: 0, trends: { certificatesInDate: 0, overdueItems: 0, openActions: 0 } },
          urgentRequirements: [],
          openActions: [],
          properties: [],
          lastUpdated: new Date().toISOString(),
        }),
      },
    );
  },
};
