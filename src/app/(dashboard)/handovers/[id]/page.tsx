'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import {
  handovers, members, clients, clientHandovers, auth,
  type Handover, type ClientHandover, type HandoverStatus
} from '@/lib/storage';
import {
  formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS,
  TYPE_COLORS, ROLE_LABELS, calcCompletion
} from '@/lib/utils';
import {
  ArrowLeft, Upload, Sparkles, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileText, Loader2, ShieldCheck, Download, ClipboardList
} from 'lucide-react';

const TABS = ['Clients', 'Approval', 'Transcript (AI)', 'Summary'];

export default function HandoverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [handover, setHandover] = useState<Handover | null>(null);
  const [clientDocs, setClientDocs] = useState<ClientHandover[]>([]);
  const [member, setMember] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [coverPerson, setCoverPerson] = useState('');
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [clientIndustryMap, setClientIndustryMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof auth.current>>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(() => {
    const h = handovers.get(id);
    if (!h) { router.push('/handovers'); return; }
    setHandover(h);
    setApprovalNotes(h.pmApproval.notes || '');
    const m = members.get(h.teamMemberId);
    setMember(m?.name || '—');
    setMemberRole(m ? ROLE_LABELS[m.role] : '');
    if (h.coverPersonId) { const cp = members.get(h.coverPersonId); setCoverPerson(cp?.name || ''); }
    const cm: Record<string, string> = {};
    const cim: Record<string, string> = {};
    clients.all().forEach(c => { cm[c.id] = c.name; cim[c.id] = c.industry; });
    setClientMap(cm); setClientIndustryMap(cim);
    const docs = h.clientHandoverIds.map(hid => clientHandovers.get(hid)).filter(Boolean) as ClientHandover[];
    const updated = docs.map(doc => {
      const pct = calcCompletion(doc);
      if (pct !== doc.completionPct) { clientHandovers.update(doc.id, { completionPct: pct }); return { ...doc, completionPct: pct }; }
      return doc;
    });
    setClientDocs(updated);
    setCurrentUser(auth.current());
  }, [id, router]);

  useEffect(() => { reload(); }, [reload]);

  const handleStatusChange = (status: HandoverStatus) => {
    handovers.update(id, { status });
    reload();
  };

  const handleApprove = () => {
    if (!currentUser) return;
    handovers.update(id, {
      status: 'PM_APPROVED',
      pmApproval: { approved: true, approvedById: currentUser.id, approvedAt: new Date().toISOString(), notes: approvalNotes }
    });
    reload();
  };

  const handleMarkComplete = () => {
    if (!handover?.pmApproval.approved) return;
    handovers.update(id, { status: 'COMPLETE' });
    reload();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !handover) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const entryId = Date.now().toString();
      const newEntry = { id: entryId, fileName: file.name, uploadedAt: new Date().toISOString(), processed: false, summary: '' };
      const updated = handovers.update(id, { firefliesTranscripts: [...(handover.firefliesTranscripts || []), newEntry] });
      if (updated) setHandover(updated);
      setUploading(false);
      setAiProcessing(entryId);

      try {
        const clientNames = clientDocs.map(h => ({ id: h.id, clientId: h.clientId, name: clientMap[h.clientId] || h.clientId }));
        const prompt = `You are analysing a handover call transcript from a digital agency. The team member handles these clients: ${clientNames.map(c => c.name).join(', ')}.

Transcript:
---
${text.substring(0, 8000)}
---

Extract all useful handover information. Respond ONLY with JSON:
{
  "clientMatches": [{
    "clientName": "exact client name",
    "handoverId": "the handover id",
    "extractedData": {
      "hubspot": { "portalId": "", "activeHubs": [], "keyWorkflows": "", "pipelineNames": "", "crmNotes": "" },
      "techStack": { "siteType": "", "siteUrl": "", "stagingUrl": "", "adminUrl": "", "repoUrl": "", "hostingProvider": "", "deploymentProcess": "", "plugins": "", "techNotes": "" },
      "integrations": [{"name": "", "type": "", "purpose": "", "accessMethod": "", "credentialsLocation": "", "notes": ""}],
      "accessDetails": [{"tool": "", "url": "", "username": "", "credentialsLocation": "", "twoFactorInfo": "", "accessLevel": "", "notes": ""}],
      "contacts": [{"name": "", "role": "", "email": "", "phone": "", "notes": ""}],
      "ongoingWork": { "activeProjects": "", "openIssues": "", "pendingTasks": "", "criticalDeadlines": "", "doNotTouch": "", "clientExpectations": "", "weeklyTasks": "" },
      "roleSpecific": { "pmTool": "", "pmUrl": "", "meetingCadence": "", "figmaUrl": "", "integrationArchitecture": "", "dataFlowNotes": "" }
    }
  }],
  "summary": "2-3 sentence summary of key handover points"
}

Only include fields with actual data found. handoverId mapping: ${JSON.stringify(clientNames.map(c => ({ name: c.name, handoverId: c.id })))}`;

        const resp = await fetch('/api/ai-process', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });

        if (resp.ok) {
          const result = await resp.json();
          if (result.data?.clientMatches) {
            for (const match of result.data.clientMatches) {
              const doc = clientDocs.find(x => x.id === match.handoverId);
              if (doc && match.extractedData) {
                const ed = match.extractedData;
                const upd: Partial<ClientHandover> = {};
                if (ed.hubspot) { upd.hubspot = { ...doc.hubspot }; Object.entries(ed.hubspot).forEach(([k, v]) => { if (v) (upd.hubspot as unknown as Record<string, unknown>)[k] = v; }); }
                if (ed.techStack) { upd.techStack = { ...doc.techStack }; Object.entries(ed.techStack).forEach(([k, v]) => { if (v) (upd.techStack as unknown as Record<string, unknown>)[k] = v; }); }
                if (ed.integrations?.length) upd.integrations = [...doc.integrations, ...ed.integrations.filter((i: {name?: string}) => i.name).map((i: Record<string, string>) => ({ ...i, id: Date.now().toString() + Math.random() }))];
                if (ed.accessDetails?.length) upd.accessDetails = [...doc.accessDetails, ...ed.accessDetails.filter((a: {tool?: string}) => a.tool).map((a: Record<string, string>) => ({ ...a, id: Date.now().toString() + Math.random() }))];
                if (ed.contacts?.length) upd.contacts = [...doc.contacts, ...ed.contacts.filter((c: {name?: string}) => c.name).map((c: Record<string, string>) => ({ ...c, id: Date.now().toString() + Math.random() }))];
                if (ed.ongoingWork) { upd.ongoingWork = { ...doc.ongoingWork }; Object.entries(ed.ongoingWork).forEach(([k, v]) => { if (v) (upd.ongoingWork as unknown as Record<string, unknown>)[k] = v; }); }
                if (ed.roleSpecific) { upd.roleSpecific = { ...doc.roleSpecific }; Object.entries(ed.roleSpecific).forEach(([k, v]) => { if (v) (upd.roleSpecific as unknown as Record<string, unknown>)[k] = v; }); }
                clientHandovers.update(doc.id, upd);
              }
            }
          }
          const current = handovers.get(id);
          if (current) {
            handovers.update(id, {
              firefliesTranscripts: current.firefliesTranscripts.map(t =>
                t.id === entryId ? { ...t, processed: true, summary: result.data?.summary || 'Processed' } : t
              )
            });
          }
        }
      } catch (err) { console.error('AI processing failed:', err); }
      setAiProcessing(null);
      reload();
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const generateSummaryHTML = () => {
    if (!handover) return '';
    const approver = handover.pmApproval.approvedById ? members.get(handover.pmApproval.approvedById) : null;
    const coverM = handover.coverPersonId ? members.get(handover.coverPersonId) : null;

    const clientSections = clientDocs.map(doc => {
      const cName = clientMap[doc.clientId] || 'Unknown';
      const cIndustry = clientIndustryMap[doc.clientId] || '';
      return `
        <div class="client-section">
          <h2>${cName} <span class="industry">${cIndustry}</span></h2>
          
          ${doc.hubspot.portalId ? `<div class="section">
            <h3>🟠 HubSpot Setup</h3>
            <table>
              ${doc.hubspot.portalId ? `<tr><td>Portal ID</td><td>${doc.hubspot.portalId}</td></tr>` : ''}
              ${doc.hubspot.portalUrl ? `<tr><td>Portal URL</td><td><a href="${doc.hubspot.portalUrl}">${doc.hubspot.portalUrl}</a></td></tr>` : ''}
              ${doc.hubspot.tier ? `<tr><td>Plan / Tier</td><td>${doc.hubspot.tier}</td></tr>` : ''}
              ${doc.hubspot.activeHubs.length ? `<tr><td>Active Hubs</td><td>${doc.hubspot.activeHubs.join(', ')}</td></tr>` : ''}
              ${doc.hubspot.pipelineNames ? `<tr><td>Pipelines</td><td>${doc.hubspot.pipelineNames}</td></tr>` : ''}
              ${doc.hubspot.keyWorkflows ? `<tr><td>Key Workflows</td><td>${doc.hubspot.keyWorkflows}</td></tr>` : ''}
              ${doc.hubspot.formsLandingPages ? `<tr><td>Forms & Pages</td><td>${doc.hubspot.formsLandingPages}</td></tr>` : ''}
              ${doc.hubspot.emailTemplates ? `<tr><td>Email Templates</td><td>${doc.hubspot.emailTemplates}</td></tr>` : ''}
              ${doc.hubspot.crmNotes ? `<tr><td>CRM Notes</td><td>${doc.hubspot.crmNotes}</td></tr>` : ''}
            </table>
          </div>` : ''}

          ${doc.techStack.siteUrl ? `<div class="section">
            <h3>💻 Tech Stack</h3>
            <table>
              <tr><td>Platform</td><td>${doc.techStack.siteType}</td></tr>
              ${doc.techStack.siteUrl ? `<tr><td>Live URL</td><td><a href="${doc.techStack.siteUrl}">${doc.techStack.siteUrl}</a></td></tr>` : ''}
              ${doc.techStack.stagingUrl ? `<tr><td>Staging URL</td><td><a href="${doc.techStack.stagingUrl}">${doc.techStack.stagingUrl}</a></td></tr>` : ''}
              ${doc.techStack.adminUrl ? `<tr><td>Admin / CMS URL</td><td><a href="${doc.techStack.adminUrl}">${doc.techStack.adminUrl}</a></td></tr>` : ''}
              ${doc.techStack.repoUrl ? `<tr><td>Repository</td><td><a href="${doc.techStack.repoUrl}">${doc.techStack.repoUrl}</a></td></tr>` : ''}
              ${doc.techStack.repoBranch ? `<tr><td>Main Branch</td><td>${doc.techStack.repoBranch}</td></tr>` : ''}
              ${doc.techStack.hostingProvider ? `<tr><td>Hosting</td><td>${doc.techStack.hostingProvider}</td></tr>` : ''}
              ${doc.techStack.themeFramework ? `<tr><td>Theme / Framework</td><td>${doc.techStack.themeFramework}</td></tr>` : ''}
              ${doc.techStack.plugins ? `<tr><td>Key Plugins</td><td>${doc.techStack.plugins}</td></tr>` : ''}
              ${doc.techStack.deploymentProcess ? `<tr><td>Deployment</td><td>${doc.techStack.deploymentProcess}</td></tr>` : ''}
              ${doc.techStack.techNotes ? `<tr><td>Tech Notes</td><td>${doc.techStack.techNotes}</td></tr>` : ''}
            </table>
          </div>` : ''}

          ${doc.integrations.length ? `<div class="section">
            <h3>🔌 Integrations</h3>
            ${doc.integrations.map(int => `
              <div class="sub-card">
                <strong>${int.name}</strong> <span class="tag">${int.type}</span><br/>
                ${int.purpose ? `<div class="label">Purpose:</div> ${int.purpose}<br/>` : ''}
                ${int.accessMethod ? `<div class="label">Access:</div> ${int.accessMethod}<br/>` : ''}
                ${int.credentialsLocation ? `<div class="label">Credentials:</div> ${int.credentialsLocation}<br/>` : ''}
                ${int.notes ? `<div class="label">Notes:</div> ${int.notes}` : ''}
              </div>`).join('')}
          </div>` : ''}

          ${doc.accessDetails.length ? `<div class="section">
            <h3>🔐 Access Details</h3>
            ${doc.accessDetails.map(acc => `
              <div class="sub-card">
                <strong>${acc.tool}</strong> <span class="tag">${acc.accessLevel}</span><br/>
                ${acc.url ? `<div class="label">URL:</div> <a href="${acc.url}">${acc.url}</a><br/>` : ''}
                ${acc.username ? `<div class="label">Username:</div> ${acc.username}<br/>` : ''}
                ${acc.credentialsLocation ? `<div class="label">Credentials:</div> ${acc.credentialsLocation}<br/>` : ''}
                ${acc.twoFactorInfo ? `<div class="label">2FA:</div> ${acc.twoFactorInfo}<br/>` : ''}
                ${acc.notes ? `<div class="label">Notes:</div> ${acc.notes}` : ''}
              </div>`).join('')}
          </div>` : ''}

          ${doc.contacts.length ? `<div class="section">
            <h3>👥 Key Contacts</h3>
            ${doc.contacts.map(ct => `
              <div class="sub-card">
                <strong>${ct.name}</strong> — ${ct.role}<br/>
                ${ct.email ? `📧 ${ct.email}<br/>` : ''}
                ${ct.phone ? `📞 ${ct.phone}<br/>` : ''}
                ${ct.notes ? `<div class="label">Notes:</div> ${ct.notes}` : ''}
              </div>`).join('')}
          </div>` : ''}

          ${doc.ongoingWork.activeProjects || doc.ongoingWork.pendingTasks ? `<div class="section">
            <h3>⚡ Ongoing Work</h3>
            <table>
              ${doc.ongoingWork.activeProjects ? `<tr><td>Active Projects</td><td>${doc.ongoingWork.activeProjects}</td></tr>` : ''}
              ${doc.ongoingWork.pendingTasks ? `<tr><td>Pending Tasks</td><td>${doc.ongoingWork.pendingTasks}</td></tr>` : ''}
              ${doc.ongoingWork.openIssues ? `<tr><td>Open Issues</td><td>${doc.ongoingWork.openIssues}</td></tr>` : ''}
              ${doc.ongoingWork.criticalDeadlines ? `<tr><td>Critical Deadlines</td><td>${doc.ongoingWork.criticalDeadlines}</td></tr>` : ''}
              ${doc.ongoingWork.weeklyTasks ? `<tr><td>Weekly Tasks</td><td>${doc.ongoingWork.weeklyTasks}</td></tr>` : ''}
              ${doc.ongoingWork.clientExpectations ? `<tr><td>Client Expectations</td><td>${doc.ongoingWork.clientExpectations}</td></tr>` : ''}
              ${doc.ongoingWork.doNotTouch ? `<tr class="warn"><td>⚠️ DO NOT TOUCH</td><td>${doc.ongoingWork.doNotTouch}</td></tr>` : ''}
            </table>
          </div>` : ''}

          ${doc.documents.length ? `<div class="section">
            <h3>📎 Documents & Links</h3>
            <ul>${doc.documents.map(d => `<li>${d.name}${d.url ? ` — <a href="${d.url}">${d.url}</a>` : ''}${d.notes ? ` (${d.notes})` : ''}</li>`).join('')}</ul>
          </div>` : ''}
        </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Handover Summary — ${member}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 40px 32px; font-size: 14px; line-height: 1.6; }
  .header { background: #4f46e5; color: white; border-radius: 12px; padding: 32px; margin-bottom: 32px; }
  .header h1 { margin: 0 0 4px; font-size: 24px; }
  .header .sub { opacity: 0.8; font-size: 14px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 20px; }
  .meta-item { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px; }
  .meta-item .label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta-item .value { font-weight: 600; margin-top: 2px; }
  .approval-banner { background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; color: #166534; }
  .client-section { margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .client-section h2 { background: #f8fafc; padding: 16px 20px; margin: 0; font-size: 16px; border-bottom: 1px solid #e2e8f0; }
  .industry { font-size: 12px; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 20px; margin-left: 8px; font-weight: normal; }
  .section { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
  .section:last-child { border-bottom: none; }
  .section h3 { margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  td:first-child { width: 180px; font-weight: 600; color: #475569; white-space: nowrap; }
  tr.warn td { background: #fef9c3; }
  tr.warn td:first-child { color: #b45309; }
  .sub-card { background: #f8fafc; border-radius: 8px; padding: 12px; margin-bottom: 8px; border: 1px solid #e2e8f0; }
  .tag { background: #e0e7ff; color: #3730a3; font-size: 11px; padding: 2px 6px; border-radius: 4px; }
  .label { font-weight: 600; color: #64748b; display: inline; }
  ul { margin: 0; padding-left: 20px; }
  li { margin-bottom: 4px; }
  a { color: #4f46e5; }
  .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <h1>Handover Summary</h1>
  <div class="sub">${HANDOVER_TYPE_LABELS[handover.type]} · Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  <div class="meta">
    <div class="meta-item"><div class="label">Team Member</div><div class="value">${member}</div></div>
    <div class="meta-item"><div class="label">Role</div><div class="value">${memberRole}</div></div>
    <div class="meta-item"><div class="label">Last Day</div><div class="value">${handover.startDate ? formatDate(handover.startDate) : '—'}</div></div>
    ${coverPerson ? `<div class="meta-item"><div class="label">Cover Person</div><div class="value">${coverPerson}</div></div>` : ''}
    <div class="meta-item"><div class="label">Clients Documented</div><div class="value">${clientDocs.length}</div></div>
    <div class="meta-item"><div class="label">Status</div><div class="value">${STATUS_LABELS[handover.status]}</div></div>
  </div>
</div>

${handover.pmApproval.approved ? `<div class="approval-banner">✅ Approved by ${approver?.name || 'PM'} on ${formatDate(handover.pmApproval.approvedAt || '')}${handover.pmApproval.notes ? ` — "${handover.pmApproval.notes}"` : ''}</div>` : ''}

${handover.notes ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:24px;"><strong>Context:</strong> ${handover.notes}</div>` : ''}

${clientSections}

<div class="footer">Handover Hub · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body>
</html>`;
  };

  const downloadSummary = () => {
    const html = generateSummaryHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handover-${member.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!handover) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const overallCompletion = clientDocs.length > 0
    ? Math.round(clientDocs.reduce((s, h) => s + h.completionPct, 0) / clientDocs.length)
    : 0;

  const isPM = currentUser?.role === 'PM' || currentUser?.role === 'ADMIN';
  const isApproved = handover.pmApproval.approved;

  return (
    <div>
      <TopBar title="Handover" subtitle={`${member} — ${HANDOVER_TYPE_LABELS[handover.type]}`} />
      <div className="p-6 max-w-4xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> All Handovers
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{member}</h2>
                <span className="text-gray-300">·</span>
                <span className="text-gray-600 text-sm">{memberRole}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[handover.type]}`}>{HANDOVER_TYPE_LABELS[handover.type]}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[handover.status]}`}>{STATUS_LABELS[handover.status]}</span>
                {isApproved && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PM Approved</span>}
                {handover.startDate && <span className="text-sm text-gray-500">Last day: <strong>{formatDate(handover.startDate)}</strong></span>}
                {handover.endDate && <span className="text-sm text-gray-500">Returns: <strong>{formatDate(handover.endDate)}</strong></span>}
                {coverPerson && <span className="text-sm text-gray-500">Cover: <strong>{coverPerson}</strong></span>}
              </div>
              {handover.notes && <p className="text-sm text-gray-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 mt-2">{handover.notes}</p>}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{overallCompletion}%</div>
              <p className="text-xs text-gray-400">documented</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${overallCompletion}%` }} />
            </div>
          </div>
          {/* Status controls */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500 mr-1">Status:</span>
            {(['DRAFT', 'IN_REVIEW'] as HandoverStatus[]).map(s => (
              <button key={s} onClick={() => handleStatusChange(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${handover.status === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-indigo-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {STATUS_LABELS[s]}
              </button>
            ))}
            {isApproved && !['COMPLETE'].includes(handover.status) && (
              <button onClick={handleMarkComplete} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
                Mark Complete
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 bg-gray-100 p-1 rounded-xl mb-5">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
              {i === 0 && <span className="ml-1 text-xs text-indigo-500">({clientDocs.length})</span>}
              {i === 1 && isApproved && <span className="ml-1">✅</span>}
            </button>
          ))}
        </div>

        {/* Tab: Clients */}
        {activeTab === 0 && (
          <div className="space-y-3">
            {clientDocs.map(doc => {
              const pct = doc.completionPct;
              const icon = pct >= 80 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                pct >= 40 ? <Clock className="w-5 h-5 text-yellow-500" /> :
                <AlertCircle className="w-5 h-5 text-red-400" />;
              return (
                <Link key={doc.id} href={`/handovers/${id}/client/${doc.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <p className="font-semibold text-gray-900">{clientMap[doc.clientId] || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{clientIndustryMap[doc.clientId]}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-32 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-xs text-gray-400">{doc.integrations.length} integrations · {doc.accessDetails.length} access · {doc.contacts.length} contacts · {doc.documents.length} docs</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Tab: Approval */}
        {activeTab === 1 && (
          <div className="space-y-4">
            {isApproved ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
                <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800 text-lg">Handover Approved</p>
                  <p className="text-green-700 text-sm mt-1">
                    Approved by <strong>{members.get(handover.pmApproval.approvedById || '')?.name || 'PM'}</strong> on {formatDate(handover.pmApproval.approvedAt || '')}
                  </p>
                  {handover.pmApproval.notes && <p className="text-green-600 text-sm mt-2 italic">"{handover.pmApproval.notes}"</p>}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="w-6 h-6 text-indigo-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">PM Approval Required</h3>
                    <p className="text-sm text-gray-500">The handover must be reviewed and approved by a Project Manager before it&apos;s considered complete.</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Checklist before approving</p>
                  <div className="space-y-2">
                    {[
                      { label: 'All client documentation filled in', done: overallCompletion >= 80 },
                      { label: 'HubSpot portal IDs documented', done: clientDocs.every(d => d.hubspot.portalId.trim()) },
                      { label: 'Access details with credentials locations', done: clientDocs.every(d => d.accessDetails.length > 0) },
                      { label: 'Key contacts documented', done: clientDocs.every(d => d.contacts.length > 0) },
                      { label: 'Ongoing work & open tasks captured', done: clientDocs.every(d => d.ongoingWork.activeProjects.trim()) },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-500' : 'bg-gray-200'}`}>
                          {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className={done ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isPM ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                      <textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Any notes or conditions for approval…" />
                    </div>
                    <button onClick={handleApprove}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors">
                      <ShieldCheck className="w-5 h-5" /> Approve this Handover
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-700">
                    Only a Project Manager can approve this handover. Please ask your PM to review and approve.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Transcript (AI) */}
        {activeTab === 2 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Transcript Processing</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Upload a Fireflies or any handover call transcript (.txt) — AI reads it and auto-fills documentation across all clients</p>
                  </div>
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading || aiProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Reading…' : 'Upload Transcript'}
                  <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md" onChange={handleFileUpload} className="hidden" disabled={!!uploading || !!aiProcessing} />
                </label>
              </div>

              {handover.firefliesTranscripts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
                  <p className="text-sm">No transcripts uploaded yet</p>
                  <p className="text-xs mt-1">Upload your Fireflies call transcript to auto-fill client documentation</p>
                </div>
              ) : (
                <div className="space-y-2 mt-3">
                  {handover.firefliesTranscripts.map(t => (
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

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">To enable AI processing</p>
              <p className="text-xs text-blue-600">Add <code className="bg-blue-100 px-1 rounded">ANTHROPIC_API_KEY</code> in Vercel → Project Settings → Environment Variables</p>
            </div>
          </div>
        )}

        {/* Tab: Summary */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Handover Summary Document</h3>
                    <p className="text-sm text-gray-500 mt-0.5">A complete, printable summary of this entire handover — all clients, all documentation in one file</p>
                  </div>
                </div>
                <button onClick={downloadSummary}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                  <Download className="w-4 h-4" /> Download Summary
                </button>
              </div>

              {/* Preview cards */}
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Summary includes</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {[
                      `${member} — ${memberRole}`,
                      `${HANDOVER_TYPE_LABELS[handover.type]} · ${handover.startDate ? formatDate(handover.startDate) : ''}`,
                      `${clientDocs.length} client${clientDocs.length !== 1 ? 's' : ''} documented`,
                      `${clientDocs.reduce((s, d) => s + d.integrations.length, 0)} integrations`,
                      `${clientDocs.reduce((s, d) => s + d.accessDetails.length, 0)} access details`,
                      `${clientDocs.reduce((s, d) => s + d.contacts.length, 0)} key contacts`,
                      `${clientDocs.reduce((s, d) => s + d.documents.length, 0)} documents & links`,
                      isApproved ? '✅ PM Approved' : '⏳ Pending approval',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {clientDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{clientMap[doc.clientId]}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${doc.completionPct >= 80 ? 'bg-green-500' : doc.completionPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${doc.completionPct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400">{doc.completionPct}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-4">The downloaded file is an HTML file — open in browser and use Ctrl+P / Cmd+P to print or save as PDF</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
