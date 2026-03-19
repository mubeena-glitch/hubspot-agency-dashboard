'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { packages, members, clients, clientHandovers, type HandoverType, type TeamMember, type Client,
  emptyHubspot, emptyTechStack, emptyOngoing, emptyRoleSpecific } from '@/lib/storage';
import { HANDOVER_TYPE_LABELS, ROLE_LABELS } from '@/lib/utils';
import { ArrowLeft, Plus, X } from 'lucide-react';

const TYPES: HandoverType[] = ['RESIGNATION','LAYOFF','MATERNITY_LEAVE','VACATION','SICK_LEAVE','OTHER'];
const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function NewHandoverPage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ teamMemberId: '', type: 'RESIGNATION' as HandoverType, startDate: '', endDate: '', coverPersonId: '', reason: '', notes: '' });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  useEffect(() => {
    setTeamMembers(members.all());
    setAllClients(clients.all());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create a clientHandover record for each selected client
    const clientHandoverIds: string[] = selectedClients.map(clientId => {
      const ch = clientHandovers.create({
        handoverPackageId: '', clientId,
        hubspot: emptyHubspot(),
        techStack: emptyTechStack(),
        integrations: [],
        accessDetails: [],
        contacts: [],
        documents: [],
        ongoingWork: emptyOngoing(),
        roleSpecific: emptyRoleSpecific(),
        aiSummary: '',
        completionPct: 0,
      });
      return ch.id;
    });

    const pkg = packages.create({
      teamMemberId: form.teamMemberId,
      type: form.type,
      status: 'DRAFT',
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      coverPersonId: form.coverPersonId || undefined,
      reason: form.reason,
      clientHandoverIds,
      firefliesTranscripts: [],
      notes: form.notes,
    });

    // Back-fill the packageId on each clientHandover
    clientHandoverIds.forEach(id => clientHandovers.update(id, { handoverPackageId: pkg.id }));

    router.push(`/handovers/${pkg.id}`);
  };

  const toggleClient = (id: string) => {
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <TopBar title="New Handover Package" />
      <div className="p-6 max-w-2xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Team Member <span className="text-red-500">*</span></label>
              <select required value={form.teamMemberId} onChange={e => setForm(f => ({ ...f, teamMemberId: e.target.value }))} className={ic}>
                <option value="">Select team member…</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} — {ROLE_LABELS[m.role]}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Handover <span className="text-red-500">*</span></label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as HandoverType }))} className={ic}>
                {TYPES.map(t => <option key={t} value={t}>{HANDOVER_TYPE_LABELS[t]}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Day / Start Date <span className="text-red-500">*</span></label>
                <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Return Date <span className="text-gray-400 font-normal">(if vacation/leave)</span></label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={ic} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Person</label>
              <select value={form.coverPersonId} onChange={e => setForm(f => ({ ...f, coverPersonId: e.target.value }))} className={ic}>
                <option value="">Select cover person…</option>
                {teamMembers.filter(m => m.id !== form.teamMemberId).map(m => <option key={m.id} value={m.id}>{m.name} — {ROLE_LABELS[m.role]}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Context</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={ic} placeholder="Any extra context about this handover…" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Clients to Document <span className="text-red-500">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">Select all clients this person manages</span>
              </label>
              {allClients.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">No clients yet. <Link href="/clients" className="text-indigo-600 hover:underline">Add clients first</Link></p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {allClients.map(c => (
                    <label key={c.id} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${selectedClients.includes(c.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} className="rounded text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.industry}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={selectedClients.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Create Handover Package
              </button>
              <Link href="/handovers" className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
