/**
 * Demo fixtures (PRD §8.6). Every organisation, person and address is fictitious.
 * All dates are computed relative to `now`, so the demo never goes stale.
 * Phone numbers use the Ofcom drama range (07700 900xxx); emails use the reserved `.example` TLD.
 */
import { hashPassword } from './auth';
import type {
  Action,
  ActionStatus,
  ActionUpdate,
  AuditEvent,
  Certificate,
  ComplianceType,
  Evidence,
  NotificationLog,
  Organisation,
  Priority,
  Property,
  PropertyRequirement,
  PropertyType,
  Report,
  ShareAccess,
  ShareLink,
  User,
} from '@/types/domain';
import { recompute } from './engine';
import { buildReportSnapshot } from './helpers';
import { addMonths, daysFrom, prng, yyyymmdd } from './time';
import type { MockDb } from './types';

export const MOCK_DB_VERSION = 6;

/**
 * Fixed public tokens for the seeded landlord links, so the demo can open `/share/<token>`.
 * Real tokens are 32 random bytes; only a hash is stored (TASK-025).
 */
export const DEMO_SHARE_TOKENS: Record<string, string> = {
  shl_1: 'demo-landlord-active-q7Fk2x',
  shl_2: 'demo-landlord-expired-Lm93Pd',
  shl_3: 'demo-landlord-revoked-Zt4wRb',
};
export const DEMO_SHARE_PASSWORD = 'Landlord-2026';
const ORG_ID = 'org_demo';
const DOMAIN = 'demolettings.example';

/* --------------------------------- People -------------------------------- */
const person = (id: string, name: string, role: User['role'], jobTitle: string, status: User['status'] = 'active'): Omit<User, 'createdAt' | 'lastLoginAt'> => ({
  _id: id,
  orgId: role === 'platform_admin' ? null : ORG_ID,
  name,
  email: role === 'platform_admin' ? `${name.split(' ')[0]!.toLowerCase()}@actovara.example` : `${name.toLowerCase().replace(/\s+/g, '.')}@${DOMAIN}`,
  role,
  status,
  jobTitle,
  notificationPrefs: { thresholds: [60, 30, 7, 0], overdueActions: true, unsubscribed: false },
});

const PEOPLE = [
  person('usr_admin', 'Hannah Clarke', 'org_admin', 'Compliance Director'),
  person('usr_james', 'James Patel', 'manager', 'Property Manager'),
  person('usr_olivia', 'Olivia Bennett', 'manager', 'Facilities Manager'),
  person('usr_platform', 'Daniel Hughes', 'platform_admin', 'Actovara Support'),
  person('usr_priya', 'Priya Shah', 'manager', 'Assistant Property Manager', 'invited'),
];
const ref = (u: { _id: string; name: string }) => ({ _id: u._id, name: u.name });
const [ADMIN, JAMES, OLIVIA] = PEOPLE as [User, User, User];

/* ---------------------------- Compliance catalogue ------------------------ */
type TypeSeed = [code: string, name: string, category: string, applicableTo: PropertyType[], months: number | null, storeOnly: boolean, legislation: string];
const ALL: PropertyType[] = ['residential', 'hmo', 'commercial', 'mixed'];
const TYPE_SEEDS: TypeSeed[] = [
  ['FRA', 'Fire Risk Assessment (FRA)', 'Fire safety', ALL, 12, false, 'Regulatory Reform (Fire Safety) Order 2005; Fire Safety (England) Regulations 2022'],
  ['EICR', 'Electrical Installation (EICR)', 'Electrical', ALL, 60, false, 'Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020; BS 7671'],
  ['GAS', 'Gas Safety Certificate', 'Gas', ALL, 12, false, 'Gas Safety (Installation and Use) Regulations 1998'],
  ['ELT', 'Emergency Lighting Test', 'Fire safety', ['hmo', 'commercial', 'mixed'], 12, false, 'BS 5266-1 (annual full-duration test)'],
  ['FAS', 'Fire Alarm Service', 'Fire safety', ['hmo', 'commercial', 'mixed'], 6, false, 'BS 5839-1 / BS 5839-6 periodic inspection and servicing'],
  ['FDI', 'Fire Door Inspection', 'Fire safety', ALL, 6, false, 'Fire Safety (England) Regulations 2022 (communal fire doors)'],
  ['LRA', 'Legionella Risk Assessment', 'Water hygiene', ALL, 24, false, 'Health and Safety at Work etc. Act 1974; HSE ACoP L8'],
  ['ASB', 'Asbestos Survey', 'Asbestos', ['commercial', 'mixed'], null, true, 'Control of Asbestos Regulations 2012 (duty to manage)'],
  ['EPC', 'Energy Performance Certificate (EPC)', 'Energy', ALL, 120, false, 'Energy Performance of Buildings (England and Wales) Regulations 2012'],
  ['PAT', 'Portable Appliance Testing (PAT)', 'Electrical', ['hmo', 'commercial'], 12, false, 'Electricity at Work Regulations 1989'],
  ['HMO', 'HMO Licence', 'Licensing', ['hmo'], 60, false, 'Housing Act 2004, Part 2'],
  ['LOLER', 'Lift Thorough Examination (LOLER)', 'Lifts', ['commercial', 'mixed'], 6, false, 'Lifting Operations and Lifting Equipment Regulations 1998'],
];

/* -------------------------------- Properties ------------------------------ */
type Plan = Record<string, number | 'missing' | 'na'>;
interface PropertySeed {
  ref: string;
  name: string;
  slug: string;
  type: PropertyType;
  address: Property['address'];
  units: number;
  floors: number;
  manager: User;
  contact: Property['contacts'][number];
  /** Expiry offset in days from today per compliance code; others are randomised "valid". */
  plan: Plan;
  naReasons?: Record<string, string>;
  ageDays: number;
}

const PROPERTY_SEEDS: PropertySeed[] = [
  { ref: 'REF-001', name: 'Brookfield House', slug: 'brookfield-house', type: 'residential', address: { line1: '12 Brookfield Road', city: 'Manchester', postcode: 'M14 6TP' }, units: 18, floors: 5, manager: JAMES, contact: { name: 'Mark Ellis', role: 'Caretaker', phone: '07700 900112' }, plan: { FRA: 92 }, ageDays: 400 },
  { ref: 'REF-002', name: 'Maple Court', slug: 'maple-court', type: 'hmo', address: { line1: '45 Maple Avenue', city: 'Leeds', postcode: 'LS6 3QH' }, units: 7, floors: 3, manager: JAMES, contact: { name: 'Sophie Turner', role: 'Letting agent', email: `lettings@maplecourt.example`, phone: '07700 900245' }, plan: { EICR: 24, GAS: 41 }, ageDays: 380 },
  { ref: 'REF-003', name: 'Riverside Business Park', slug: 'riverside-business-park', type: 'commercial', address: { line1: 'Units 1–4, Riverside Way', city: 'Bristol', postcode: 'BS1 6DF' }, units: 4, floors: 3, manager: OLIVIA, contact: { name: 'Gareth Lloyd', role: 'Site manager', phone: '07700 900318' }, plan: { GAS: 133 }, ageDays: 360 },
  { ref: 'REF-004', name: 'Wellington Court', slug: 'wellington-court', type: 'residential', address: { line1: '22 Wellington Street', city: 'Birmingham', postcode: 'B1 2RT' }, units: 24, floors: 6, manager: JAMES, contact: { name: 'Aisha Khan', role: 'Block manager', phone: '07700 900427' }, plan: { FRA: -12, FDI: 'missing', EICR: 30 }, ageDays: 340 },
  { ref: 'REF-005', name: 'Oakfield House', slug: 'oakfield-house', type: 'hmo', address: { line1: '8 Oakfield Road', city: 'Nottingham', postcode: 'NG3 5JL' }, units: 6, floors: 3, manager: OLIVIA, contact: { name: 'Tom Riley', role: 'Handyman', phone: '07700 900533' }, plan: { HMO: 45 }, ageDays: 300 },
  { ref: 'REF-006', name: 'Hillside Works', slug: 'hillside-works', type: 'commercial', address: { line1: 'Hillside Lane', city: 'Sheffield', postcode: 'S9 4AB' }, units: 2, floors: 2, manager: OLIVIA, contact: { name: 'Neil Graham', role: 'Operations lead', phone: '07700 900641' }, plan: { GAS: 'na', EICR: 148 },
    naReasons: { GAS: 'No gas supply to the building (electric heating only).' }, ageDays: 280 },
  { ref: 'REF-007', name: 'Elm House', slug: 'elm-house', type: 'residential', address: { line1: '3 Elm Grove', city: 'Leeds', postcode: 'LS2 9JT' }, units: 8, floors: 4, manager: JAMES, contact: { name: 'Rachel Moore', role: 'Resident liaison', phone: '07700 900759' }, plan: {}, ageDays: 220 },
  { ref: 'REF-008', name: 'Westpark Business Centre', slug: 'westpark-business-centre', type: 'mixed', address: { line1: 'Westpark Road', line2: 'Buildings 1–3', city: 'Manchester', postcode: 'M17 1WP' }, units: 3, floors: 4, manager: OLIVIA,
    contact: { name: 'Chris Walker', role: 'Facilities coordinator', email: 'facilities@westpark.example', phone: '07700 900864' }, plan: { FAS: -21, LOLER: 'missing', ELT: -4, FRA: 18 }, ageDays: 200 },
];

/* --------------------------------- Actions -------------------------------- */
type ActionSeed = [
  prop: number,
  title: string,
  code: string,
  source: Action['source'],
  sourceRef: string | null,
  priority: Priority,
  status: ActionStatus,
  dueOffset: number,
  owner: User,
  /** Completed by written confirmation (no evidence). `{date}` becomes the completion date (dd/mm/yyyy). */
  confirmation?: string,
];
const ACTION_SEEDS: ActionSeed[] = [
  [1, 'Replace self-closing device on Flat 3 fire door', 'FDI', 'report_finding', 'FDI item 3, p2', 'high', 'in_progress', 9, JAMES],
  [1, 'Install heat detector in shared kitchen', 'FRA', 'report_finding', 'FRA item 5.1, p9', 'urgent', 'open', -3, JAMES],
  [2, 'Repair failed emergency light in stairwell B', 'ELT', 'report_finding', 'ELT log, unit 14', 'medium', 'awaiting_verification', 6, OLIVIA],
  [3, 'Remove stored items from ground-floor escape corridor', 'FRA', 'report_finding', 'FRA item 2.3, p5', 'urgent', 'open', -8, JAMES],
  [3, 'Fit intumescent strips to riser cupboard doors', 'FRA', 'report_finding', 'FRA item 4.2, p7', 'high', 'in_progress', 12, JAMES],
  [3, 'Commission inspection of all flat entrance fire doors', 'FDI', 'manual', null, 'high', 'open', 5, ADMIN],
  [3, 'Replace cracked socket outlet in bin store', 'EICR', 'report_finding', 'EICR C2 observation 7', 'high', 'awaiting_verification', -2, JAMES],
  [3, 'Update fire action notices on every landing', 'FRA', 'report_finding', 'FRA item 6.1, p11', 'low', 'open', 20, JAMES],
  [4, 'Submit HMO licence renewal application', 'HMO', 'manual', null, 'high', 'in_progress', 30, OLIVIA],
  [7, 'Fire alarm panel showing fault on zone 3', 'FAS', 'report_finding', 'Service report, fault 2', 'urgent', 'in_progress', -6, OLIVIA],
  [7, 'Book overdue six-monthly fire alarm service', 'FAS', 'manual', null, 'urgent', 'open', -14, OLIVIA],
  [7, 'Replace emergency lighting batteries in Building 2', 'ELT', 'report_finding', 'ELT test sheet, 6 units', 'high', 'open', 4, OLIVIA],
  [7, 'Obtain lift thorough examination report (LOLER)', 'LOLER', 'manual', null, 'high', 'open', 10, ADMIN],
  [7, 'Repair damaged fire door closer, Building 3 level 1', 'FDI', 'report_finding', 'FDI item 12, p4', 'medium', 'awaiting_verification', 2, OLIVIA],
  [7, 'Flush little-used outlets in Building 1 washrooms', 'LRA', 'report_finding', 'LRA recommendation 3', 'medium', 'in_progress', 15, OLIVIA],
  [0, 'Replace missing smoke detector cover in Flat 6', 'FRA', 'report_finding', 'FRA item 3.4, p6', 'medium', 'closed', -40, JAMES],
  [0, 'Clear vegetation from rear escape route', 'FRA', 'report_finding', 'FRA item 2.1, p4', 'low', 'closed', -75, JAMES],
  [1, 'Fit RCD protection to circuit 4', 'EICR', 'report_finding', 'EICR C2 observation 2', 'high', 'closed', -60, JAMES],
  [1, 'Fit flue terminal guard to boiler', 'GAS', 'report_finding', 'Gas safety record, note 1', 'medium', 'closed', -110, JAMES],
  [2, 'Test and label portable appliances in Unit 2', 'PAT', 'manual', null, 'low', 'closed', -30, OLIVIA],
  [2, 'Repair fire alarm sounder in Unit 4', 'FAS', 'report_finding', 'Service report, fault 1', 'high', 'closed', -52, OLIVIA],
  [3, 'Re-hang communal entrance fire door', 'FDI', 'report_finding', 'FDI item 1, p1', 'high', 'closed', -20, JAMES],
  [4, 'Install fire blanket in shared kitchen', 'FRA', 'report_finding', 'FRA item 5.3, p9', 'medium', 'closed', -35, OLIVIA],
  [4, 'Descale and disinfect shower heads', 'LRA', 'report_finding', 'LRA recommendation 1', 'low', 'closed', -64, OLIVIA],
  [5, 'Replace damaged emergency light diffuser', 'ELT', 'manual', null, 'low', 'closed', -18, OLIVIA],
  [5, 'Seal cable penetrations in plant-room wall', 'FRA', 'report_finding', 'FRA item 4.6, p8', 'high', 'closed', -90, OLIVIA],
  [6, 'Replace faulty extractor fan isolator', 'EICR', 'report_finding', 'EICR C3 observation 4', 'low', 'closed', -45, JAMES],
  [6, 'Label gas isolation valve and update records', 'GAS', 'manual', null, 'low', 'closed', -120, JAMES],
  [7, 'Repair fire door ironmongery, Building 1', 'FDI', 'report_finding', 'FDI item 4, p2', 'medium', 'closed', -26, OLIVIA],
  [7, 'Install water temperature logger on hot-water return', 'LRA', 'report_finding', 'LRA recommendation 5', 'medium', 'closed', -80, OLIVIA],
  // Routine actions completed by written confirmation (client request, 24 Nov 2026).
  [0, 'Remove rubbish from storage area', 'FRA', 'manual', null, 'low', 'closed', -12, JAMES, 'Rubbish has been cleared from the storage area on {date}.'],
  [3, 'Replace missing fire action notice in reception', 'FRA', 'manual', null, 'low', 'awaiting_verification', 4, JAMES, 'New fire action notice fitted in the ground-floor reception on {date}. Damaged notice removed.'],
];

const ukDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

const CLOSURE_NOTES: Record<string, string> = {
  FRA: 'Contractor photos checked against the FRA finding. Item closed.',
  FDI: 'Door re-inspected after the repair. Closes and latches correctly.',
  EICR: 'Electrician confirmed the remedial work on the job sheet. Certificate updated.',
  GAS: 'Engineer job sheet received. Appliance passed after the fix.',
  ELT: 'Unit tested for the full duration after the battery swap.',
  FAS: 'Alarm tested on site. All zones show normal.',
  LRA: 'Logbook updated. Temperatures in range.',
  PAT: 'All appliances tested and labelled. Register uploaded.',
};

/* ---------------------------------- Build --------------------------------- */
export function buildSeed(now: Date = new Date()): MockDb {
  const rnd = prng(20261115);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const between = (a: number, b: number) => Math.round(a + rnd() * (b - a));
  const d = (n: number, h?: number) => daysFrom(now, n, h);
  /** Same-day timestamps can land later than "now" (e.g. 08:00 when it is 06:30). Pull them back into the past. */
  const past = (iso: string, minutesAgo = 20) => (Date.parse(iso) >= now.getTime() ? new Date(now.getTime() - minutesAgo * 60_000).toISOString() : iso);

  const users: User[] = PEOPLE.map((p, i) => ({
    ...p,
    createdAt: d(-420 + i * 10),
    lastLoginAt: p.status === 'active' ? past(d(-(i % 3), 8 + i), 15 + i * 7) : undefined,
  }));

  const organisation: Organisation = {
    _id: ORG_ID,
    name: 'Demo Lettings Ltd',
    legalName: 'Demo Lettings Limited',
    email: `office@${DOMAIN}`,
    phone: '0161 496 0000',
    address: { line1: '100 Example Street', city: 'Manchester', postcode: 'M1 1AA' },
    settings: { reminderThresholds: [90, 60, 30, 7, 0], dueSoonDays: 60, reminderRecipients: [ADMIN.email], timezone: 'Europe/London' },
    seatLimit: 10,
    status: 'active',
    createdAt: d(-430),
  };
  const otherOrganisations: Organisation[] = [
    { ...organisation, _id: 'org_northgate', name: 'Northgate Property Services', legalName: 'Northgate Property Services Ltd', email: 'admin@northgate.example', address: { line1: '5 Sample Row', city: 'Leeds', postcode: 'LS1 1AA' }, seatLimit: 5, createdAt: d(-210) },
    { ...organisation, _id: 'org_harbourline', name: 'Harbourline Estates', legalName: 'Harbourline Estates LLP', email: 'team@harbourline.example', address: { line1: '9 Quay Street', city: 'Bristol', postcode: 'BS1 4AA' }, seatLimit: 3, status: 'suspended', createdAt: d(-150) },
  ];

  const complianceTypes: ComplianceType[] = TYPE_SEEDS.map(([code, name, category, applicableTo, months, storeOnly, text], i) => ({
    _id: `ct_${code.toLowerCase()}`,
    orgId: null,
    name,
    code,
    category,
    applicableTo,
    defaultRenewalMonths: months,
    storeOnly,
    affectsRag: true,
    legislationRefs: [{ version: 1, text, effectiveFrom: d(-430), editedBy: 'Actovara Support' }],
    sortOrder: i + 1,
    active: true,
  }));
  const typeByCode = new Map(complianceTypes.map((t) => [t.code, t]));

  const properties: Property[] = [];
  const requirements: PropertyRequirement[] = [];
  const certificates: Certificate[] = [];
  const uploaders = [ADMIN, JAMES, OLIVIA];

  PROPERTY_SEEDS.forEach((s, pi) => {
    const propId = `prop_${String(pi + 1).padStart(3, '0')}`;
    properties.push({
      _id: propId,
      orgId: ORG_ID,
      reference: s.ref,
      name: s.name,
      address: s.address,
      type: s.type,
      units: s.units,
      floors: s.floors,
      managerId: s.manager._id,
      contacts: [s.contact],
      coverImageUrl: `/images/properties/${s.slug}.svg`,
      status: 'active',
      ragStatus: 'green',
      createdAt: d(-s.ageDays),
      updatedAt: d(-between(1, 30)),
    });

    for (const type of complianceTypes.filter((t) => t.applicableTo.includes(s.type))) {
      const reqId = `req_${propId.slice(5)}_${type.code.toLowerCase()}`;
      const plan = s.plan[type.code];
      const req: PropertyRequirement = {
        _id: reqId,
        propertyId: propId,
        complianceTypeId: type._id,
        applicability: plan === 'na' ? 'not_applicable' : 'applicable',
        naReason: plan === 'na' ? s.naReasons?.[type.code] : undefined,
        status: 'missing',
      };
      requirements.push(req);
      if (plan === 'na' || plan === 'missing') continue;

      const months = type.defaultRenewalMonths;
      const maxOffset = months ? Math.min(420, months * 30 - 10) : 0;
      const expiry = type.storeOnly ? undefined : d(typeof plan === 'number' ? plan : between(75, maxOffset));
      const issue = expiry && months ? addMonths(expiry, -months) : d(-between(500, 1100));
      const versions = rnd() < 0.4 && months ? (months <= 12 && rnd() < 0.35 ? 3 : 2) : 1;

      for (let v = 1; v <= versions; v++) {
        const back = versions - v; // 0 for current
        const vIssue = months && back ? addMonths(issue, -months * back) : issue;
        const vExpiry = months && expiry ? addMonths(vIssue, months) : undefined;
        const uploader = pick(uploaders);
        const certId = `cert_${propId.slice(5)}_${type.code.toLowerCase()}_v${v}`;
        certificates.push({
          _id: certId,
          propertyId: propId,
          requirementId: reqId,
          complianceTypeId: type._id,
          version: v,
          isCurrent: back === 0,
          issueDate: vIssue,
          reviewDate: type.code === 'FRA' && vExpiry ? addMonths(vIssue, 6) : undefined,
          expiryDate: vExpiry,
          expiryCalculated: !!vExpiry && rnd() < 0.3,
          file: {
            _id: `file_${certId}`,
            name: `${type.code}-${s.ref}-${yyyymmdd(vIssue)}.pdf`,
            mimeType: 'application/pdf',
            sizeBytes: between(180_000, 2_400_000),
            scanStatus: 'clean',
          },
          notes: rnd() < 0.3 ? pick(['Contractor: Northfield Fire & Safety Ltd (fictitious).', 'Copy also held by the managing agent.', 'Minor observations noted. See the linked actions.']) : undefined,
          uploadedBy: ref(uploader),
          createdAt: past(daysFrom(new Date(vIssue), between(1, 6)), 60),
        });
        if (back === 0) req.currentCertificateId = certId;
      }
    }
  });

  /*
   * Organisation custom document types (client request, 24 Nov 2026). Stored against the property
   * without affecting RAG: Elm House keeps a green RAG although its insurance policy has expired.
   */
  const customTypes: ComplianceType[] = [
    { _id: 'ct_ins', orgId: ORG_ID, name: 'Buildings Insurance Policy', code: 'INS', category: 'Insurance', applicableTo: ALL, defaultRenewalMonths: null, storeOnly: false, affectsRag: false, legislationRefs: [], sortOrder: complianceTypes.length + 1, active: true },
    {
      _id: 'ct_tdp',
      orgId: ORG_ID,
      name: 'Tenancy Deposit Protection Certificate',
      code: 'TDP',
      category: 'Tenancy',
      applicableTo: ['residential', 'hmo'],
      defaultRenewalMonths: null,
      storeOnly: true,
      affectsRag: false,
      legislationRefs: [{ version: 1, text: 'Housing Act 2004, sections 212 to 215 (tenancy deposit schemes)', effectiveFrom: d(-210), editedBy: ADMIN.name }],
      sortOrder: complianceTypes.length + 2,
      active: true,
    },
  ];
  complianceTypes.push(...customTypes);
  const TDP_UPLOADED = new Set(['prop_002', 'prop_005']);
  properties.forEach((prop, pi) => {
    for (const type of customTypes.filter((t) => t.applicableTo.includes(prop.type))) {
      const reqId = `req_${prop._id.slice(5)}_${type.code.toLowerCase()}`;
      const req: PropertyRequirement = { _id: reqId, propertyId: prop._id, complianceTypeId: type._id, applicability: 'applicable', status: 'missing' };
      requirements.push(req);
      if (type.code === 'TDP' && !TDP_UPLOADED.has(prop._id)) continue;
      const issue = d(type.code === 'INS' ? (prop._id === 'prop_007' ? -375 : -200 + pi * 9) : -160 - pi * 11, 10);
      const certId = `cert_${prop._id.slice(5)}_${type.code.toLowerCase()}_v1`;
      certificates.push({
        _id: certId,
        propertyId: prop._id,
        requirementId: reqId,
        complianceTypeId: type._id,
        version: 1,
        isCurrent: true,
        issueDate: issue,
        expiryDate: type.storeOnly ? undefined : addMonths(issue, 12),
        expiryCalculated: false,
        file: { _id: `file_${certId}`, name: `${type.code}-${prop.reference}-${yyyymmdd(issue)}.pdf`, mimeType: 'application/pdf', sizeBytes: 320_000 + pi * 41_000, scanStatus: 'clean' },
        notes: type.code === 'INS' ? 'Policy schedule from the insurer.' : undefined,
        uploadedBy: ref(ADMIN),
        createdAt: past(daysFrom(new Date(issue), 2), 60),
      });
      req.currentCertificateId = certId;
    }
  });

  /* Actions, updates, evidence */
  const actions: Action[] = [];
  const actionUpdates: ActionUpdate[] = [];
  const evidence: Evidence[] = [];
  const nowMs = now.getTime();
  ACTION_SEEDS.forEach(([pi, title, code, source, sourceRef, priority, status, dueOffset, owner, confirmation], i) => {
    const prop = properties[pi]!;
    const id = `act_${String(i + 1).padStart(3, '0')}`;
    const dueDate = d(dueOffset, 17);
    // Confirmation seeds were appended later: a fixed offset keeps the random sequence (and older demo data) unchanged.
    const createdAt = d(Math.min(dueOffset - (confirmation ? 30 : between(25, 50)), -5), 10);
    const cert = certificates.find((c) => c.propertyId === prop._id && c.isCurrent && c.complianceTypeId === `ct_${code.toLowerCase()}`);
    const start = Date.parse(createdAt);
    const end = Math.min(Date.parse(dueDate), nowMs - 3_600_000);
    const at = (f: number) => new Date(start + (end - start) * f).toISOString();
    const reopened = id === 'act_014';

    const action: Action = {
      _id: id,
      reference: `ACT-${String(i + 1).padStart(4, '0')}`,
      propertyId: prop._id,
      certificateId: cert?._id,
      title,
      description: source === 'report_finding' ? `Raised from ${sourceRef}. Owner to arrange the remedial work and upload evidence when it is done.` : 'Raised manually by the compliance team.',
      source,
      sourceRef: sourceRef ?? undefined,
      priority,
      ownerId: owner._id,
      dueDate,
      status,
      isOverdue: false,
      // Demo default: urgent findings must be closed with evidence; everything else allows a written confirmation.
      evidenceRequired: priority === 'urgent',
      reopenCount: reopened ? 1 : 0,
      createdAt,
      updatedAt: at(status === 'open' ? 0 : 0.9),
    };
    const upd = (type: ActionUpdate['type'], f: number, author: User, body?: string, fromStatus?: ActionStatus, toStatus?: ActionStatus) =>
      actionUpdates.push({ _id: `upd_${id.slice(4)}_${actionUpdates.length}`, actionId: id, author: ref(author), type, body, fromStatus, toStatus, createdAt: at(f) });

    upd('created', 0, ADMIN, sourceRef ? `Created from ${sourceRef}.` : 'Created manually.');
    if (status !== 'open') upd('status_change', 0.25, owner, confirmation ? 'Arranged with the caretaker.' : 'Contractor booked. Work under way.', 'open', 'in_progress');
    const submitted = status === 'awaiting_verification' || status === 'closed';
    if (submitted && confirmation) {
      const note = confirmation.replace('{date}', ukDate(at(0.8)));
      action.completion = { method: 'confirmation', note, completedBy: owner._id, completedAt: at(0.8) };
      upd('verification_requested', 0.8, owner, note, 'in_progress', 'awaiting_verification');
      actionUpdates[actionUpdates.length - 1]!.completionMethod = 'confirmation';
    } else if (submitted) {
      const files = [
        { name: 'photo-after-repair.jpg', mimeType: 'image/jpeg', desc: 'Photo of the completed work' },
        { name: 'contractor-job-sheet.pdf', mimeType: 'application/pdf', desc: 'Contractor job sheet' },
      ].slice(0, rnd() < 0.5 ? 1 : 2);
      files.forEach((f, k) => {
        evidence.push({
          _id: `evd_${id.slice(4)}_${k}`,
          actionId: id,
          file: { _id: `file_evd_${id.slice(4)}_${k}`, name: f.name, mimeType: f.mimeType, sizeBytes: between(90_000, 3_100_000), scanStatus: 'clean' },
          description: f.desc,
          status: status === 'closed' ? 'accepted' : 'submitted',
          uploadedBy: ref(owner),
          reviewedBy: status === 'closed' ? ref(ADMIN) : undefined,
          reviewedAt: status === 'closed' ? at(0.95) : undefined,
          createdAt: at(0.6),
        });
        upd('evidence_added', 0.6, owner, f.desc);
      });
      if (reopened) {
        upd('verification_requested', 0.65, owner, 'Work complete. Please verify.', 'in_progress', 'awaiting_verification');
        upd('reopened', 0.7, ADMIN, 'The door still does not close fully from 90°. Reopened for the contractor to adjust.', 'awaiting_verification', 'in_progress');
      }
      const note = 'Work complete. Evidence attached for verification.';
      action.completion = { method: 'evidence', note, completedBy: owner._id, completedAt: at(0.8) };
      upd('verification_requested', 0.8, owner, note, 'in_progress', 'awaiting_verification');
      actionUpdates[actionUpdates.length - 1]!.completionMethod = 'evidence';
    }
    if (status === 'closed') {
      const summary = confirmation
        ? 'Confirmed with the caretaker on site. Routine item, no evidence needed.'
        : CLOSURE_NOTES[code] ?? 'Evidence reviewed and accepted.';
      action.closure = { verifiedBy: ADMIN._id, verifiedAt: at(0.95), summary };
      upd('verified', 0.95, ADMIN, summary, 'awaiting_verification', 'closed');
    }
    actions.push(action);
  });

  const db: MockDb = {
    version: MOCK_DB_VERSION,
    seededAt: now.toISOString(),
    organisation,
    otherOrganisations,
    users,
    complianceTypes,
    properties,
    requirements,
    certificates,
    actions,
    actionUpdates,
    evidence,
    reports: [],
    shareLinks: [],
    shareAccesses: [],
    shareSecrets: [],
    notifications: [],
    auditEvents: [],
    imports: [
      {
        _id: 'imp_1',
        orgId: ORG_ID,
        importType: 'properties',
        fileName: 'portfolio-onboarding-batch-1.csv',
        dateFormat: 'dd/mm/yyyy',
        totalRows: 8,
        importedCount: 8,
        skippedCount: 0,
        errorCount: 0,
        status: 'completed',
        createdBy: ref(ADMIN),
        createdAt: d(-45, 10),
      },
      {
        _id: 'imp_2',
        orgId: ORG_ID,
        importType: 'certificates',
        fileName: 'q3-compliance-certificates.csv',
        dateFormat: 'yyyy-mm-dd',
        totalRows: 14,
        importedCount: 12,
        skippedCount: 1,
        errorCount: 1,
        status: 'partial',
        createdBy: ref(JAMES),
        createdAt: d(-14, 15),
      },
    ],
    counters: { action: actions.length, property: properties.length },
  };
  recompute(db, now);

  /* Reports (snapshot after recompute) */
  ([[0, -3], [3, -1], [7, -7], [1, -14], [2, -21], [4, -30]] as const).forEach(([pi, off], i) => {
    const p = properties[pi]!;
    const at = d(off, 11);
    const reference = `ACT-${p.reference.replace('-', '')}-${yyyymmdd(at)}-01`;
    const by = i % 2 ? ref(p.managerId === JAMES._id ? JAMES : OLIVIA) : ref(ADMIN);
    db.reports.push({
      _id: `rpt_${String(i + 1).padStart(3, '0')}`,
      propertyId: p._id,
      reference,
      generatedBy: by,
      generatedAt: at,
      file: { _id: `file_rpt_${i + 1}`, name: `${reference}.pdf`, mimeType: 'application/pdf', sizeBytes: between(240_000, 900_000), scanStatus: 'clean' },
      snapshot: { rag: p.ragStatus, requirements: db.requirements.filter((r) => r.propertyId === p._id).length, overdue: p.counts!.overdue, dueSoon: p.counts!.dueSoon, missing: p.counts!.missing, openActions: p.counts!.openActions },
      snapshotData: buildReportSnapshot(db, p._id),
      disclaimerVersion: 'v1',
    });
  });

  /* Share links + access log */
  const links: [number, number, boolean, 'active' | 'expired' | 'revoked', string][] = [
    [0, 30, true, 'active', 'q7Fk2x'],
    [3, -5, false, 'expired', 'Lm93Pd'],
    [1, 20, true, 'revoked', 'Zt4wRb'],
  ];
  links.forEach(([pi, exp, pw, state, hint], i) => {
    const id = `shl_${i + 1}`;
    const createdAt = d(Math.min(exp - 30, -1) - 1);
    const accesses: ShareAccess[] = Array.from({ length: state === 'active' ? 4 : 2 }, (_, k) => ({
      _id: `sha_${i + 1}_${k}`,
      shareLinkId: id,
      accessedAt: past(d(Math.min(exp - 30 + 2 + k * 3, -1), 10 + k)),
      ip: `203.0.113.${20 + i * 10 + k}`,
      userAgent: k % 2 ? 'Safari 17 on iOS' : 'Chrome 129 on Windows',
      outcome: k === 1 && pw ? 'bad_password' : 'granted',
    }));
    if (state !== 'active') accesses.push({ _id: `sha_${i + 1}_x`, shareLinkId: id, accessedAt: d(-1, 15), ip: '198.51.100.7', userAgent: 'Edge 129 on Windows', outcome: state === 'expired' ? 'expired' : 'revoked' });
    db.shareAccesses.push(...accesses);
    db.shareSecrets.push({ shareLinkId: id, tokenHash: hashPassword(DEMO_SHARE_TOKENS[id]!), passwordHash: pw ? hashPassword(DEMO_SHARE_PASSWORD) : undefined });
    db.shareLinks.push({
      _id: id,
      propertyId: properties[pi]!._id,
      tokenHint: hint,
      expiresAt: d(exp, 23),
      passwordProtected: pw,
      createdBy: ref(ADMIN),
      createdAt,
      revokedAt: state === 'revoked' ? d(-10) : undefined,
      revokedBy: state === 'revoked' ? ref(ADMIN) : undefined,
      accessCount: accesses.filter((a) => a.outcome === 'granted').length,
      lastAccessedAt: accesses.map((a) => a.accessedAt).sort().pop(),
    });
  });

  /* Notification log */
  const managerOf = (propertyId: string) => users.find((u) => u._id === properties.find((p) => p._id === propertyId)?.managerId) ?? ADMIN;
  for (const r of db.requirements.filter((x) => x.status === 'due_soon' || x.status === 'overdue')) {
    const t = complianceTypes.find((c) => c._id === r.complianceTypeId)!;
    const p = properties.find((x) => x._id === r.propertyId)!;
    // Smallest reminder threshold the requirement has already crossed.
    const threshold = r.status === 'overdue' ? 0 : [7, 30, 60].find((th) => th >= Math.round((Date.parse(r.nextDueDate!) - nowMs) / 86_400_000)) ?? 60;
    const u = managerOf(r.propertyId);
    const sentAt = d(-between(1, 6), 7);
    db.notifications.push({
      _id: `ntf_${db.notifications.length + 1}`,
      userId: u._id,
      recipientEmail: u.email,
      type: 'cert_expiry',
      subject: r.status === 'overdue' ? `${t.name} has expired at ${p.name}` : `${t.name} at ${p.name} expires in ${threshold} days or less`,
      entityType: 'certificate',
      entityId: r.currentCertificateId,
      threshold,
      status: 'delivered',
      sentAt,
      createdAt: sentAt,
    });
  }
  for (const a of db.actions.filter((x) => x.isOverdue)) {
    const u = users.find((x) => x._id === a.ownerId)!;
    db.notifications.push({ _id: `ntf_${db.notifications.length + 1}`, userId: u._id, recipientEmail: u.email, type: 'action_overdue', subject: `${a.reference} is overdue: ${a.title}`, entityType: 'action', entityId: a._id, status: u._id === OLIVIA._id && a.priority === 'urgent' ? 'bounced' : 'delivered', sentAt: d(-1, 7), createdAt: d(-1, 7) });
  }
  db.notifications.push({ _id: `ntf_${db.notifications.length + 1}`, userId: 'usr_priya', recipientEmail: users[4]!.email, type: 'invite', subject: 'You have been invited to Demo Lettings Ltd on Actovara', entityType: 'user', entityId: 'usr_priya', status: 'sent', sentAt: d(-2, 14), createdAt: d(-2, 14) });
  db.notifications.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  /* Audit trail (append-only in production) */
  const audit = (
    actor: User,
    action: AuditEvent['action'],
    entityType: AuditEvent['entityType'],
    entityId: string | undefined,
    summary: string,
    createdAt: string,
    diff?: { before?: Record<string, unknown>; after?: Record<string, unknown> },
  ) =>
    db.auditEvents.push({
      _id: `aud_${db.auditEvents.length + 1}`,
      orgId: actor.orgId,
      actorId: actor._id,
      actorName: actor.name,
      actorRole: actor.role,
      action,
      entityType,
      entityId,
      summary,
      ...(diff?.before ? { before: diff.before } : {}),
      ...(diff?.after ? { after: diff.after } : {}),
      ip: '192.0.2.' + (10 + (db.auditEvents.length % 80)),
      createdAt,
    });
  for (const p of properties) audit(ADMIN, 'create', 'property', p._id, `Created property ${p.name} (${p.reference})`, p.createdAt);
  for (const c of [...certificates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 18)) {
    const p = properties.find((x) => x._id === c.propertyId)!;
    const t = complianceTypes.find((x) => x._id === c.complianceTypeId)!;
    audit(users.find((u) => u._id === c.uploadedBy._id)!, 'create', 'certificate', c._id, `Uploaded ${t.name} v${c.version} for ${p.name}`, c.createdAt);
  }
  for (const a of actions.filter((x) => x.closure)) audit(ADMIN, 'verify', 'action', a._id, `Verified and closed ${a.reference}`, a.closure!.verifiedAt);
  audit(ADMIN, 'reopen', 'action', 'act_014', 'Reopened ACT-0014: door does not close fully', actionUpdates.find((u) => u.type === 'reopened')!.createdAt);
  for (const r of db.reports) audit(users.find((u) => u._id === r.generatedBy._id)!, 'export', 'report', r._id, `Generated report ${r.reference}`, r.generatedAt);
  for (const l of db.shareLinks) {
    audit(ADMIN, 'share', 'share_link', l._id, `Created a landlord share link for ${properties.find((p) => p._id === l.propertyId)!.name}`, l.createdAt);
    if (l.revokedAt) audit(ADMIN, 'revoke', 'share_link', l._id, 'Revoked a landlord share link', l.revokedAt);
  }
  audit(ADMIN, 'create', 'user', 'usr_priya', 'Invited Priya Shah as Manager', d(-2, 14), {
    after: { name: 'Priya Shah', role: 'manager', status: 'invited' },
  });
  audit(ADMIN, 'update', 'organisation', ORG_ID, 'Updated reminder thresholds and due-soon window', d(-5, 16), {
    before: { reminderThresholds: [60, 30, 7], dueSoonDays: 30 },
    after: { reminderThresholds: [90, 60, 30, 7, 0], dueSoonDays: 60 },
  });
  for (const t of customTypes) {
    const n = requirements.filter((r) => r.complianceTypeId === t._id).length;
    audit(ADMIN, 'create', 'compliance_type', t._id, `Added document type ${t.name} and added to ${n} properties`, d(-210, 9), {
      after: { code: t.code, category: t.category, defaultRenewalMonths: t.defaultRenewalMonths, storeOnly: t.storeOnly, affectsRag: t.affectsRag },
    });
  }
  audit(ADMIN, 'update', 'compliance_type', 'ct_fra', 'Updated Fire Risk Assessment legislation reference to v1', d(-12, 11), {
    before: { defaultRenewalMonths: 12, storeOnly: false },
    after: { defaultRenewalMonths: 12, storeOnly: false, legislationVersion: 1 },
  });
  users.filter((u) => u.lastLoginAt).forEach((u) => audit(u, 'login', 'session', undefined, `${u.name} signed in`, u.lastLoginAt!));
  audit(JAMES, 'login_failed', 'session', undefined, 'Failed sign-in attempt (wrong password)', d(-4, 8));
  db.auditEvents.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return db;
}
