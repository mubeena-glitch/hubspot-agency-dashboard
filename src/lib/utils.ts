import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800',
  AT_RISK: 'bg-yellow-100 text-yellow-800',
  CHURNED: 'bg-red-100 text-red-800',
  ONBOARDING: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  APPROVED: 'bg-purple-100 text-purple-700',
  TODO: 'bg-gray-100 text-gray-700',
  DONE: 'bg-green-100 text-green-700',
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-orange-100 text-orange-700',
  HIGH: 'bg-red-100 text-red-700',
};
