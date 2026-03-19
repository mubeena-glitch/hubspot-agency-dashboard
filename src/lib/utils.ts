import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UserRole, HandoverType, HandoverStatus } from './storage';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin', PM: 'Project Manager', INTEGRATION_SPECIALIST: 'Integration Specialist',
  DESIGNER: 'Designer', DEVELOPER: 'Developer', TEAM_LEAD: 'Team Lead',
  COPYWRITER: 'Copywriter', SEO_SPECIALIST: 'SEO Specialist', OTHER: 'Other'
};

export const HANDOVER_TYPE_LABELS: Record<HandoverType, string> = {
  RESIGNATION: 'Resignation', LAYOFF: 'Layoff', MATERNITY_LEAVE: 'Maternity / Paternity Leave',
  VACATION: 'Vacation', SICK_LEAVE: 'Sick Leave', OTHER: 'Other'
};

export const STATUS_COLORS: Record<HandoverStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  IN_REVIEW: 'bg-yellow-100 text-yellow-700',
  COMPLETE: 'bg-green-100 text-green-700',
};

export const TYPE_COLORS: Record<HandoverType, string> = {
  RESIGNATION: 'bg-red-100 text-red-700',
  LAYOFF: 'bg-red-100 text-red-700',
  MATERNITY_LEAVE: 'bg-purple-100 text-purple-700',
  VACATION: 'bg-blue-100 text-blue-700',
  SICK_LEAVE: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

export function calcCompletion(h: import('./storage').ClientHandover): number {
  let score = 0; let total = 0;
  const check = (val: string | string[] | undefined) => { total++; if (val && (typeof val === 'string' ? val.trim().length > 0 : val.length > 0)) score++; };
  check(h.hubspot.portalId); check(h.hubspot.activeHubs);
  check(h.techStack.siteUrl); check(h.techStack.siteType);
  check(h.ongoingWork.activeProjects); check(h.ongoingWork.pendingTasks);
  if (h.integrations.length > 0) { score++; } total++;
  if (h.accessDetails.length > 0) { score++; } total++;
  if (h.contacts.length > 0) { score++; } total++;
  return Math.round((score / total) * 100);
}
