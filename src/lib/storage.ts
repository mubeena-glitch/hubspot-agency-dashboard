'use client';
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'ADMIN' | 'PM' | 'INTEGRATION_SPECIALIST' | 'DESIGNER' | 'DEVELOPER' | 'TEAM_LEAD' | 'COPYWRITER' | 'SEO_SPECIALIST' | 'OTHER';
// Layoff removed
export type HandoverType = 'MATERNITY_LEAVE' | 'OTHER' | 'RESIGNATION' | 'SICK_LEAVE' | 'VACATION';
export type HandoverStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETE';
export type SiteType = 'WordPress' | 'React' | 'Next.js' | 'Shopify' | 'Webflow' | 'Vue' | 'Angular' | 'Laravel' | 'Custom' | 'Other';
export type HubSpotHub = 'Marketing Hub' | 'Sales Hub' | 'Service Hub' | 'CMS Hub' | 'Operations Hub';

export interface TeamMember {
  id: string; name: string; email: string; role: UserRole;
  department: string; phone?: string; slack?: string; createdAt: string;
}
export interface Client {
  id: string; name: string; industry: string; website?: string; notes?: string;
  createdAt: string; createdById?: string;
}
export interface Integration {
  id: string; name: string; type: string; purpose: string;
  accessMethod: string; credentialsLocation: string; notes: string;
}
export interface AccessDetail {
  id: string; tool: string; url: string; username: string;
  credentialsLocation: string; twoFactorInfo: string; accessLevel: string; notes: string;
}
export interface KeyContact {
  id: string; name: string; role: string; email: string; phone: string; notes: string;
}
export interface Document {
  id: string; name: string; type: 'link' | 'file'; url: string;
  fileData?: string; mimeType?: string; notes: string; createdAt: string;
}
export interface HubSpotDetails {
  portalId: string; portalUrl: string; activeHubs: HubSpotHub[]; tier: string;
  pipelineNames: string; keyWorkflows: string; automations: string;
  reportsDashboards: string; customProperties: string; formsLandingPages: string;
  emailTemplates: string; crmNotes: string;
}
export interface TechStack {
  siteType: SiteType; siteUrl: string; stagingUrl: string; adminUrl: string;
  repoUrl: string; repoBranch: string; hostingProvider: string; hostingUrl: string;
  phpVersion: string; plugins: string; themeFramework: string;
  deploymentProcess: string; localSetup: string; techNotes: string;
}
export interface OngoingWork {
  activeProjects: string; openIssues: string; pendingTasks: string;
  criticalDeadlines: string; doNotTouch: string; clientExpectations: string;
  weeklyTasks: string; notes: string;
}
export interface RoleSpecificDetails {
  pmTool: string; pmUrl: string; meetingCadence: string; reportingSchedule: string;
  stakeholders: string; projectStatus: string; figmaUrl: string;
  brandGuidelinesUrl: string; assetsLocation: string; designNotes: string;
  integrationArchitecture: string; dataFlowNotes: string; webhookDetails: string;
  apiNotes: string; codeStandards: string; testingNotes: string; buildProcess: string;
  teamStructure: string; escalationPath: string; decisionAuthority: string;
}
export interface ClientHandover {
  id: string; handoverFileId: string; clientId: string;
  hubspot: HubSpotDetails; techStack: TechStack;
  integrations: Integration[]; accessDetails: AccessDetail[];
  contacts: KeyContact[]; documents: Document[];
  ongoingWork: OngoingWork; roleSpecific: RoleSpecificDetails;
  aiSummary: string; completionPct: number; updatedAt: string;
}
export interface FirefliesEntry {
  id: string; fileName: string; uploadedAt: string;
  processed: boolean; summary: string; clientId?: string;
}
export interface HandoverFile {
  id: string; teamMemberId: string; type: HandoverType;
  status: HandoverStatus;
  approvedById?: string; approvedAt?: string; approvalNotes?: string;
  startDate: string; endDate?: string; reason: string;
  coverPersonId?: string; clientHandoverIds: string[];
  firefliesTranscripts: FirefliesEntry[];
  notes: string; createdAt: string; updatedAt: string;
}

export const emptyHubspot = (): HubSpotDetails => ({
  portalId: '', portalUrl: '', activeHubs: [], tier: '', pipelineNames: '',
  keyWorkflows: '', automations: '', reportsDashboards: '', customProperties: '',
  formsLandingPages: '', emailTemplates: '', crmNotes: ''
});
export const emptyTechStack = (): TechStack => ({
  siteType: 'WordPress', siteUrl: '', stagingUrl: '', adminUrl: '', repoUrl: '',
  repoBranch: 'main', hostingProvider: '', hostingUrl: '', phpVersion: '',
  plugins: '', themeFramework: '', deploymentProcess: '', localSetup: '', techNotes: ''
});
export const emptyOngoing = (): OngoingWork => ({
  activeProjects: '', openIssues: '', pendingTasks: '', criticalDeadlines: '',
  doNotTouch: '', clientExpectations: '', weeklyTasks: '', notes: ''
});
export const emptyRoleSpecific = (): RoleSpecificDetails => ({
  pmTool: '', pmUrl: '', meetingCadence: '', reportingSchedule: '', stakeholders: '',
  projectStatus: '', figmaUrl: '', brandGuidelinesUrl: '', assetsLocation: '',
  designNotes: '', integrationArchitecture: '', dataFlowNotes: '', webhookDetails: '',
  apiNotes: '', codeStandards: '', testingNotes: '', buildProcess: '', teamStructure: '',
  escalationPath: '', decisionAuthority: ''
});

const K = {
  members: 'hh_members', clients: 'hh_clients',
  files: 'hh_files', handovers: 'hh_client_handovers', auth: 'hh_auth',
};

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function write<T>(key: string, data: T[]) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(data));
}

const SEED_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Sarah Johnson', email: 'sarah@agency.com', role: 'ADMIN', department: 'Management', phone: '+971 50 111 1111', slack: '@sarah', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'm2', name: 'Marcus Lee', email: 'marcus@agency.com', role: 'INTEGRATION_SPECIALIST', department: 'Tech', phone: '+971 50 222 2222', slack: '@marcus', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'm3', name: 'Priya Patel', email: 'priya@agency.com', role: 'PM', department: 'Projects', phone: '+971 50 333 3333', slack: '@priya', createdAt: '2024-01-03T00:00:00Z' },
  { id: 'm4', name: 'Lena Müller', email: 'lena@agency.com', role: 'DESIGNER', department: 'Creative', phone: '+971 50 444 4444', slack: '@lena', createdAt: '2024-01-04T00:00:00Z' },
  { id: 'm5', name: 'James Okafor', email: 'james@agency.com', role: 'DEVELOPER', department: 'Tech', phone: '+971 50 555 5555', slack: '@james', createdAt: '2024-01-05T00:00:00Z' },
];
const SEED_CLIENTS: Client[] = [
  { id: 'c1', name: 'TechNova Inc', industry: 'SaaS', website: 'https://technova.com', notes: 'Key enterprise client', createdAt: '2024-01-10T00:00:00Z' },
  { id: 'c2', name: 'GreenLeaf Co', industry: 'E-commerce', website: 'https://greenleaf.co', notes: 'WooCommerce store', createdAt: '2024-01-11T00:00:00Z' },
  { id: 'c3', name: 'Meridian Health', industry: 'Healthcare', website: 'https://meridianhealth.ae', notes: 'Strict compliance requirements', createdAt: '2024-01-12T00:00:00Z' },
];

export function ensureSeedData() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(K.members)) write(K.members, SEED_MEMBERS);
  if (!localStorage.getItem(K.clients)) write(K.clients, SEED_CLIENTS);
  if (!localStorage.getItem(K.files)) write(K.files, []);
  if (!localStorage.getItem(K.handovers)) write(K.handovers, []);
}

export const auth = {
  login(email: string, password: string): TeamMember | null {
    const m = members.all().find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!m || password !== 'password123') return null;
    localStorage.setItem(K.auth, JSON.stringify({ memberId: m.id }));
    return m;
  },
  logout() { localStorage.removeItem(K.auth); },
  current(): TeamMember | null {
    if (typeof window === 'undefined') return null;
    try {
      const s = JSON.parse(localStorage.getItem(K.auth) || 'null');
      if (!s?.memberId) return null;
      return members.get(s.memberId);
    } catch { return null; }
  },
  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    try { return !!JSON.parse(localStorage.getItem(K.auth) || 'null')?.memberId; } catch { return false; }
  }
};

export const members = {
  all: () => read<TeamMember>(K.members),
  get: (id: string) => read<TeamMember>(K.members).find(m => m.id === id) ?? null,
  create: (d: Omit<TeamMember, 'id' | 'createdAt'>): TeamMember => {
    const list = read<TeamMember>(K.members);
    const m: TeamMember = { ...d, id: uuidv4(), createdAt: new Date().toISOString() };
    write(K.members, [...list, m]); return m;
  },
  update: (id: string, d: Partial<TeamMember>) => {
    const list = read<TeamMember>(K.members);
    const i = list.findIndex(m => m.id === id); if (i === -1) return null;
    list[i] = { ...list[i], ...d }; write(K.members, list); return list[i];
  },
  remove: (id: string) => write(K.members, read<TeamMember>(K.members).filter(m => m.id !== id)),
};

export const clients = {
  all: () => read<Client>(K.clients),
  get: (id: string) => read<Client>(K.clients).find(c => c.id === id) ?? null,
  create: (d: Omit<Client, 'id' | 'createdAt'>): Client => {
    const list = read<Client>(K.clients);
    const c: Client = { ...d, id: uuidv4(), createdAt: new Date().toISOString() };
    write(K.clients, [...list, c]); return c;
  },
  update: (id: string, d: Partial<Client>) => {
    const list = read<Client>(K.clients);
    const i = list.findIndex(c => c.id === id); if (i === -1) return null;
    list[i] = { ...list[i], ...d }; write(K.clients, list); return list[i];
  },
  remove: (id: string) => write(K.clients, read<Client>(K.clients).filter(c => c.id !== id)),
};

export const handoverFiles = {
  all: () => read<HandoverFile>(K.files),
  get: (id: string) => read<HandoverFile>(K.files).find(p => p.id === id) ?? null,
  create: (d: Omit<HandoverFile, 'id' | 'createdAt' | 'updatedAt'>): HandoverFile => {
    const list = read<HandoverFile>(K.files);
    const now = new Date().toISOString();
    const p: HandoverFile = { ...d, id: uuidv4(), createdAt: now, updatedAt: now };
    write(K.files, [...list, p]); return p;
  },
  update: (id: string, d: Partial<HandoverFile>) => {
    const list = read<HandoverFile>(K.files);
    const i = list.findIndex(p => p.id === id); if (i === -1) return null;
    list[i] = { ...list[i], ...d, updatedAt: new Date().toISOString() };
    write(K.files, list); return list[i];
  },
  remove: (id: string) => {
    const f = handoverFiles.get(id);
    if (f) f.clientHandoverIds.forEach(hid => clientHandovers.remove(hid));
    write(K.files, read<HandoverFile>(K.files).filter(p => p.id !== id));
  },
};

export const clientHandovers = {
  all: () => read<ClientHandover>(K.handovers),
  get: (id: string) => read<ClientHandover>(K.handovers).find(h => h.id === id) ?? null,
  create: (d: Omit<ClientHandover, 'id' | 'updatedAt'>): ClientHandover => {
    const list = read<ClientHandover>(K.handovers);
    const h: ClientHandover = { ...d, id: uuidv4(), updatedAt: new Date().toISOString() };
    write(K.handovers, [...list, h]); return h;
  },
  update: (id: string, d: Partial<ClientHandover>) => {
    const list = read<ClientHandover>(K.handovers);
    const i = list.findIndex(h => h.id === id); if (i === -1) return null;
    list[i] = { ...list[i], ...d, updatedAt: new Date().toISOString() };
    write(K.handovers, list); return list[i];
  },
  remove: (id: string) => write(K.handovers, read<ClientHandover>(K.handovers).filter(h => h.id !== id)),
};
