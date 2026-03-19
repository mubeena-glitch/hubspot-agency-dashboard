'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import {
  handovers, members, clients, clientHandovers,
  type HandoverType, type TeamMember, type Client,
  emptyHubspot, emptyTechStack, emptyOngoing, emptyRoleSpecific
} from '@/lib/storage';
import { HANDOVER_TYPES, HANDOVER_TYPE_LABELS, ROLE_LABELS } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Users, Building2, CheckCircle2 } from 'lucide-react';

const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function NewHandoverPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    teamMemberId: '', type: 'RESIGNATION' as HandoverType,
    startDate: '', endDate: '', coverPersonId: '', notes: ''
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  useEffect(() => {
    setTeamMembers(members.all());
    setAllClients(clients.all());
  }, []);

  const handleCreate = () => {
    const clientHandoverIds: string[] = selectedClients.map(clientId => {
      const ch = clientHandovers.create({
        handoverPackageId: '', clientId,
        hubspot: emptyHubspot(), techStack: emptyTechStack(),
        integrations: [], accessDetails: [], contacts: [], documents: [],
        ongoingWork: emptyOngoing(), roleSpecific: emptyRoleSpecific(),
        aiSummary: '', completionPct: 0,
      });
      return ch.id;
    });

    const pkg = handovers.create({
      teamMemberId: form.teamMemberId, type: form.type, status: 'DRAFT',
      startDate: form.startDate, endDate: form.endDate || undefined,
      coverPersonId: form.coverPersonId || undefined, reason: '',
      clientHandoverIds, firefliesTranscripts: [],
      pmApproval: { approved: false }, notes: form.notes,
    });

    clientHandoverIds.forEach(id => clientHandovers.update(id, { handoverPackageId: pkg.id }));
    router.push(`/handovers/${pkg.id}`);
  };

  const step1Valid = form.teamMemberId && form.startDate;
  const step2Valid = selectedClients.length > 0;

  const selectedMember = teamMembers.find(m => m.id === form.teamMemberId);

  return (
    <div>
      <TopBar title="New Handover" />
      <div className="p-6 max-w-2xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {[
            { n: 1, label: 'Basic Info', icon: Users },
            { n: 2, label: 'Client Documentation', icon: Building2 },
          ].map(({ n, label, icon: Icon }, i) => (
            <div key={n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step > n ? 'bg-green-500 text-white' :
                  step === n ? 'bg-indigo-600 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step > n ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${step === n ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
              </div>
              {i < 1 && <div className={`flex-1 h-0.5 mx-3 mb-4 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Team Member <span className="text-red-500">*</span></label>
              <select required value={form.teamMemberId} onChange={e => setForm(f => ({ ...f, teamMemberId: e.target.value }))} className={ic}>
                <option value="">Select team member…</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} — {ROLE_LABELS[m.role]}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
              <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as HandoverType }))} className={ic}>
                {HANDOVER_TYPES.map(t => <option key={t} value={t}>{HANDOVER_TYPE_LABELS[t]}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Day / Start Date <span className="text-red-500">*</span></label>
                <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Return Date <span className="text-gray-400 font-normal">(if leave)</span></label>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={ic} placeholder="Any context about this handover…" />
            </div>

            <button onClick={() => setStep(2)} disabled={!step1Valid}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Next: Select Clients <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2 — highlighted as the main thing */}
        {step === 2 && (
          <div>
            {/* Big callout */}
            <div className="bg-indigo-600 rounded-xl p-5 mb-5 text-white">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-lg">Select Clients to Document</h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    This is the most important step. Select every client{selectedMember ? ` that ${selectedMember.name} manages` : ''}. 
                    You&apos;ll document HubSpot setup, tech stack, integrations, access details, and more for each one.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {allClients.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No clients yet</p>
                  <Link href="/clients" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">Add clients first →</Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      {selectedClients.length > 0 ? `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''} selected` : 'Select all clients this person handles'}
                    </p>
                    {selectedClients.length < allClients.length
                      ? <button onClick={() => setSelectedClients(allClients.map(c => c.id))} className="text-xs text-indigo-600 hover:underline">Select all</button>
                      : <button onClick={() => setSelectedClients([])} className="text-xs text-gray-400 hover:underline">Clear all</button>
                    }
                  </div>
                  <div className="space-y-2">
                    {allClients.map(c => {
                      const selected = selectedClients.includes(c.id);
                      return (
                        <label key={c.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                        }`}>
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                          }`}>
                            {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" checked={selected}
                            onChange={() => setSelectedClients(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                            className="hidden" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.industry}{c.website ? ` · ${c.website}` : ''}</p>
                          </div>
                          {selected && <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Selected</span>}
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleCreate} disabled={!step2Valid}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Create Handover & Start Documenting
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
