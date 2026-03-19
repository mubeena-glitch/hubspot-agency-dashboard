'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { accounts, handovers, tasks, users, vacations } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { Users, DollarSign, AlertTriangle, ArrowLeftRight, CheckSquare, CalendarOff } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalAccounts: 0, activeAccounts: 0, atRisk: 0, totalMrr: 0,
    pendingHandovers: 0, openTasks: 0, teamSize: 0, upcomingVacations: 0,
  });
  const [recentAccounts, setRecentAccounts] = useState<ReturnType<typeof accounts.all>>([]);

  useEffect(() => {
    const accs = accounts.all();
    const hands = handovers.all();
    const ts = tasks.all();
    const us = users.all();
    const vacs = vacations.all();
    setStats({
      totalAccounts: accs.length,
      activeAccounts: accs.filter(a => a.status === 'ACTIVE').length,
      atRisk: accs.filter(a => a.status === 'AT_RISK').length,
      totalMrr: accs.filter(a => a.status !== 'CHURNED').reduce((s, a) => s + a.mrr, 0),
      pendingHandovers: hands.filter(h => h.status !== 'COMPLETED' && h.status !== 'CANCELLED').length,
      openTasks: ts.filter(t => t.status !== 'DONE').length,
      teamSize: us.length,
      upcomingVacations: vacs.filter(v => v.status === 'APPROVED' || v.status === 'PENDING').length,
    });
    setRecentAccounts(accs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5));
  }, []);

  const STAT_CARDS = [
    { label: 'Total MRR', value: formatCurrency(stats.totalMrr), icon: DollarSign, color: 'bg-green-100 text-green-600', change: '+12%' },
    { label: 'Active Accounts', value: stats.activeAccounts, icon: Users, color: 'bg-blue-100 text-blue-600', change: `${stats.totalAccounts} total` },
    { label: 'At Risk', value: stats.atRisk, icon: AlertTriangle, color: 'bg-red-100 text-red-600', change: 'Needs attention' },
    { label: 'Open Handovers', value: stats.pendingHandovers, icon: ArrowLeftRight, color: 'bg-purple-100 text-purple-600', change: 'In progress' },
    { label: 'Open Tasks', value: stats.openTasks, icon: CheckSquare, color: 'bg-orange-100 text-orange-600', change: 'Pending' },
    { label: 'Team Members', value: stats.teamSize, icon: Users, color: 'bg-indigo-100 text-indigo-600', change: 'Active' },
    { label: 'Upcoming Vacations', value: stats.upcomingVacations, icon: CalendarOff, color: 'bg-yellow-100 text-yellow-600', change: 'Approved' },
  ];

  const STATUS_BADGE: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    AT_RISK: 'bg-yellow-100 text-yellow-700',
    CHURNED: 'bg-red-100 text-red-700',
    ONBOARDING: 'bg-blue-100 text-blue-700',
  };

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.slice(0, 4).map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {STAT_CARDS.slice(4).map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{change}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Accounts</h2>
            <Link href="/accounts" className="text-sm text-orange-500 hover:text-orange-600 font-medium">View all</Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Account', 'Industry', 'Status', 'MRR'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAccounts.map(acc => (
                <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/accounts/${acc.id}`} className="font-medium text-gray-900 hover:text-orange-500">{acc.name}</Link>
                    <p className="text-xs text-gray-400">{acc.hubspotPortalId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{acc.industry}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[acc.status] || 'bg-gray-100 text-gray-600'}`}>{acc.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(acc.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
