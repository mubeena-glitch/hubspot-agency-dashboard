// ============================================================
// localStorage data layer — no database required
// ============================================================
import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'ADMIN' | 'MANAGER' | 'ACCOUNT_MANAGER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  createdAt: string;
}

export interface HubSpotAccount {
  id: string;
  name: string;
  hubspotPortalId: string;
  industry: string;
  status: 'ACTIVE' | 'AT_RISK' | 'CHURNED' | 'ONBOARDING';
  mrr: number;
  assignedManagerId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Handover {
  id: string;
  accountId: string;
  fromUserId: string;
  toUserId: string;
  reason: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  notes: string;
  createdAt: string;
}

export interface Task {
  id: string;
  accountId: string;
  handoverId?: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignedToId: string;
  dueDate?: string;
  createdAt: string;
}

export interface VacationPlan {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  coverageUserId: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'COMPLETED';
  createdAt: string;
}

export interface AuthState {
  userId: string | null;
  isAuthenticated: boolean;
}

const KEYS = {
  users: 'hs_users',
  accounts: 'hs_accounts',
  handovers: 'hs_handovers',
  tasks: 'hs_tasks',
  vacations: 'hs_vacations',
  auth: 'hs_auth',
};

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch { return []; }
}

function write<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ---- SEED DATA -----------------------------------------------
const SEED_USERS: User[] = [
  { id: 'u1', name: 'Sarah Johnson', email: 'sarah@agency.com', role: 'ADMIN', department: 'Management', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'u2', name: 'Marcus Lee', email: 'marcus@agency.com', role: 'MANAGER', department: 'Sales', createdAt: '2024-01-02T00:00:00Z' },
  { id: 'u3', name: 'Priya Patel', email: 'priya@agency.com', role: 'ACCOUNT_MANAGER', department: 'Client Success', createdAt: '2024-01-03T00:00:00Z' },
  { id: 'u4', name: 'Lena Müller', email: 'lena@agency.com', role: 'ACCOUNT_MANAGER', department: 'Client Success', createdAt: '2024-01-04T00:00:00Z' },
  { id: 'u5', name: 'James Okafor', email: 'james@agency.com', role: 'VIEWER', department: 'Operations', createdAt: '2024-01-05T00:00:00Z' },
];

const SEED_ACCOUNTS: HubSpotAccount[] = [
  { id: 'a1', name: 'TechNova Inc', hubspotPortalId: '12345678', industry: 'SaaS', status: 'ACTIVE', mrr: 4200, assignedManagerId: 'u3', notes: 'Strong growth Q3', createdAt: '2024-02-01T00:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { id: 'a2', name: 'GreenLeaf Co', hubspotPortalId: '23456789', industry: 'E-commerce', status: 'AT_RISK', mrr: 1800, assignedManagerId: 'u4', notes: 'Missed last 2 check-ins', createdAt: '2024-02-10T00:00:00Z', updatedAt: '2024-03-01T00:00:00Z' },
  { id: 'a3', name: 'Meridian Health', hubspotPortalId: '34567890', industry: 'Healthcare', status: 'ACTIVE', mrr: 6500, assignedManagerId: 'u3', notes: 'Expanding to EU market', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
  { id: 'a4', name: 'UrbanBuild Ltd', hubspotPortalId: '45678901', industry: 'Construction', status: 'ONBOARDING', mrr: 3100, assignedManagerId: 'u2', notes: 'New client — onboarding week 2', createdAt: '2024-03-05T00:00:00Z', updatedAt: '2024-03-05T00:00:00Z' },
  { id: 'a5', name: 'Solaris Media', hubspotPortalId: '56789012', industry: 'Media', status: 'ACTIVE', mrr: 2900, assignedManagerId: 'u4', notes: 'Renewal in 60 days', createdAt: '2024-02-20T00:00:00Z', updatedAt: '2024-02-20T00:00:00Z' },
  { id: 'a6', name: 'PeakFlow Analytics', hubspotPortalId: '67890123', industry: 'Analytics', status: 'CHURNED', mrr: 0, assignedManagerId: 'u2', notes: 'Churned Feb 2024', createdAt: '2023-06-01T00:00:00Z', updatedAt: '2024-02-15T00:00:00Z' },
];

const SEED_HANDOVERS: Handover[] = [
  { id: 'h1', accountId: 'a2', fromUserId: 'u4', toUserId: 'u3', reason: 'Team restructuring', status: 'IN_PROGRESS', startDate: '2024-03-10T00:00:00Z', notes: 'Urgent — client at risk', createdAt: '2024-03-10T00:00:00Z' },
  { id: 'h2', accountId: 'a5', fromUserId: 'u3', toUserId: 'u4', reason: 'Parental leave coverage', status: 'PENDING', startDate: '2024-04-01T00:00:00Z', endDate: '2024-06-30T00:00:00Z', notes: 'Temporary handover', createdAt: '2024-03-15T00:00:00Z' },
];

const SEED_TASKS: Task[] = [
  { id: 't1', accountId: 'a2', handoverId: 'h1', title: 'Schedule recovery call', description: 'Book 30-min call with client', status: 'TODO', priority: 'HIGH', assignedToId: 'u3', dueDate: '2024-03-20T00:00:00Z', createdAt: '2024-03-10T00:00:00Z' },
  { id: 't2', accountId: 'a1', title: 'Q2 business review', description: 'Prepare QBR deck', status: 'IN_PROGRESS', priority: 'MEDIUM', assignedToId: 'u3', dueDate: '2024-04-01T00:00:00Z', createdAt: '2024-03-12T00:00:00Z' },
  { id: 't3', accountId: 'a3', title: 'EU expansion brief', description: 'Document EU compliance requirements', status: 'DONE', priority: 'HIGH', assignedToId: 'u4', createdAt: '2024-03-01T00:00:00Z' },
];

const SEED_VACATIONS: VacationPlan[] = [
  { id: 'v1', userId: 'u3', startDate: '2024-04-01T00:00:00Z', endDate: '2024-06-30T00:00:00Z', coverageUserId: 'u4', notes: 'Parental leave', status: 'APPROVED', createdAt: '2024-03-01T00:00:00Z' },
];

export function ensureSeedData() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(KEYS.users)) write(KEYS.users, SEED_USERS);
  if (!localStorage.getItem(KEYS.accounts)) write(KEYS.accounts, SEED_ACCOUNTS);
  if (!localStorage.getItem(KEYS.handovers)) write(KEYS.handovers, SEED_HANDOVERS);
  if (!localStorage.getItem(KEYS.tasks)) write(KEYS.tasks, SEED_TASKS);
  if (!localStorage.getItem(KEYS.vacations)) write(KEYS.vacations, SEED_VACATIONS);
}

// ---- AUTH ----------------------------------------------------
export const auth = {
  getState(): AuthState {
    if (typeof window === 'undefined') return { userId: null, isAuthenticated: false };
    try { return JSON.parse(localStorage.getItem(KEYS.auth) || 'null') || { userId: null, isAuthenticated: false }; }
    catch { return { userId: null, isAuthenticated: false }; }
  },
  login(email: string, password: string): User | null {
    const users = read<User>(KEYS.users);
    // Simple password check — password is always "password123" or same as email prefix
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    if (password !== 'password123') return null;
    localStorage.setItem(KEYS.auth, JSON.stringify({ userId: user.id, isAuthenticated: true }));
    return user;
  },
  logout() { localStorage.removeItem(KEYS.auth); },
  currentUser(): User | null {
    const state = auth.getState();
    if (!state.isAuthenticated || !state.userId) return null;
    return users.get(state.userId);
  },
};

// ---- USERS ---------------------------------------------------
export const users = {
  all: () => read<User>(KEYS.users),
  get: (id: string) => read<User>(KEYS.users).find(u => u.id === id) || null,
  create: (data: Omit<User, 'id' | 'createdAt'>): User => {
    const list = read<User>(KEYS.users);
    const user: User = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    write(KEYS.users, [...list, user]);
    return user;
  },
  update: (id: string, data: Partial<User>): User | null => {
    const list = read<User>(KEYS.users);
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    write(KEYS.users, list);
    return list[idx];
  },
  remove: (id: string) => write(KEYS.users, read<User>(KEYS.users).filter(u => u.id !== id)),
};

// ---- ACCOUNTS ------------------------------------------------
export const accounts = {
  all: () => read<HubSpotAccount>(KEYS.accounts),
  get: (id: string) => read<HubSpotAccount>(KEYS.accounts).find(a => a.id === id) || null,
  create: (data: Omit<HubSpotAccount, 'id' | 'createdAt' | 'updatedAt'>): HubSpotAccount => {
    const list = read<HubSpotAccount>(KEYS.accounts);
    const now = new Date().toISOString();
    const account: HubSpotAccount = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    write(KEYS.accounts, [...list, account]);
    return account;
  },
  update: (id: string, data: Partial<HubSpotAccount>): HubSpotAccount | null => {
    const list = read<HubSpotAccount>(KEYS.accounts);
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    write(KEYS.accounts, list);
    return list[idx];
  },
  remove: (id: string) => write(KEYS.accounts, read<HubSpotAccount>(KEYS.accounts).filter(a => a.id !== id)),
};

// ---- HANDOVERS -----------------------------------------------
export const handovers = {
  all: () => read<Handover>(KEYS.handovers),
  get: (id: string) => read<Handover>(KEYS.handovers).find(h => h.id === id) || null,
  create: (data: Omit<Handover, 'id' | 'createdAt'>): Handover => {
    const list = read<Handover>(KEYS.handovers);
    const h: Handover = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    write(KEYS.handovers, [...list, h]);
    return h;
  },
  update: (id: string, data: Partial<Handover>): Handover | null => {
    const list = read<Handover>(KEYS.handovers);
    const idx = list.findIndex(h => h.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    write(KEYS.handovers, list);
    return list[idx];
  },
  remove: (id: string) => write(KEYS.handovers, read<Handover>(KEYS.handovers).filter(h => h.id !== id)),
};

// ---- TASKS ---------------------------------------------------
export const tasks = {
  all: () => read<Task>(KEYS.tasks),
  byAccount: (accountId: string) => read<Task>(KEYS.tasks).filter(t => t.accountId === accountId),
  create: (data: Omit<Task, 'id' | 'createdAt'>): Task => {
    const list = read<Task>(KEYS.tasks);
    const t: Task = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    write(KEYS.tasks, [...list, t]);
    return t;
  },
  update: (id: string, data: Partial<Task>): Task | null => {
    const list = read<Task>(KEYS.tasks);
    const idx = list.findIndex(t => t.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    write(KEYS.tasks, list);
    return list[idx];
  },
  remove: (id: string) => write(KEYS.tasks, read<Task>(KEYS.tasks).filter(t => t.id !== id)),
};

// ---- VACATIONS -----------------------------------------------
export const vacations = {
  all: () => read<VacationPlan>(KEYS.vacations),
  create: (data: Omit<VacationPlan, 'id' | 'createdAt'>): VacationPlan => {
    const list = read<VacationPlan>(KEYS.vacations);
    const v: VacationPlan = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    write(KEYS.vacations, [...list, v]);
    return v;
  },
  update: (id: string, data: Partial<VacationPlan>): VacationPlan | null => {
    const list = read<VacationPlan>(KEYS.vacations);
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    write(KEYS.vacations, list);
    return list[idx];
  },
  remove: (id: string) => write(KEYS.vacations, read<VacationPlan>(KEYS.vacations).filter(v => v.id !== id)),
};
