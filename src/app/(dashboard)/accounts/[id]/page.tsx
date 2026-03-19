'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { accounts, users, tasks, handovers, type HubSpotAccount, type Task } from '@/lib/storage';
import { formatCurrency, formatDate, STATUS_COLORS } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<HubSpotAccount | null>(null);
  const [manager, setManager] = useState('');
  const [accountTasks, setAccountTasks] = useState<Task[]>([]);
  const [relatedHandovers, setRelatedHandovers] = useState<ReturnType<typeof handovers.all>>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const acc = accounts.get(id);
    if (!acc) { router.push('/accounts'); return; }
    setAccount(acc);
    const um: Record<string, string> = {};
    users.all().forEach(u => { um[u.id] = u.name; });
    setUserMap(um);
    setManager(um[acc.assignedManagerId] || '—');
    setAccountTasks(tasks.byAccount(id));
    setRelatedHandovers(handovers.all().filter(h => h.accountId === id));
  }, [id, router]);

  const handleDelete = () => {
    if (confirm('Delete this account?')) {
      accounts.remove(id);
      router.push('/accounts');
    }
  };

  if (!account) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const statusClass = STATUS_COLORS[account.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600';

  return (
    <div>
      <TopBar title="Account Detail" />
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/accounts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{account.name}</h2>
              <p className="text-gray-500 text-sm mt-1">HubSpot Portal: #{account.hubspotPortalId}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/accounts/${id}/edit`} className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
              <button onClick={handleDelete} className="flex items-center gap-1.5 text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Status', value: <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClass}`}>{account.status}</span> },
              { label: 'Industry', value: account.industry },
              { label: 'MRR', value: <span className="font-bold text-green-600">{formatCurrency(account.mrr)}</span> },
              { label: 'Manager', value: manager },
              { label: 'Created', value: formatDate(account.createdAt) },
              { label: 'Updated', value: formatDate(account.updatedAt) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <div className="text-sm font-medium text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          {account.notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs font-medium text-yellow-700 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{account.notes}</p>
            </div>
          )}
        </div>

        {/* Tasks */}
        {accountTasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tasks ({accountTasks.length})</h3>
            <div className="space-y-2">
              {accountTasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{userMap[t.assignedToId] || '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.priority as keyof typeof STATUS_COLORS]}`}>{t.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status as keyof typeof STATUS_COLORS]}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Handovers */}
        {relatedHandovers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Handovers ({relatedHandovers.length})</h3>
            <div className="space-y-2">
              {relatedHandovers.map(h => (
                <div key={h.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{userMap[h.fromUserId]} → {userMap[h.toUserId]}</p>
                    <p className="text-xs text-gray-500">{h.reason}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[h.status as keyof typeof STATUS_COLORS]}`}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
