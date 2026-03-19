'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { handoverFiles, members, clients, clientHandovers, type HandoverFile } from '@/lib/storage';
import { formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, ROLE_LABELS } from '@/lib/utils';
import { Plus, AlertTriangle, CheckCircle2, Clock, Users, Building2, FileText, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const [files, setFiles] = useState<HandoverFile[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total: 0, draft: 0, pendingApproval: 0, approved: 0, complete: 0, totalMembers: 0, totalClients: 0 });

  useEffect(() => {
    const all = handoverFiles.all().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setFiles(all);
    const mm: Record<string, string> = {}; const rm: Record<string, string> = {};
    members.all().forEach(m => { mm[m.id] = m.name; rm[m.id] = ROLE_LABELS[m.role]; });
    setMemberMap(mm); setMemberRoleMap(rm);
    setStats({
      total: all.length,
      draft: all.filter(p => p.status === 'DRAFT').length,
      pendingApproval: all.filter(p => p.status === 'PENDING_APPROVAL').length,
      approved: all.filter(p => p.status === 'APPROVED').length,
      complete: all.filter(p => p.status === 'COMPLETE').length,
      totalMembers: members.all().length,
      totalClients: clients.all().length,
    });
  }, []);

  const STAT_CARDS = [
    { label: 'Total Files', value: stats.total, icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Draft', value: stats.draft, icon: Clock, color: 'bg-gray-50 text-gray-600' },
    { label: 'Pending Approval', value: stats.pendingApproval, icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'Approved', value: stats.approved, icon: ShieldCheck, color: 'bg-blue-50 text-blue-600' },
    { label: 'Complete', value: stats.complete, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
    { label: 'Team Members', value: stats.totalMembers, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Clients', value: stats.totalClients, icon: Building2, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div>
      <TopBar title="Dashboard" subtitle="Agency Handover Management" />
      <div className="p-6">
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-8">
          {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Handover Files</h2>
          <Link href="/handovers/new" className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Handover File
          </Link>
        </div>

        {files.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-500">No handover files yet</p>
            <p className="text-sm text-gray-400 mt-1">Create one when a team member is leaving or going on leave</p>
            <Link href="/handovers/new" className="mt-4 inline-flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Plus className="w-4 h-4" /> Create First Handover File
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {files.slice(0, 10).map(f => {
              const completedClients = f.clientHandoverIds.length > 0
                ? clientHandovers.all().filter(h => f.clientHandoverIds.includes(h.id) && h.completionPct >= 80).length : 0;
              return (
                <Link key={f.id} href={`/handovers/${f.id}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{memberMap[f.teamMemberId] || 'Unknown'}</p>
                        <span className="text-xs text-gray-400">·</span>
                        <p className="text-sm text-gray-500">{memberRoleMap[f.teamMemberId]}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${TYPE_COLORS[f.type]}`}>{HANDOVER_TYPE_LABELS[f.type]}</span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[f.status]}`}>{STATUS_LABELS[f.status]}</span>
                        <span className="text-xs text-gray-400">{formatDate(f.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-gray-900">{f.clientHandoverIds.length} client{f.clientHandoverIds.length !== 1 ? 's' : ''}</p>
                      <p className="text-xs text-gray-400">{completedClients} documented</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
