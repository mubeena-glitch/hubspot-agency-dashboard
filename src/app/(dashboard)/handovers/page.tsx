'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { handovers, members, clientHandovers, type Handover } from '@/lib/storage';
import { formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, ROLE_LABELS } from '@/lib/utils';
import { Plus, FolderOpen, Trash2, ShieldCheck, Clock } from 'lucide-react';

export default function HandoversPage() {
  const [list, setList] = useState<Handover[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string>>({});
  const [approverMap, setApproverMap] = useState<Record<string, string>>({});

  const reload = () => {
    setList(handovers.all().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    const mm: Record<string, string> = {};
    const rm: Record<string, string> = {};
    const am: Record<string, string> = {};
    members.all().forEach(m => { mm[m.id] = m.name; rm[m.id] = ROLE_LABELS[m.role]; am[m.id] = m.name; });
    setMemberMap(mm); setMemberRoleMap(rm); setApproverMap(am);
  };
  useEffect(reload, []);

  const handleDelete = (id: string) => {
    if (confirm('Delete this handover and all documentation?')) { handovers.remove(id); reload(); }
  };

  return (
    <div>
      <TopBar title="Handovers" subtitle="All team member transitions" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Link href="/handovers/new" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Handover
          </Link>
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No handovers yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Team Member', 'Reason', 'Clients', 'Progress', 'PM Approval', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(h => {
                  const allDocs = clientHandovers.all().filter(d => h.clientHandoverIds.includes(d.id));
                  const avgPct = allDocs.length > 0
                    ? Math.round(allDocs.reduce((s, d) => s + d.completionPct, 0) / allDocs.length)
                    : 0;
                  return (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/handovers/${h.id}`} className="hover:text-indigo-600">
                          <p className="font-semibold text-gray-900">{memberMap[h.teamMemberId] || '—'}</p>
                          <p className="text-xs text-gray-400">{memberRoleMap[h.teamMemberId]}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[h.type]}`}>{HANDOVER_TYPE_LABELS[h.type]}</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{h.clientHandoverIds.length}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${avgPct >= 80 ? 'bg-green-500' : avgPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${avgPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{avgPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {h.pmApproval.approved ? (
                          <div className="flex items-center gap-1 text-green-700">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-xs font-medium">{approverMap[h.pmApproval.approvedById || ''] || 'PM'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs">Pending</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[h.status]}`}>{STATUS_LABELS[h.status]}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400">{formatDate(h.createdAt)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleDelete(h.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
