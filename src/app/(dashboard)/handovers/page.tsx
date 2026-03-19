'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { handoverFiles, members, clientHandovers, type HandoverFile } from '@/lib/storage';
import { formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, ROLE_LABELS } from '@/lib/utils';
import { Plus, FileText, Trash2 } from 'lucide-react';

export default function HandoversPage() {
  const [files, setFiles] = useState<HandoverFile[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string>>({});

  const reload = () => {
    setFiles(handoverFiles.all().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    const mm: Record<string, string> = {}; const rm: Record<string, string> = {};
    members.all().forEach(m => { mm[m.id] = m.name; rm[m.id] = ROLE_LABELS[m.role]; });
    setMemberMap(mm); setMemberRoleMap(rm);
  };
  useEffect(reload, []);

  return (
    <div>
      <TopBar title="Handover Files" subtitle="All team member transitions" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <Link href="/handovers/new" className="flex items-center gap-2 bg-[#9354FF] hover:bg-[#6B35CC] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Handover File
          </Link>
        </div>

        {files.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No handover files yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map(f => {
              const allH = clientHandovers.all().filter(h => f.clientHandoverIds.includes(h.id));
              const avgPct = allH.length > 0 ? Math.round(allH.reduce((s, h) => s + h.completionPct, 0) / allH.length) : 0;
              return (
                <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between">
                    <Link href={`/handovers/${f.id}`} className="flex-1 hover:opacity-80">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-base">{memberMap[f.teamMemberId] || '—'}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-sm text-gray-500">{memberRoleMap[f.teamMemberId]}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_COLORS[f.type]}`}>{HANDOVER_TYPE_LABELS[f.type]}</span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[f.status]}`}>{STATUS_LABELS[f.status]}</span>
                        <span className="text-xs text-gray-400">{formatDate(f.createdAt)}</span>
                        {f.endDate && <span className="text-xs text-gray-400">→ {formatDate(f.endDate)}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="w-48 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${avgPct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{avgPct}% documented · {f.clientHandoverIds.length} client{f.clientHandoverIds.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </Link>
                    <button onClick={() => { if (confirm('Delete this handover file?')) { handoverFiles.remove(f.id); reload(); } }}
                      className="ml-4 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
