'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { packages, members, clients, clientHandovers, type HandoverPackage, type ClientHandover, type HandoverStatus } from '@/lib/storage';
import { formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, TYPE_COLORS, ROLE_LABELS, calcCompletion } from '@/lib/utils';
import { ArrowLeft, Upload, Sparkles, CheckCircle2, Clock, AlertCircle, ChevronRight, FileText, Loader2 } from 'lucide-react';

export default function HandoverPackagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<HandoverPackage | null>(null);
  const [handovers, setHandovers] = useState<ClientHandover[]>([]);
  const [member, setMember] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [coverPerson, setCoverPerson] = useState('');
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    const p = packages.get(id);
    if (!p) { router.push('/handovers'); return; }
    setPkg(p);
    const m = members.get(p.teamMemberId);
    setMember(m?.name || '—');
    setMemberRole(m ? ROLE_LABELS[m.role] : '');
    if (p.coverPersonId) { const cp = members.get(p.coverPersonId); setCoverPerson(cp?.name || ''); }
    const cm: Record<string, string> = {};
    clients.all().forEach(c => { cm[c.id] = c.name; });
    setClientMap(cm);
    const hs = p.clientHandoverIds.map(hid => clientHandovers.get(hid)).filter(Boolean) as ClientHandover[];
    const updated = hs.map(h => {
      const pct = calcCompletion(h);
      if (pct !== h.completionPct) { clientHandovers.update(h.id, { completionPct: pct }); return { ...h, completionPct: pct }; }
      return h;
    });
    setHandovers(updated);
  };

  useEffect(() => { reload(); }, [id]);

  const handleStatusChange = (status: HandoverStatus) => {
    packages.update(id, { status });
    reload();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pkg) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const entryId = Date.now().toString();

      const newEntry = {
        id: entryId,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        processed: false,
        summary: '',
        clientId: undefined as string | undefined,
      };

      const updated = packages.update(id, {
        firefliesTranscripts: [...(pkg.firefliesTranscripts || []), newEntry]
      });
      if (updated) setPkg(updated);
      setUploading(false);
      setAiProcessing(entryId);

      // Call Claude API to process transcript
      try {
        const clientNames = handovers.map(h => ({
          id: h.id,
          clientId: h.clientId,
          name: clientMap[h.clientId] || h.clientId
        }));

        const prompt = `You are analysing a handover call transcript from a digital agency. The team member leaving/going on leave handles these clients: ${clientNames.map(c => c.name).join(', ')}.

Transcript content:
---
${text.substring(0, 8000)}
---

Extract all useful handover information from this transcript. Respond ONLY with a JSON object in this exact structure:
{
  "clientMatches": [
    {
      "clientName": "exact client name from the list",
      "handoverId": "the handover id for that client",
      "extractedData": {
        "hubspot": {
          "portalId": "",
          "activeHubs": [],
          "keyWorkflows": "",
          "pipelineNames": "",
          "crmNotes": ""
        },
        "techStack": {
          "siteType": "",
          "siteUrl": "",
          "stagingUrl": "",
          "adminUrl": "",
          "repoUrl": "",
          "hostingProvider": "",
          "deploymentProcess": "",
          "plugins": "",
          "techNotes": ""
        },
        "integrations": [
          {"name": "", "type": "", "purpose": "", "accessMethod": "", "credentialsLocation": "", "notes": ""}
        ],
        "accessDetails": [
          {"tool": "", "url": "", "username": "", "credentialsLocation": "", "twoFactorInfo": "", "accessLevel": "", "notes": ""}
        ],
        "contacts": [
          {"name": "", "role": "", "email": "", "phone": "", "notes": ""}
        ],
        "ongoingWork": {
          "activeProjects": "",
          "openIssues": "",
          "pendingTasks": "",
          "criticalDeadlines": "",
          "doNotTouch": "",
          "clientExpectations": "",
          "weeklyTasks": ""
        },
        "roleSpecific": {
          "pmTool": "",
          "pmUrl": "",
          "meetingCadence": "",
          "figmaUrl": "",
          "brandGuidelinesUrl": "",
          "integrationArchitecture": "",
          "dataFlowNotes": ""
        }
      }
    }
  ],
  "summary": "2-3 sentence summary of the key handover points discussed"
}

Only include fields where you found actual data in the transcript. For clientMatches, use the handoverId from this mapping: ${JSON.stringify(clientNames.map(c => ({ name: c.name, handoverId: c.id })))}`;

        const resp = await fetch('/api/ai-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, transcriptText: text.substring(0, 10000) })
        });

        if (resp.ok) {
          const result = await resp.json();
          if (result.data?.clientMatches) {
            for (const match of result.data.clientMatches) {
              const h = handovers.find(x => x.id === match.handoverId);
              if (h && match.extractedData) {
                const ed = match.extractedData;
                const updates: Partial<ClientHandover> = {};
                if (ed.hubspot) {
                  updates.hubspot = { ...h.hubspot };
                  Object.entries(ed.hubspot).forEach(([k, v]) => {
                    if (v && k in updates.hubspot!) (updates.hubspot as Record<string, unknown>)[k] = v;
                  });
                }
                if (ed.techStack) {
                  updates.techStack = { ...h.techStack };
                  Object.entries(ed.techStack).forEach(([k, v]) => {
                    if (v && k in updates.techStack!) (updates.techStack as Record<string, unknown>)[k] = v;
                  });
                }
                if (ed.integrations?.length) updates.integrations = [...h.integrations, ...ed.integrations.filter((i: { name?: string }) => i.name).map((i: Record<string, string>) => ({ ...i, id: Date.now().toString() + Math.random() }))];
                if (ed.accessDetails?.length) updates.accessDetails = [...h.accessDetails, ...ed.accessDetails.filter((a: { tool?: string }) => a.tool).map((a: Record<string, string>) => ({ ...a, id: Date.now().toString() + Math.random() }))];
                if (ed.contacts?.length) updates.contacts = [...h.contacts, ...ed.contacts.filter((c: { name?: string }) => c.name).map((c: Record<string, string>) => ({ ...c, id: Date.now().toString() + Math.random() }))];
                if (ed.ongoingWork) {
                  updates.ongoingWork = { ...h.ongoingWork };
                  Object.entries(ed.ongoingWork).forEach(([k, v]) => {
                    if (v && k in updates.ongoingWork!) (updates.ongoingWork as Record<string, unknown>)[k] = v;
                  });
                }
                if (ed.roleSpecific) {
                  updates.roleSpecific = { ...h.roleSpecific };
                  Object.entries(ed.roleSpecific).forEach(([k, v]) => {
                    if (v && k in updates.roleSpecific!) (updates.roleSpecific as Record<string, unknown>)[k] = v;
                  });
                }
                clientHandovers.update(h.id, updates);
              }
            }
          }
          // Mark as processed
          const current = packages.get(id);
          if (current) {
            packages.update(id, {
              firefliesTranscripts: current.firefliesTranscripts.map(t =>
                t.id === entryId ? { ...t, processed: true, summary: result.data?.summary || 'Processed' } : t
              )
            });
          }
        }
      } catch (err) {
        console.error('AI processing failed:', err);
        const current = packages.get(id);
        if (current) {
          packages.update(id, {
            firefliesTranscripts: current.firefliesTranscripts.map(t =>
              t.id === entryId ? { ...t, processed: true, summary: 'Processing failed — please review manually' } : t
            )
          });
        }
      }
      setAiProcessing(null);
      reload();
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!pkg) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const overallCompletion = handovers.length > 0
    ? Math.round(handovers.reduce((s, h) => s + h.completionPct, 0) / handovers.length)
    : 0;

  return (
    <div>
      <TopBar title="Handover Package" subtitle={`${member} — ${HANDOVER_TYPE_LABELS[pkg.type]}`} />
      <div className="p-6 max-w-4xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> All Packages
        </Link>

        {/* Package Header */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{member}</h2>
                <span className="text-gray-300">·</span>
                <span className="text-gray-600 text-sm">{memberRole}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[pkg.type]}`}>{HANDOVER_TYPE_LABELS[pkg.type]}</span>
                {pkg.startDate && <span className="text-sm text-gray-500">Last day: <strong>{formatDate(pkg.startDate)}</strong></span>}
                {pkg.endDate && <span className="text-sm text-gray-500">Returns: <strong>{formatDate(pkg.endDate)}</strong></span>}
                {coverPerson && <span className="text-sm text-gray-500">Cover: <strong>{coverPerson}</strong></span>}
              </div>
              {pkg.notes && <p className="text-sm text-gray-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">{pkg.notes}</p>}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{overallCompletion}%</div>
              <p className="text-xs text-gray-400">documented</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${overallCompletion}%` }} />
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">Status:</span>
            {(['DRAFT', 'IN_REVIEW', 'COMPLETE'] as HandoverStatus[]).map(s => (
              <button key={s} onClick={() => handleStatusChange(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${pkg.status === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-indigo-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Fireflies Upload */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Transcript Processing</h3>
                <p className="text-xs text-gray-500">Upload a Fireflies or any handover call transcript — AI will extract and auto-fill documentation across all clients</p>
              </div>
            </div>
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading || aiProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Reading…' : 'Upload Transcript (.txt)'}
              <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md" onChange={handleFileUpload} className="hidden" disabled={!!uploading || !!aiProcessing} />
            </label>
          </div>

          {pkg.firefliesTranscripts.length > 0 && (
            <div className="space-y-2 mt-3">
              {pkg.firefliesTranscripts.map(t => (
                <div key={t.id} className="bg-white rounded-lg p-3 flex items-start gap-3 border border-indigo-100">
                  <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.fileName}</p>
                      {aiProcessing === t.id ? (
                        <span className="flex items-center gap-1 text-xs text-indigo-600"><Loader2 className="w-3 h-3 animate-spin" /> AI processing…</span>
                      ) : t.processed ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> Processed</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600"><Clock className="w-3 h-3" /> Pending</span>
                      )}
                    </div>
                    {t.summary && <p className="text-xs text-gray-500 mt-0.5">{t.summary}</p>}
                    <p className="text-xs text-gray-400">{formatDate(t.uploadedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client Handovers */}
        <h3 className="font-semibold text-gray-900 mb-3">Client Documentation ({handovers.length})</h3>
        <div className="space-y-3">
          {handovers.map(h => {
            const pct = h.completionPct;
            const icon = pct >= 80 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
              pct >= 40 ? <Clock className="w-5 h-5 text-yellow-500" /> :
              <AlertCircle className="w-5 h-5 text-red-400" />;
            return (
              <Link key={h.id} href={`/handovers/${id}/client/${h.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  {icon}
                  <div>
                    <p className="font-semibold text-gray-900">{clientMap[h.clientId] || 'Unknown Client'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-32 bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{pct}% complete</span>
                      <span className="text-xs text-gray-400">{h.integrations.length} integrations · {h.accessDetails.length} access details · {h.contacts.length} contacts</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
