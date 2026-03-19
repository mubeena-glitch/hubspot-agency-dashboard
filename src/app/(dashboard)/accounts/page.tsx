'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { accounts, users, type HubSpotAccount } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { Plus, Search } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  AT_RISK: 'bg-yellow-100 text-yellow-700',
  CHURNED: 'bg-red-100 text-red-700',
  ONBOARDING: 'bg-blue-100 text-blue-700',
};

export default function AccountsPage() {
  const [list, setList] = useState<HubSpotAccount[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setList(accounts.all());
    const um: Record<string, string> = {};
    users.all().forEach(u => { um[u.id] = u.name; });
    setUserMap(um);
  }, []);

  const filtered = list.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.hubspotPortalId.includes(search);
    const matchStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <TopBar title="Accounts" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {['ALL', 'ACTIVE', 'AT_RISK', 'ONBOARDING', 'CHURNED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <Link href="/accounts/new" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Add Account
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Account', 'Industry', 'Status', 'MRR', 'Manager', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-gray-400 py-12">No accounts found</td></tr>
              ) : filtered.map(acc => (
                <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{acc.name}</p>
                    <p className="text-xs text-gray-400">#{acc.hubspotPortalId}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{acc.industry}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE[acc.status]}`}>{acc.status}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(acc.mrr)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{userMap[acc.assignedManagerId] || '—'}</td>
                  <td className="px-6 py-4">
                    <Link href={`/accounts/${acc.id}`} className="text-orange-500 hover:text-orange-600 text-sm font-medium mr-3">View</Link>
                    <Link href={`/accounts/${acc.id}/edit`} className="text-gray-500 hover:text-gray-700 text-sm font-medium">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
