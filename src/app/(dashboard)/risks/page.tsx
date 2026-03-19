'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { accounts, users, handovers, type HubSpotAccount } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export default function RisksPage() {
  const [atRisk, setAtRisk] = useState<HubSpotAccount[]>([]);
  const [pendingHandovers, setPendingHandovers] = useState(0);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setAtRisk(accounts.all().filter(a => a.status === 'AT_RISK' || a.status === 'CHURNED'));
    setPendingHandovers(handovers.all().filter(h => h.status === 'PENDING' || h.status === 'IN_PROGRESS').length);
    const um: Record<string, string> = {};
    users.all().forEach(u => { um[u.id] = u.name; });
    setUserMap(um);
  }, []);

  const STATUS_BADGE: Record<string, string> = {
    AT_RISK: 'bg-yellow-100 text-yellow-700',
    CHURNED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <TopBar title="Risk Radar" />
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-xl border border-red-100 p-5">
            <p className="text-sm font-medium text-red-700">At Risk Accounts</p>
            <p className="text-3xl font-bold text-red-800 mt-1">{atRisk.filter(a => a.status === 'AT_RISK').length}</p>
          </div>
          <div className="bg-gray-100 rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700">Churned</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{atRisk.filter(a => a.status === 'CHURNED').length}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-5">
            <p className="text-sm font-medium text-yellow-700">Open Handovers</p>
            <p className="text-3xl font-bold text-yellow-800 mt-1">{pendingHandovers}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900">Accounts Requiring Attention</h2>
          </div>
          {atRisk.length === 0 ? (
            <div className="text-center text-green-600 py-12 font-medium">✅ No at-risk accounts right now!</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Account', 'Status', 'MRR', 'Manager', 'Notes', 'Action'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {atRisk.map(acc => (
                  <tr key={acc.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{acc.name}</td>
                    <td className="px-6 py-4"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[acc.status] || ''}`}>{acc.status}</span></td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(acc.mrr)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{userMap[acc.assignedManagerId] || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{acc.notes}</td>
                    <td className="px-6 py-4">
                      <Link href={`/accounts/${acc.id}`} className="text-orange-500 hover:text-orange-600 text-sm font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
