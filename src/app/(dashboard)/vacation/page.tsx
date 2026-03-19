'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { vacations, users, type VacationPlan } from '@/lib/storage';
import { formatDate, STATUS_COLORS } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

export default function VacationPage() {
  const [list, setList] = useState<VacationPlan[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const reload = () => {
    setList(vacations.all());
    const um: Record<string, string> = {};
    users.all().forEach(u => { um[u.id] = u.name; });
    setUserMap(um);
  };

  useEffect(reload, []);

  return (
    <div>
      <TopBar title="Vacation Plans" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Link href="/vacation/new" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Vacation Plan
          </Link>
        </div>

        <div className="space-y-3">
          {list.length === 0 && <div className="text-center text-gray-400 py-16">No vacation plans</div>}
          {list.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{userMap[v.userId] || '—'}</p>
                <p className="text-sm text-gray-500">Coverage: {userMap[v.coverageUserId] || '—'}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(v.startDate)} → {formatDate(v.endDate)}</p>
                {v.notes && <p className="text-xs text-gray-400 mt-1 italic">{v.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[v.status as keyof typeof STATUS_COLORS]}`}>{v.status}</span>
                <button onClick={() => { vacations.remove(v.id); reload(); }} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
