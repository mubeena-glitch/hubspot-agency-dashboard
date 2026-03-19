'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { packages, members, clients, clientHandovers, type HandoverType, type TeamMember, type Client,
  emptyHubspot, emptyTechStack, emptyOngoing, emptyRoleSpecific } from '@/lib/storage';
import { HANDOVER_TYPE_LABELS, HANDOVER_TYPES_SORTED, ROLE_LABELS } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Users, Building2, ClipboardList, CheckCircle2 } from 'lucide-react';

const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

const STEPS = [
  { id: 1, label: 'Team Member', icon: Users, desc: 'Who is leaving or going on leave?' },
  { id: 2, label: 'Client Selection', icon: Building2, desc: 'Which clients need to be documented?' },
  { id: 3, label: 'Review & Create', icon: ClipboardList, desc: 'Confirm and create the handover' },
];

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

  const selectedMember = teamMembers.find(m => m.id === form.teamMemberId);
  const coverMember = teamMembers.find(m => m.id === form.coverPersonId);

  const handleSubmit = () => {
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

    const pkg = packages.create({
      teamMemberId: form.teamMemberId, type: form.type, status: 'DRAFT',
      startDate: form.startDate, endDate: form.endDate || undefined,
      coverPersonId: form.coverPersonId || undefined,
      reason: '', clientHandoverIds, firefliesTranscripts: [], notes: form.notes,
      approvalStatus: 'NOT_SUBMITTED' as const,
    });

    clientHandoverIds.forEach(id => clientHandovers.update(id, { handoverPackageId: pkg.id }));
    router.push(`/handovers/${pkg.id}`);
  };

  const toggleClient = (id: string) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div>
      <TopBar title="New Handover" subtitle="Document everything before someone leaves or goes on leave" />
      <div className="p-6 max-w-3xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Handovers
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-1 transition-colors ${step === s.id ? 'bg-indigo-600 text-white' : step > s.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <s.icon className="w-4 h-4 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{s.label}</p>
                  <p className="text-xs opacity-75 truncate hidden sm:block">{s.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-0.5 bg-gray-200 shrink-0" />}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Team Member ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Who is leaving or going on leave?</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Team Member <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {teamMembers.map(m => (
                  <label key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${form.teamMemberId === m.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="member" value={m.id} checked={form.teamMemberId === m.id}
                      onChange={() => setForm(f => ({ ...f, teamMemberId: m.id }))} className="hidden" />
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-indigo-700 font-bold text-xs">{m.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{ROLE_LABELS[m.role]}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
                <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as HandoverType }))} className={ic}>
                  {HANDOVER_TYPES_SORTED.map(t => <option key={t} value={t}>{HANDOVER_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Person</label>
                <select value={form.coverPersonId} onChange={e => setForm(f => ({ ...f, coverPersonId: e.target.value }))} className={ic}>
                  <option value="">Select cover person…</option>
                  {teamMembers.filter(m => m.id !== form.teamMemberId).map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {ROLE_LABELS[m.role]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Last Day / Start Date <span className="text-red-500">*</span></label>
                <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Return Date <span className="text-gray-400 font-normal">(if leave/vacation)</span></label>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={ic} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={ic} placeholder="Any context about this handover…" />
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={!form.teamMemberId || !form.startDate}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Next: Select Clients <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Client Selection — THE MAIN THING ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Big emphasis banner */}
            <div className="bg-indigo-600 text-white rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Building2 className="w-8 h-8 shrink-0 mt-0.5 opacity-80" />
                <div>
                  <h2 className="text-lg font-bold">Select clients to document</h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    This is the most important step. For each client you select, you&apos;ll document everything —
                    HubSpot setup, tech stack, integrations, access details, contacts, and ongoing work.
                    <strong className="text-white"> The new person will rely entirely on what you fill in here.</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Which clients does <span className="text-indigo-600">{selectedMember?.name}</span> manage?
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Select all clients that need handover documentation</p>
                </div>
                {selectedClients.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {selectedClients.length} selected
                  </span>
                )}
              </div>

              {allClients.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No clients yet.</p>
                  <Link href="/clients" className="text-indigo-600 text-sm hover:underline">Add clients first →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {allClients.map(c => (
                    <label key={c.id} onClick={() => toggleClient(c.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedClients.includes(c.id) ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-200 hover:bg-gray-50'}`}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${selectedClients.includes(c.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                        {selectedClients.includes(c.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.industry}</p>
                        {c.website && <p className="text-xs text-indigo-500 mt-0.5 truncate">{c.website}</p>}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedClients.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✓ {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected —
                    you&apos;ll fill in detailed documentation for each one in the next step
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button disabled={selectedClients.length === 0}
                onClick={() => setStep(3)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Next: Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Create ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-lg">Review & confirm</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Team Member</p>
                  <p className="font-semibold text-gray-900">{selectedMember?.name}</p>
                  <p className="text-sm text-gray-500">{selectedMember ? ROLE_LABELS[selectedMember.role] : ''}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Reason</p>
                  <p className="font-semibold text-gray-900">{HANDOVER_TYPE_LABELS[form.type]}</p>
                  {form.startDate && <p className="text-sm text-gray-500">From {form.startDate}{form.endDate ? ` → ${form.endDate}` : ''}</p>}
                </div>
                {coverMember && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Cover Person</p>
                    <p className="font-semibold text-gray-900">{coverMember.name}</p>
                  </div>
                )}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide mb-1">Clients to Document</p>
                  <p className="font-bold text-indigo-700 text-2xl">{selectedClients.length}</p>
                  <div className="mt-1 space-y-0.5">
                    {selectedClients.map(id => {
                      const c = allClients.find(cl => cl.id === id);
                      return c ? <p key={id} className="text-xs text-indigo-600">· {c.name}</p> : null;
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-sm text-amber-800 font-semibold mb-1">What happens next?</p>
                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>Fill in client documentation for each client (HubSpot, tech stack, integrations, access, contacts…)</li>
                  <li>Upload handover call transcript — AI will extract and auto-fill missing details</li>
                  <li>Submit for PM approval</li>
                  <li>Download the final handover summary document</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSubmit}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
                <ClipboardList className="w-4 h-4" /> Create Handover & Start Documenting
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
