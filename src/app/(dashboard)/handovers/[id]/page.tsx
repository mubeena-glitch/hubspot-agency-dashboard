'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { packages, members, clients, clientHandovers, auth,
  type HandoverPackage, type ClientHandover } from '@/lib/storage';
import { formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, TYPE_COLORS,
  ROLE_LABELS, calcCompletion } from '@/lib/utils';
import { ArrowLeft, Upload, Sparkles, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileText, Loader2, ThumbsUp, Download, UserCheck,
  ClipboardList, MessageSquare } from 'lucide-react';

const STAGES = [
  { id: 1, key: 'docs', label: 'Client Documentation', icon: ClipboardList, desc: 'Fill in all client details' },
  { id: 2, key: 'transcript', label: 'Upload Transcript', icon: Sparkles, desc: 'AI extracts missing details' },
  { id: 3, key: 'approval', label: 'PM Approval', icon: UserCheck, desc: 'PM reviews and approves' },
  { id: 4, key: 'summary', label: 'Final Summary', icon: Download, desc: 'Download handover document' },
];

export default function HandoverPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<HandoverPackage | null>(null);
  const [handovers, setHandovers] = useState<ClientHandover[]>([]);
  const [member, setMember] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [coverPerson, setCoverPerson] = useState('');
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [activeStage, setActiveStage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.current());
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
    setCurrentUser(auth.current());
  };

  useEffect(() => { reload(); }, [id]);

  const overallCompletion = handovers.length > 0
    ? Math.round(handovers.reduce((s, h) => s + h.completionPct, 0) / handovers.length)
    : 0;

  const handleSubmitForApproval = () => {
    packages.update(id, { status: 'PENDING_APPROVAL' });
    reload();
    setActiveStage(3);
  };

  const handleApprove = () => {
    if (!currentUser) return;
    packages.update(id, {
      status: 'APPROVED',
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
      approvalNotes: approvalNotes,
    });
    reload();
    setActiveStage(4);
  };

  const handleRequestChanges = () => {
    packages.update(id, { status: 'IN_REVIEW', approvalNotes: approvalNotes });
    reload();
    setActiveStage(1);
  };

  const handleMarkComplete = () => {
    packages.update(id, { status: 'COMPLETE' });
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
        id: entryId, fileName: file.name,
        uploadedAt: new Date().toISOString(), processed: false, summary: '',
      };

      const updated = packages.update(id, {
        firefliesTranscripts: [...(pkg.firefliesTranscripts || []), newEntry]
      });
      if (updated) setPkg(updated);
      setUploading(false);
      setAiProcessing(entryId);

      try {
        const clientNames = handovers.map(h => ({ id: h.id, clientId: h.clientId, name: clientMap[h.clientId] || h.clientId }));
        const prompt = `You are analysing a handover call transcript from a digital agency. Clients: ${clientNames.map(c => c.name).join(', ')}.

Transcript:
---
${text.substring(0, 8000)}
---

Extract all handover info. Respond ONLY with JSON:
{
  "clientMatches": [{"clientName":"","handoverId":"","extractedData":{"hubspot":{"portalId":"","activeHubs":[],"keyWorkflows":"","pipelineNames":"","crmNotes":""},"techStack":{"siteType":"","siteUrl":"","stagingUrl":"","adminUrl":"","repoUrl":"","hostingProvider":"","deploymentProcess":"","plugins":"","techNotes":""},"integrations":[{"name":"","type":"","purpose":"","accessMethod":"","credentialsLocation":"","notes":""}],"accessDetails":[{"tool":"","url":"","username":"","credentialsLocation":"","twoFactorInfo":"","accessLevel":"","notes":""}],"contacts":[{"name":"","role":"","email":"","phone":"","notes":""}],"ongoingWork":{"activeProjects":"","openIssues":"","pendingTasks":"","criticalDeadlines":"","doNotTouch":"","clientExpectations":"","weeklyTasks":""},"roleSpecific":{"pmTool":"","pmUrl":"","meetingCadence":"","figmaUrl":"","brandGuidelinesUrl":"","integrationArchitecture":"","dataFlowNotes":""}}}],
  "summary":"2-3 sentence summary"
}
HandoverId mapping: ${JSON.stringify(clientNames.map(c => ({ name: c.name, handoverId: c.id })))}`;

        const resp = await fetch('/api/ai-process', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
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
                if (ed.hubspot) { updates.hubspot = { ...h.hubspot }; Object.entries(ed.hubspot).forEach(([k, v]) => { if (v && k in updates.hubspot!) (updates.hubspot as unknown as Record<string, unknown>)[k] = v; }); }
                if (ed.techStack) { updates.techStack = { ...h.techStack }; Object.entries(ed.techStack).forEach(([k, v]) => { if (v && k in updates.techStack!) (updates.techStack as unknown as Record<string, unknown>)[k] = v; }); }
                if (ed.integrations?.length) updates.integrations = [...h.integrations, ...ed.integrations.filter((i: { name?: string }) => i.name).map((i: Record<string, string>) => ({ ...i, id: Date.now().toString() + Math.random() }))];
                if (ed.accessDetails?.length) updates.accessDetails = [...h.accessDetails, ...ed.accessDetails.filter((a: { tool?: string }) => a.tool).map((a: Record<string, string>) => ({ ...a, id: Date.now().toString() + Math.random() }))];
                if (ed.contacts?.length) updates.contacts = [...h.contacts, ...ed.contacts.filter((c: { name?: string }) => c.name).map((c: Record<string, string>) => ({ ...c, id: Date.now().toString() + Math.random() }))];
                if (ed.ongoingWork) { updates.ongoingWork = { ...h.ongoingWork }; Object.entries(ed.ongoingWork).forEach(([k, v]) => { if (v && k in updates.ongoingWork!) (updates.ongoingWork as unknown as Record<string, unknown>)[k] = v; }); }
                if (ed.roleSpecific) { updates.roleSpecific = { ...h.roleSpecific }; Object.entries(ed.roleSpecific).forEach(([k, v]) => { if (v && k in updates.roleSpecific!) (updates.roleSpecific as unknown as Record<string, unknown>)[k] = v; }); }
                clientHandovers.update(h.id, updates);
              }
            }
          }
          const current = packages.get(id);
          if (current) packages.update(id, { firefliesTranscripts: current.firefliesTranscripts.map(t => t.id === entryId ? { ...t, processed: true, summary: result.data?.summary || 'Processed' } : t) });
        }
      } catch (err) {
        console.error('AI failed:', err);
        const current = packages.get(id);
        if (current) packages.update(id, { firefliesTranscripts: current.firefliesTranscripts.map(t => t.id === entryId ? { ...t, processed: true, summary: 'Processing failed — review manually' } : t) });
      }
      setAiProcessing(null);
      reload();
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const generateSummaryHTML = () => {
    if (!pkg) return '';
    const approver = pkg.approvedBy ? members.get(pkg.approvedBy) : null;
    const coverM = pkg.coverPersonId ? members.get(pkg.coverPersonId) : null;

    const clientSections = handovers.map(h => {
      const cName = clientMap[h.clientId] || 'Unknown';
      const integrationRows = h.integrations.map(i => `<tr><td>${i.name}</td><td>${i.type}</td><td>${i.purpose}</td><td>${i.credentialsLocation}</td></tr>`).join('');
      const accessRows = h.accessDetails.map(a => `<tr><td>${a.tool}</td><td>${a.url}</td><td>${a.username}</td><td>${a.credentialsLocation}</td><td>${a.twoFactorInfo}</td></tr>`).join('');
      const contactRows = h.contacts.map(c => `<tr><td>${c.name}</td><td>${c.role}</td><td>${c.email}</td><td>${c.phone}</td></tr>`).join('');
      const docRows = h.documents.map(d => `<tr><td>${d.name}</td><td>${d.type}</td><td>${d.type === 'link' ? `<a href="${d.url}">${d.url}</a>` : 'Uploaded file'}</td><td>${d.notes}</td></tr>`).join('');
      const hubsUsed = h.hubspot.activeHubs.join(', ') || '—';

      return `
      <div class="client-section">
        <h2>${cName}</h2>
        <div class="completion-bar"><div class="completion-fill" style="width:${h.completionPct}%"></div></div>
        <p class="completion-label">Documentation: ${h.completionPct}% complete</p>

        <h3>HubSpot Setup</h3>
        <table><tr><th>Portal ID</th><td>${h.hubspot.portalId || '—'}</td><th>Portal URL</th><td>${h.hubspot.portalUrl || '—'}</td></tr>
        <tr><th>Active Hubs</th><td>${hubsUsed}</td><th>Tier / Plan</th><td>${h.hubspot.tier || '—'}</td></tr></table>
        ${h.hubspot.pipelineNames ? `<p><strong>Pipelines:</strong> ${h.hubspot.pipelineNames}</p>` : ''}
        ${h.hubspot.keyWorkflows ? `<p><strong>Key Workflows:</strong> ${h.hubspot.keyWorkflows}</p>` : ''}
        ${h.hubspot.crmNotes ? `<div class="warning-box"><strong>⚠️ CRM Notes:</strong> ${h.hubspot.crmNotes}</div>` : ''}

        <h3>Tech Stack</h3>
        <table>
          <tr><th>Site Type</th><td>${h.techStack.siteType}</td><th>Live URL</th><td><a href="${h.techStack.siteUrl}">${h.techStack.siteUrl || '—'}</a></td></tr>
          <tr><th>Staging URL</th><td><a href="${h.techStack.stagingUrl}">${h.techStack.stagingUrl || '—'}</a></td><th>Admin URL</th><td><a href="${h.techStack.adminUrl}">${h.techStack.adminUrl || '—'}</a></td></tr>
          <tr><th>Repository</th><td><a href="${h.techStack.repoUrl}">${h.techStack.repoUrl || '—'}</a></td><th>Branch</th><td>${h.techStack.repoBranch || '—'}</td></tr>
          <tr><th>Hosting</th><td>${h.techStack.hostingProvider || '—'}</td><th>PHP Version</th><td>${h.techStack.phpVersion || '—'}</td></tr>
        </table>
        ${h.techStack.deploymentProcess ? `<p><strong>Deployment:</strong> ${h.techStack.deploymentProcess}</p>` : ''}
        ${h.techStack.plugins ? `<p><strong>Key Plugins:</strong> ${h.techStack.plugins}</p>` : ''}
        ${h.techStack.techNotes ? `<div class="warning-box"><strong>⚠️ Tech Notes:</strong> ${h.techStack.techNotes}</div>` : ''}

        ${h.integrations.length > 0 ? `
        <h3>Integrations (${h.integrations.length})</h3>
        <table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Credentials Location</th></tr></thead><tbody>${integrationRows}</tbody></table>` : ''}

        ${h.accessDetails.length > 0 ? `
        <h3>Access Details (${h.accessDetails.length})</h3>
        <table><thead><tr><th>Tool</th><th>URL</th><th>Username</th><th>Credentials Location</th><th>2FA Info</th></tr></thead><tbody>${accessRows}</tbody></table>` : ''}

        ${h.contacts.length > 0 ? `
        <h3>Key Contacts (${h.contacts.length})</h3>
        <table><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Phone</th></tr></thead><tbody>${contactRows}</tbody></table>` : ''}

        ${h.documents.length > 0 ? `
        <h3>Documents & Links (${h.documents.length})</h3>
        <table><thead><tr><th>Name</th><th>Type</th><th>URL/File</th><th>Notes</th></tr></thead><tbody>${docRows}</tbody></table>` : ''}

        <h3>Ongoing Work</h3>
        ${h.ongoingWork.activeProjects ? `<p><strong>Active Projects:</strong><br>${h.ongoingWork.activeProjects}</p>` : ''}
        ${h.ongoingWork.pendingTasks ? `<p><strong>Pending Tasks:</strong><br>${h.ongoingWork.pendingTasks}</p>` : ''}
        ${h.ongoingWork.openIssues ? `<p><strong>Open Issues:</strong><br>${h.ongoingWork.openIssues}</p>` : ''}
        ${h.ongoingWork.criticalDeadlines ? `<p><strong>Critical Deadlines:</strong><br>${h.ongoingWork.criticalDeadlines}</p>` : ''}
        ${h.ongoingWork.weeklyTasks ? `<p><strong>Weekly Tasks:</strong><br>${h.ongoingWork.weeklyTasks}</p>` : ''}
        ${h.ongoingWork.clientExpectations ? `<p><strong>Client Expectations:</strong><br>${h.ongoingWork.clientExpectations}</p>` : ''}
        ${h.ongoingWork.doNotTouch ? `<div class="danger-box"><strong>🚫 DO NOT TOUCH:</strong><br>${h.ongoingWork.doNotTouch}</div>` : ''}
      </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Handover Summary — ${member}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 1000px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 32px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 28px; margin-bottom: 4px; }
  .header p { opacity: 0.85; font-size: 14px; }
  .meta-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 32px; }
  .meta-card { background: #f8faff; border: 1px solid #e0e7ff; border-radius: 8px; padding: 16px; }
  .meta-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 4px; }
  .meta-card .value { font-size: 15px; font-weight: 600; color: #1f2937; }
  .approval-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 32px; }
  .approval-box h3 { color: #166534; margin-bottom: 8px; }
  .client-section { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 24px; page-break-inside: avoid; }
  .client-section h2 { font-size: 20px; color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; margin-bottom: 16px; }
  .client-section h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 16px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
  th { background: #f9fafb; padding: 8px 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; }
  td { padding: 8px 10px; border: 1px solid #e5e7eb; color: #374151; word-break: break-word; }
  td a { color: #4f46e5; text-decoration: none; }
  p { margin: 6px 0; font-size: 14px; line-height: 1.6; color: #374151; }
  .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 0 6px 6px 0; margin: 8px 0; font-size: 13px; }
  .danger-box { background: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px; border-radius: 0 6px 6px 0; margin: 8px 0; font-size: 13px; }
  .completion-bar { background: #e5e7eb; border-radius: 999px; height: 6px; margin: 6px 0 2px; }
  .completion-fill { background: #4f46e5; height: 6px; border-radius: 999px; }
  .completion-label { font-size: 11px; color: #9ca3af; margin-bottom: 12px; }
  .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  @media print { body { padding: 20px; } .client-section { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Handover Summary — ${member}</h1>
    <p>${HANDOVER_TYPE_LABELS[pkg?.type || 'OTHER']} · Generated on ${formatDate(new Date().toISOString())}</p>
  </div>

  <div class="meta-grid">
    <div class="meta-card"><div class="label">Team Member</div><div class="value">${member}</div></div>
    <div class="meta-card"><div class="label">Role</div><div class="value">${memberRole}</div></div>
    <div class="meta-card"><div class="label">Reason</div><div class="value">${HANDOVER_TYPE_LABELS[pkg?.type || 'OTHER']}</div></div>
    <div class="meta-card"><div class="label">Last Day</div><div class="value">${pkg?.startDate ? formatDate(pkg.startDate) : '—'}</div></div>
    ${pkg?.endDate ? `<div class="meta-card"><div class="label">Return Date</div><div class="value">${formatDate(pkg.endDate)}</div></div>` : ''}
    ${coverM ? `<div class="meta-card"><div class="label">Cover Person</div><div class="value">${coverM.name}</div></div>` : ''}
    <div class="meta-card"><div class="label">Clients Documented</div><div class="value">${handovers.length}</div></div>
    <div class="meta-card"><div class="label">Overall Completion</div><div class="value">${overallCompletion}%</div></div>
  </div>

  ${pkg?.notes ? `<div class="warning-box" style="margin-bottom:24px"><strong>Notes:</strong> ${pkg.notes}</div>` : ''}

  ${approver ? `
  <div class="approval-box">
    <h3>✅ Approved by ${approver.name} (${ROLE_LABELS[approver.role]})</h3>
    <p>Approved on: ${pkg?.approvedAt ? formatDate(pkg.approvedAt) : '—'}</p>
    ${pkg?.approvalNotes ? `<p>Notes: ${pkg.approvalNotes}</p>` : ''}
  </div>` : ''}

  <h2 style="font-size:18px;margin-bottom:16px;color:#374151;">Client Documentation</h2>
  ${clientSections}

  <div class="footer">
    <p>Handover Hub · Generated ${new Date().toLocaleString()} · Confidential — for internal use only</p>
  </div>
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

  if (!pkg) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const isPM = currentUser?.role === 'PM' || currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM_LEAD';

  return (
    <div>
      <TopBar title={`${member}'s Handover`} subtitle={`${HANDOVER_TYPE_LABELS[pkg.type]} · ${memberRole}`} />
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
                <span className="text-gray-500 text-sm">{memberRole}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[pkg.type]}`}>{HANDOVER_TYPE_LABELS[pkg.type]}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[pkg.status]}`}>{pkg.status.replace(/_/g, ' ')}</span>
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
          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${overallCompletion}%` }} />
            </div>
          </div>
        </div>

        {/* Stage tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {STAGES.map(s => (
            <button key={s.id} onClick={() => setActiveStage(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${activeStage === s.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'}`}>
              <s.icon className="w-4 h-4 shrink-0" />
              <span>{s.label}</span>
              {s.id === 1 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${overallCompletion >= 80 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{overallCompletion}%</span>}
              {s.id === 2 && pkg.firefliesTranscripts.length > 0 && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">{pkg.firefliesTranscripts.length}</span>}
              {s.id === 3 && (pkg.status === 'PENDING_APPROVAL' || pkg.status === 'APPROVED') && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">●</span>}
            </button>
          ))}
        </div>

        {/* ── STAGE 1: Client Documentation ── */}
        {activeStage === 1 && (
          <div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-indigo-800 mb-1">📋 Fill in documentation for each client</p>
              <p className="text-xs text-indigo-600">Click any client below to open the full documentation form. Complete all 8 tabs for each client: HubSpot setup, tech stack, integrations, access details, contacts, documents, ongoing work, and role-specific info.</p>
            </div>

            <div className="space-y-3 mb-5">
              {handovers.map(h => {
                const pct = h.completionPct;
                const icon = pct >= 80 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
                  pct >= 40 ? <Clock className="w-5 h-5 text-yellow-500" /> :
                  <AlertCircle className="w-5 h-5 text-red-400" />;
                return (
                  <Link key={h.id} href={`/handovers/${id}/client/${h.id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:border-indigo-300 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      {icon}
                      <div>
                        <p className="font-semibold text-gray-900">{clientMap[h.clientId] || 'Unknown'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="w-32 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                          <span className="text-xs text-gray-400">{h.integrations.length} integrations · {h.accessDetails.length} access · {h.contacts.length} contacts · {h.documents.length} docs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">Open →</span>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {overallCompletion >= 50 && pkg.status === 'DRAFT' && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800 text-sm">Looking good! Ready to upload the transcript?</p>
                  <p className="text-xs text-green-600 mt-0.5">Upload the handover call recording to auto-fill any missing details</p>
                </div>
                <button onClick={() => setActiveStage(2)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap">
                  Next: Upload Transcript →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 2: Transcript Upload ── */}
        {activeStage === 2 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Transcript Processing</h3>
                    <p className="text-xs text-gray-500">Upload a Fireflies .txt or any call transcript — AI extracts and auto-fills documentation across all clients</p>
                  </div>
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${uploading || aiProcessing ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Reading…' : 'Upload Transcript (.txt)'}
                  <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md" onChange={handleFileUpload} className="hidden" disabled={!!uploading || !!aiProcessing} />
                </label>
              </div>

              {pkg.firefliesTranscripts.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No transcripts uploaded yet. This step is optional but recommended.</p>
                </div>
              )}

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

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Ready to submit for PM approval?</p>
                <p className="text-xs text-gray-500 mt-0.5">Documentation is {overallCompletion}% complete. PM will review and approve before the handover is finalised.</p>
              </div>
              <button onClick={() => { handleSubmitForApproval(); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg whitespace-nowrap flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Submit for Approval
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: Approval ── */}
        {activeStage === 3 && (
          <div className="space-y-4">
            <div className={`rounded-xl border p-5 ${pkg.status === 'APPROVED' ? 'bg-green-50 border-green-200' : pkg.status === 'PENDING_APPROVAL' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-3">
                <UserCheck className={`w-6 h-6 ${pkg.status === 'APPROVED' ? 'text-green-600' : 'text-orange-500'}`} />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {pkg.status === 'APPROVED' ? '✅ Handover Approved' :
                     pkg.status === 'PENDING_APPROVAL' ? '⏳ Awaiting PM Approval' :
                     'PM Approval'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {pkg.status === 'APPROVED' ? `Approved by ${members.get(pkg.approvedBy || '')?.name || '—'} on ${formatDate(pkg.approvedAt || '')}` :
                     'A PM, Team Lead or Admin must review and approve this handover'}
                  </p>
                </div>
              </div>

              {pkg.status === 'APPROVED' && pkg.approvalNotes && (
                <div className="bg-white border border-green-100 rounded-lg p-3 text-sm text-gray-700">
                  <strong>Approval notes:</strong> {pkg.approvalNotes}
                </div>
              )}
            </div>

            {/* Approval actions for PM/Admin/Team Lead */}
            {(pkg.status === 'PENDING_APPROVAL' || pkg.status === 'IN_REVIEW') && isPM && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Review this handover</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Reviewing as {currentUser?.name}</span>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Approval Notes</p>
                  <textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add notes for the record — what was verified, any concerns, what the cover person should focus on…" />
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-3">Documentation is <strong>{overallCompletion}%</strong> complete across {handovers.length} clients</p>
                  <div className="flex gap-3">
                    <button onClick={handleApprove}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> Approve Handover
                    </button>
                    <button onClick={handleRequestChanges}
                      className="flex items-center gap-2 border border-orange-300 text-orange-600 hover:bg-orange-50 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!isPM && pkg.status === 'PENDING_APPROVAL' && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <p className="text-sm text-yellow-800">⏳ This handover is waiting for a PM, Team Lead, or Admin to review and approve. Only they can approve.</p>
              </div>
            )}

            {pkg.status === 'APPROVED' && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Handover is approved — generate the final summary</p>
                  <p className="text-xs text-gray-500 mt-0.5">Download a complete HTML document with all handover details</p>
                </div>
                <button onClick={() => setActiveStage(4)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg flex items-center gap-2">
                  <Download className="w-4 h-4" /> Go to Summary
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STAGE 4: Final Summary ── */}
        {activeStage === 4 && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Download className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Final Handover Summary</h3>
                  <p className="text-xs text-gray-500">A complete document covering everything documented in this handover</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">Team Member</p>
                  <p className="font-semibold">{member} · {memberRole}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="font-semibold capitalize">{pkg.status.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">Clients Documented</p>
                  <p className="font-semibold">{handovers.length} clients</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">Overall Completion</p>
                  <p className="font-semibold text-emerald-600">{overallCompletion}%</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {handovers.map(h => (
                  <div key={h.id} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-emerald-100 text-sm">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${h.completionPct >= 80 ? 'bg-green-500' : h.completionPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <span className="font-medium text-gray-900 flex-1">{clientMap[h.clientId]}</span>
                    <span className="text-gray-500">{h.completionPct}%</span>
                    <span className="text-gray-400 text-xs">{h.integrations.length} integrations · {h.accessDetails.length} access · {h.contacts.length} contacts</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={downloadSummary}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm">
                  <Download className="w-5 h-5" /> Download Summary (HTML)
                </button>
                {pkg.status !== 'COMPLETE' && (pkg.status === 'APPROVED' || overallCompletion >= 70) && (
                  <button onClick={handleMarkComplete}
                    className="flex items-center gap-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium px-5 py-3 rounded-xl text-sm transition-colors">
                    <CheckCircle2 className="w-4 h-4" /> Mark as Complete
                  </button>
                )}
              </div>
            </div>

            {pkg.status !== 'APPROVED' && pkg.status !== 'COMPLETE' && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <p className="text-sm text-yellow-800">⚠️ This handover hasn&apos;t been approved yet. You can still download a draft summary, but it&apos;s recommended to get PM approval first.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
