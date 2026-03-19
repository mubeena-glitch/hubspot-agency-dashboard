'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { handoverFiles, members, clients, clientHandovers, type HandoverType, type TeamMember, type Client,
  emptyHubspot, emptyTechStack, emptyOngoing, emptyRoleSpecific } from '@/lib/storage';
import { HANDOVER_TYPE_LABELS, HANDOVER_TYPES_SORTED, ROLE_LABELS } from '@/lib/utils';
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Users, Building2 } from 'lucide-react';

const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';

// Step indicator
function StepBar({ step }: { step: number }) {
  const steps = [
    { n: 1, label: 'Team Member & Reason' },
    { n: 2, label: 'Client Documentation' },
    { n: 3, label: 'Review & Submit' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s.n ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : s.n}
            </div>
            <p className={`text-xs mt-1 font-medium text-center leading-tight ${step >= s.n ? 'text-indigo-600' : 'text-gray-400'}`}>{s.label}</p>
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-2 mb-4 transition-all ${step > s.n ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );
}

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

  const step1Valid = form.teamMemberId && form.startDate;
  const step2Valid = selectedClients.length > 0;

  const handleSubmit = () => {
    const clientHandoverIds: string[] = selectedClients.map(clientId => {
      const ch = clientHandovers.create({
        handoverFileId: '', clientId,
        hubspot: emptyHubspot(), techStack: emptyTechStack(),
        integrations: [], accessDetails: [], contacts: [], documents: [],
        ongoingWork: emptyOngoing(), roleSpecific: emptyRoleSpecific(),
        aiSummary: '', completionPct: 0,
      });
      return ch.id;
    });
    const f = handoverFiles.create({
      teamMemberId: form.teamMemberId, type: form.type, status: 'DRAFT',
      startDate: form.startDate, endDate: form.endDate || undefined,
      coverPersonId: form.coverPersonId || undefined,
      reason: HANDOVER_TYPE_LABELS[form.type],
      clientHandoverIds, firefliesTranscripts: [], notes: form.notes,
    });
    clientHandoverIds.forEach(id => clientHandovers.update(id, { handoverFileId: f.id }));
    router.push(`/handovers/${f.id}`);
  };

  const toggleClient = (id: string) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectedMember = teamMembers.find(m => m.id === form.teamMemberId);

  return (
    <div>
      <TopBar title="New Handover File" />
      <div className="p-6 max-w-2xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Handover Files
        </Link>

        <StepBar step={step} />

        {/* ── STEP 1: Team Member & Reason ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-gray-900">Who is this handover for?</h2>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Team Member <span className="text-red-500">*</span></label>
              <select required value={form.teamMemberId} onChange={e => setForm(f => ({ ...f, teamMemberId: e.target.value }))} className={ic}>
                <option value="">Select team member…</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name} — {ROLE_LABELS[m.role]}</option>)}
              </select>
              {selectedMember && (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 bg-indigo-50 px-3 py-2 rounded-lg">
                  <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span>{selectedMember.email}</span>
                  {selectedMember.phone && <span>· {selectedMember.phone}</span>}
                  {selectedMember.slack && <span>· {selectedMember.slack}</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Reason for Handover <span className="text-red-500">*</span></label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as HandoverType }))} className={ic}>
                {HANDOVER_TYPES_SORTED.map(t => <option key={t} value={t}>{HANDOVER_TYPE_LABELS[t]}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex justify-end pt-2">
              <button disabled={!step1Valid} onClick={() => setStep(2)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Next: Select Clients <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Client Documentation (highlighted as main step) ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Hero callout */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-lg">This is the most important step</h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    Select every client <strong>{selectedMember?.name || 'this person'}</strong> manages.
                    For each one, you&apos;ll document HubSpot setup, tech stack, integrations, access credentials, contacts, ongoing work, and role-specific details — everything the next person needs without asking.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Select clients to document</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedClients.length === 0 ? 'No clients selected yet' : `${selectedClients.length} client${selectedClients.length !== 1 ? 's' : ''} selected`}
                  </p>
                </div>
                {allClients.length > 0 && (
                  <button onClick={() => setSelectedClients(selectedClients.length === allClients.length ? [] : allClients.map(c => c.id))}
                    className="text-xs text-indigo-600 hover:underline">
                    {selectedClients.length === allClients.length ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>

              {allClients.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No clients yet.</p>
                  <Link href="/clients" className="text-indigo-600 text-sm hover:underline">Add clients first →</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {allClients.map(c => (
                    <label key={c.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedClients.includes(c.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all shrink-0 ${selectedClients.includes(c.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                        {selectedClients.includes(c.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input type="checkbox" checked={selectedClients.includes(c.id)} onChange={() => toggleClient(c.id)} className="hidden" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{c.industry}</span>
                          {c.website && <span className="text-xs text-indigo-500">{c.website}</span>}
                        </div>
                      </div>
                      {selectedClients.includes(c.id) && (
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">Selected</span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setStep(1)} className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button disabled={!step2Valid} onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Next: Review & Create <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h2 className="font-semibold text-gray-900">Review & Create Handover File</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Team Member</span>
                  <span className="font-medium text-gray-900">{selectedMember?.name} — {selectedMember ? ROLE_LABELS[selectedMember.role] : ''}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Reason</span>
                  <span className="font-medium text-gray-900">{HANDOVER_TYPE_LABELS[form.type]}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Last Day / Start</span>
                  <span className="font-medium text-gray-900">{form.startDate}</span>
                </div>
                {form.endDate && (
                  <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                    <span className="text-gray-500">Return Date</span>
                    <span className="font-medium text-gray-900">{form.endDate}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">Cover Person</span>
                  <span className="font-medium text-gray-900">{form.coverPersonId ? teamMembers.find(m => m.id === form.coverPersonId)?.name : 'Not assigned'}</span>
                </div>
                <div className="py-2">
                  <p className="text-gray-500 text-sm mb-2">Clients to document ({selectedClients.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedClients.map(cid => {
                      const c = allClients.find(x => x.id === cid);
                      return <span key={cid} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg font-medium">{c?.name}</span>;
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 mb-1">What happens next?</p>
                <p className="text-xs text-amber-600">After creating, you&apos;ll document each client in detail across 8 tabs. Once complete, submit for PM approval. You can also upload Fireflies call transcripts to auto-fill the documentation using AI.</p>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setStep(2)} className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSubmit}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
                  <FileText className="w-4 h-4" /> Create Handover File & Start Documenting
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
