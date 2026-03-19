'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import {
  handoverFiles, members, clients, clientHandovers, auth,
  type HandoverFile, type ClientHandover, type HandoverStatus
} from '@/lib/storage';
import {
  formatDate, HANDOVER_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS,
  TYPE_COLORS, ROLE_LABELS, calcCompletion, isAdmin
} from '@/lib/utils';
import {
  ArrowLeft, Upload, Sparkles, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileText, Loader2, ShieldCheck, Download, Send, XCircle
} from 'lucide-react';

function generateSummaryHTML(
  file: HandoverFile,
  handovers: ClientHandover[],
  memberMap: Record<string, string>,
  memberRoleMap: Record<string, string>,
  clientMap: Record<string, string>
): string {
  const member = memberMap[file.teamMemberId] || 'Unknown';
  const role = memberRoleMap[file.teamMemberId] || '';
  const cover = file.coverPersonId ? memberMap[file.coverPersonId] : 'Not assigned';
  const approvedBy = file.approvedById ? memberMap[file.approvedById] : '';

  const F = (label: string, value: string | undefined, full = false) =>
    value ? `<div class="field${full ? ' full' : ''}"><div class="fl">${label}</div><div class="fv">${value}</div></div>` : '';

  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Handover File — ${member}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', sans-serif; }
body { color: #1e293b; background: #f5f0ff; padding: 40px 20px; }
.container { max-width: 920px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(147,84,255,0.12); }
.header { background: linear-gradient(135deg, #9354FF, #6B35CC); color: white; padding: 32px 40px; }
.header h1 { font-size: 22px; font-weight: 700; }
.header p { opacity: 0.8; margin-top: 4px; font-size: 13px; }
.meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 24px 40px; background: #f5f0ff; border-bottom: 1px solid #e9ddff; }
.meta-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9354FF; font-weight: 600; }
.meta-item .value { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px; }
.section { padding: 28px 40px; border-bottom: 1px solid #f1f5f9; }
.section h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9354FF; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e9ddff; }
.client-block { background: #fafaf9; border: 1px solid #e9ddff; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
.client-block h3 { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.field .fl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #9354FF; font-weight: 600; }
.field .fv { font-size: 13px; color: #334155; margin-top: 2px; white-space: pre-wrap; word-break: break-word; }
.field.full { grid-column: 1/-1; }
.tab-section { margin-top: 14px; padding-top: 12px; border-top: 1px solid #e9ddff; }
.tab-section h4 { font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
.tag { display: inline-block; background: #e9ddff; color: #9354FF; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; margin: 2px; }
.warn { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; margin-top: 10px; }
.warn .fl { color: #c2410c; }
.approval { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; margin: 0 40px 20px; }
.completion-bar { background: #e9ddff; border-radius: 4px; height: 5px; margin-top: 6px; }
.completion-fill { height: 5px; border-radius: 4px; background: #9354FF; }
.item-card { background: white; border: 1px solid #e9ddff; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
.item-card .item-title { font-weight: 600; font-size: 13px; color: #1e293b; }
.item-card .item-detail { font-size: 12px; color: #64748b; margin-top: 3px; }
.footer { text-align: center; padding: 20px; color: #9354FF; font-size: 12px; background: #f5f0ff; }
@media print { body { background: white; padding: 0; } .container { box-shadow: none; } }
</style></head><body><div class="container">
<div class="header">
  <h1>Handover File — ${member}</h1>
  <p>${role} · ${HANDOVER_TYPE_LABELS[file.type]} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
</div>
<div class="meta">
  <div class="meta-item"><div class="label">Last Day / Start</div><div class="value">${formatDate(file.startDate)}</div></div>
  ${file.endDate ? `<div class="meta-item"><div class="label">Return Date</div><div class="value">${formatDate(file.endDate)}</div></div>` : '<div></div>'}
  <div class="meta-item"><div class="label">Cover Person</div><div class="value">${cover}</div></div>
  <div class="meta-item"><div class="label">Status</div><div class="value">${STATUS_LABELS[file.status]}</div></div>
  <div class="meta-item"><div class="label">Clients Documented</div><div class="value">${handovers.length}</div></div>
  <div class="meta-item"><div class="label">Notes</div><div class="value">${file.notes || '—'}</div></div>
</div>`;

  if (file.approvedById && file.approvedAt) {
    html += `<div class="approval"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
<div><strong>Approved by ${approvedBy}</strong> on ${formatDate(file.approvedAt)}${file.approvalNotes ? ` · "${file.approvalNotes}"` : ''}</div></div>`;
  }

  handovers.forEach(h => {
    const pct = h.completionPct;
    html += `<div class="section"><div class="client-block"><h3>${clientMap[h.clientId] || 'Unknown'}</h3>
<div class="completion-bar"><div class="completion-fill" style="width:${pct}%"></div></div>
<p style="font-size:11px;color:#9354FF;margin-top:4px;">${pct}% documented</p>`;
    if (h.hubspot.portalId || h.hubspot.keyWorkflows) {
      html += `<div class="tab-section"><h4>🟠 HubSpot</h4><div class="field-grid">${F('Portal ID',h.hubspot.portalId)}${F('URL',h.hubspot.portalUrl)}${F('Tier',h.hubspot.tier)}${F('Active Hubs',h.hubspot.activeHubs.join(', '))}${F('Pipelines',h.hubspot.pipelineNames,true)}${F('Workflows',h.hubspot.keyWorkflows,true)}${F('Forms & Pages',h.hubspot.formsLandingPages,true)}${F('Email Templates',h.hubspot.emailTemplates,true)}${F('Reports',h.hubspot.reportsDashboards,true)}${F('Custom Props',h.hubspot.customProperties,true)}${F('CRM Notes',h.hubspot.crmNotes,true)}</div></div>`;
    }
    if (h.techStack.siteUrl || h.techStack.repoUrl) {
      html += `<div class="tab-section"><h4>💻 Tech Stack</h4><div class="field-grid">${F('Type',h.techStack.siteType)}${F('Live URL',h.techStack.siteUrl)}${F('Staging',h.techStack.stagingUrl)}${F('Admin URL',h.techStack.adminUrl)}${F('Repo',h.techStack.repoUrl)}${F('Branch',h.techStack.repoBranch)}${F('Hosting',h.techStack.hostingProvider)}${F('Hosting URL',h.techStack.hostingUrl)}${F('Theme',h.techStack.themeFramework)}${F('PHP',h.techStack.phpVersion)}${F('Plugins',h.techStack.plugins,true)}${F('Deployment',h.techStack.deploymentProcess,true)}${F('Local Setup',h.techStack.localSetup,true)}${F('Notes',h.techStack.techNotes,true)}</div></div>`;
    }
    if (h.integrations.length > 0) {
      html += `<div class="tab-section"><h4>🔌 Integrations</h4>`;
      h.integrations.forEach(i => { html += `<div class="item-card"><div class="item-title">${i.name} <span class="tag">${i.type}</span></div><div class="item-detail">Purpose: ${i.purpose} · Access: ${i.accessMethod}</div><div class="item-detail">Credentials: ${i.credentialsLocation}</div>${i.notes ? `<div class="item-detail">${i.notes}</div>` : ''}</div>`; });
      html += `</div>`;
    }
    if (h.accessDetails.length > 0) {
      html += `<div class="tab-section"><h4>🔐 Access Details</h4>`;
      h.accessDetails.forEach(a => { html += `<div class="item-card"><div class="item-title">${a.tool} <span class="tag">${a.accessLevel}</span></div><div class="item-detail">URL: ${a.url} · User: ${a.username}</div><div class="item-detail">Credentials: ${a.credentialsLocation}</div>${a.twoFactorInfo ? `<div class="item-detail">2FA: ${a.twoFactorInfo}</div>` : ''}${a.notes ? `<div class="item-detail">${a.notes}</div>` : ''}</div>`; });
      html += `</div>`;
    }
    if (h.contacts.length > 0) {
      html += `<div class="tab-section"><h4>👤 Contacts</h4>`;
      h.contacts.forEach(c => { html += `<div class="item-card"><div class="item-title">${c.name} <span class="tag">${c.role}</span></div><div class="item-detail">${c.email}${c.phone ? ` · ${c.phone}` : ''}</div>${c.notes ? `<div class="item-detail">${c.notes}</div>` : ''}</div>`; });
      html += `</div>`;
    }
    if (h.documents.length > 0) {
      html += `<div class="tab-section"><h4>📎 Documents</h4>`;
      h.documents.forEach(d => { html += `<div class="item-card"><div class="item-title">${d.name} <span class="tag">${d.type.toUpperCase()}</span></div>${d.url ? `<div class="item-detail"><a href="${d.url}">${d.url}</a></div>` : ''}${d.notes ? `<div class="item-detail">${d.notes}</div>` : ''}</div>`; });
      html += `</div>`;
    }
    const ow = h.ongoingWork;
    if (ow.activeProjects || ow.pendingTasks || ow.doNotTouch) {
      html += `<div class="tab-section"><h4>⚙️ Ongoing Work</h4><div class="field-grid">${F('Active Projects',ow.activeProjects,true)}${F('Pending Tasks',ow.pendingTasks,true)}${F('Open Issues',ow.openIssues,true)}${F('Critical Deadlines',ow.criticalDeadlines,true)}${F('Weekly Tasks',ow.weeklyTasks,true)}${F('Client Expectations',ow.clientExpectations,true)}${F('Notes',ow.notes,true)}</div>`;
      if (ow.doNotTouch) html += `<div class="warn"><div class="fl">⚠️ DO NOT TOUCH</div><div class="fv" style="color:#9a3412;font-weight:500;">${ow.doNotTouch}</div></div>`;
      html += `</div>`;
    }
    const rs = h.roleSpecific;
    const hasRoleData = rs.pmTool || rs.figmaUrl || rs.integrationArchitecture || rs.codeStandards || rs.teamStructure;
    if (hasRoleData) {
      html += `<div class="tab-section"><h4>🎯 Role-Specific</h4><div class="field-grid">${F('PM Tool',rs.pmTool)}${F('Board URL',rs.pmUrl)}${F('Meeting Cadence',rs.meetingCadence)}${F('Reporting',rs.reportingSchedule)}${F('Stakeholders',rs.stakeholders,true)}${F('Project Status',rs.projectStatus,true)}${F('Figma',rs.figmaUrl)}${F('Brand Guidelines',rs.brandGuidelinesUrl)}${F('Assets',rs.assetsLocation)}${F('Design Notes',rs.designNotes,true)}${F('Integration Architecture',rs.integrationArchitecture,true)}${F('Data Flow',rs.dataFlowNotes,true)}${F('Webhooks/APIs',rs.webhookDetails,true)}${F('Code Standards',rs.codeStandards,true)}${F('Build Process',rs.buildProcess,true)}${F('Team Structure',rs.teamStructure,true)}${F('Escalation Path',rs.escalationPath)}${F('Decision Authority',rs.decisionAuthority)}</div></div>`;
    }
    html += `</div></div>`;
  });

  html += `<div class="footer">Generated by NEXA Handover Hub · ${new Date().toLocaleString()}</div></div></body></html>`;
  return html;
}

export default function HandoverFilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [file, setFile] = useState<HandoverFile | null>(null);
  const [handovers, setHandovers] = useState<ClientHandover[]>([]);
  const [member, setMember] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [coverPerson, setCoverPerson] = useState('');
  const [clientMap, setClientMap] = useState<Record<string, string>>({});
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [memberRoleMap, setMemberRoleMap] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'transcript' | 'summary'>('docs');
  const fileRef = useRef<HTMLInputElement>(null);
  const currentUser = auth.current();
  const userIsAdmin = currentUser ? isAdmin(currentUser.role) : false;

  const reload = useCallback(() => {
    const f = handoverFiles.get(id);
    if (!f) { router.push('/handovers'); return; }
    setFile(f);
    const allMembers = members.all();
    const mm: Record<string, string> = {}; const rm: Record<string, string> = {};
    allMembers.forEach(m => { mm[m.id] = m.name; rm[m.id] = ROLE_LABELS[m.role]; });
    setMemberMap(mm); setMemberRoleMap(rm);
    const m = members.get(f.teamMemberId);
    setMember(m?.name || '—'); setMemberRole(m ? ROLE_LABELS[m.role] : '');
    if (f.coverPersonId) { const cp = members.get(f.coverPersonId); setCoverPerson(cp?.name || ''); }
    const cm: Record<string, string> = {};
    clients.all().forEach(c => { cm[c.id] = c.name; });
    setClientMap(cm);
    const hs = f.clientHandoverIds.map(hid => clientHandovers.get(hid)).filter(Boolean) as ClientHandover[];
    const updated = hs.map(h => {
      const pct = calcCompletion(h);
      if (pct !== h.completionPct) { clientHandovers.update(h.id, { completionPct: pct }); return { ...h, completionPct: pct }; }
      return h;
    });
    setHandovers(updated);
  }, [id, router]);

  useEffect(() => { reload(); }, [reload]);

  const handleApprove = () => {
    if (!currentUser) return;
    handoverFiles.update(id, {
      status: 'APPROVED', approvedById: currentUser.id,
      approvedAt: new Date().toISOString(), approvalNotes,
    });
    setShowApprovalForm(false); reload();
  };

  const handleDecline = () => {
    handoverFiles.update(id, { status: 'DRAFT', approvedById: undefined, approvedAt: undefined, approvalNotes: undefined });
    reload();
  };

  const downloadSummary = () => {
    if (!file) return;
    const html = generateSummaryHTML(file, handovers, memberMap, memberRoleMap, clientMap);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXA-Handover-${member.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const entryId = Date.now().toString();
      const newEntry = { id: entryId, fileName: f.name, uploadedAt: new Date().toISOString(), processed: false, summary: '' };
      const updated = handoverFiles.update(id, { firefliesTranscripts: [...(file.firefliesTranscripts || []), newEntry] });
      if (updated) setFile(updated);
      setUploading(false); setAiProcessing(entryId);
      try {
        const clientNames = handovers.map(h => ({ id: h.id, clientId: h.clientId, name: clientMap[h.clientId] || h.clientId }));
        const prompt = `Analyse this handover call transcript. Clients: ${clientNames.map(c => c.name).join(', ')}.\nTranscript:\n---\n${text.substring(0, 8000)}\n---\nExtract handover info. Respond ONLY with JSON:\n{"clientMatches":[{"clientName":"","handoverId":"","extractedData":{"hubspot":{"portalId":"","activeHubs":[],"keyWorkflows":"","pipelineNames":"","crmNotes":""},"techStack":{"siteType":"","siteUrl":"","stagingUrl":"","adminUrl":"","repoUrl":"","hostingProvider":"","deploymentProcess":"","plugins":"","techNotes":""},"integrations":[{"name":"","type":"","purpose":"","accessMethod":"","credentialsLocation":"","notes":""}],"accessDetails":[{"tool":"","url":"","username":"","credentialsLocation":"","twoFactorInfo":"","accessLevel":"","notes":""}],"contacts":[{"name":"","role":"","email":"","phone":"","notes":""}],"ongoingWork":{"activeProjects":"","openIssues":"","pendingTasks":"","criticalDeadlines":"","doNotTouch":"","clientExpectations":"","weeklyTasks":""},"roleSpecific":{"pmTool":"","pmUrl":"","meetingCadence":"","figmaUrl":"","brandGuidelinesUrl":"","integrationArchitecture":"","dataFlowNotes":""}}}],"summary":"2-3 sentence summary"}\nClient ID map: ${JSON.stringify(clientNames.map(c => ({ name: c.name, handoverId: c.id })))}`;
        const resp = await fetch('/api/ai-process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
        if (resp.ok) {
          const result = await resp.json();
          if (result.data?.clientMatches) {
            for (const match of result.data.clientMatches) {
              const h = handovers.find(x => x.id === match.handoverId);
              if (h && match.extractedData) {
                const ed = match.extractedData; const updates: Partial<ClientHandover> = {};
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
          const cur = handoverFiles.get(id);
          if (cur) handoverFiles.update(id, { firefliesTranscripts: cur.firefliesTranscripts.map(t => t.id === entryId ? { ...t, processed: true, summary: result.data?.summary || 'Processed' } : t) });
        }
      } catch {
        const cur = handoverFiles.get(id);
        if (cur) handoverFiles.update(id, { firefliesTranscripts: cur.firefliesTranscripts.map(t => t.id === entryId ? { ...t, processed: true, summary: 'Processing failed — fill in manually' } : t) });
      }
      setAiProcessing(null); reload();
    };
    reader.readAsText(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!file) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const overallPct = handovers.length > 0 ? Math.round(handovers.reduce((s, h) => s + h.completionPct, 0) / handovers.length) : 0;
  const canSubmit = file.status === 'DRAFT' && handovers.length > 0;

  const PURPLE = '#9354FF';
  const LIGHT = '#E9DDFF';

  return (
    <div>
      <TopBar title="Handover File" subtitle={`${member} — ${HANDOVER_TYPE_LABELS[file.type]}`} />
      <div className="p-6 max-w-4xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> All Handover Files
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-5" style={{ borderColor: LIGHT }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{member}</h2>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500 text-sm">{memberRole}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[file.type]}`}>{HANDOVER_TYPE_LABELS[file.type]}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[file.status]}`}>{STATUS_LABELS[file.status]}</span>
                {file.startDate && <span className="text-sm text-gray-500">Last day: <strong>{formatDate(file.startDate)}</strong></span>}
                {file.endDate && <span className="text-sm text-gray-500">Returns: <strong>{formatDate(file.endDate)}</strong></span>}
                {coverPerson && <span className="text-sm text-gray-500">Cover: <strong>{coverPerson}</strong></span>}
              </div>
              {file.notes && <p className="text-sm text-gray-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">{file.notes}</p>}
            </div>
            <div className="text-center shrink-0">
              <div className="text-3xl font-bold" style={{ color: PURPLE }}>{overallPct}%</div>
              <p className="text-xs text-gray-400">documented</p>
            </div>
          </div>
          <div className="w-full rounded-full h-2 mt-4" style={{ background: LIGHT }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${overallPct}%`, background: PURPLE }} />
          </div>

          {/* Approval area */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: LIGHT }}>
            {/* Approved banner */}
            {file.status === 'APPROVED' && file.approvedById && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl text-sm text-green-700 bg-green-50 border border-green-100">
                <ShieldCheck className="w-4 h-4" />
                <span>Approved by <strong>{memberMap[file.approvedById]}</strong> on {formatDate(file.approvedAt || '')}
                  {file.approvalNotes && ` — "${file.approvalNotes}"`}</span>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {/* Submit for approval — visible in DRAFT for everyone */}
              {file.status === 'DRAFT' && (
                <button onClick={() => handoverFiles.update(id, { status: 'PENDING_APPROVAL' }) && reload()}
                  disabled={!canSubmit}
                  title={!canSubmit ? 'Add at least one client first' : 'Submit this file for admin approval'}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-colors border disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: PURPLE, color: PURPLE, background: '#FBF8FF' }}
                  onMouseEnter={e => { if (canSubmit) { (e.target as HTMLElement).style.background = LIGHT; } }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = '#FBF8FF'; }}>
                  <Send className="w-3.5 h-3.5" /> Submit for Approval
                </button>
              )}

              {/* Admin: Approve / Decline */}
              {userIsAdmin && file.status === 'PENDING_APPROVAL' && !showApprovalForm && (
                <button onClick={() => setShowApprovalForm(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all"
                  style={{ background: PURPLE }}>
                  <ShieldCheck className="w-3.5 h-3.5" /> Review & Approve
                </button>
              )}

              {userIsAdmin && file.status === 'PENDING_APPROVAL' && (
                <button onClick={handleDecline}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-600 px-4 py-2 rounded-xl border border-red-200 hover:bg-red-50 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Decline & Send Back
                </button>
              )}

              {/* Mark complete — admin only after approval */}
              {userIsAdmin && file.status === 'APPROVED' && (
                <button onClick={() => { handoverFiles.update(id, { status: 'COMPLETE' }); reload(); }}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all"
                  style={{ background: '#16a34a' }}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Complete
                </button>
              )}

              {file.status === 'PENDING_APPROVAL' && !userIsAdmin && (
                <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Waiting for admin approval
                </span>
              )}
            </div>

            {/* Approval form */}
            {showApprovalForm && (
              <div className="mt-3 rounded-2xl p-4 space-y-3" style={{ background: '#FBF8FF', border: `1px solid ${LIGHT}` }}>
                <p className="text-sm font-semibold" style={{ color: PURPLE }}>Approve Handover File</p>
                <textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} rows={2}
                  placeholder="Optional: Add approval notes or feedback for the team…"
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: LIGHT }}
                  onFocus={e => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = `0 0 0 3px ${LIGHT}`; }}
                  onBlur={e => { e.target.style.borderColor = LIGHT; e.target.style.boxShadow = 'none'; }} />
                <div className="flex gap-2">
                  <button onClick={handleApprove}
                    className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl"
                    style={{ background: PURPLE }}>
                    <ShieldCheck className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => setShowApprovalForm(false)} className="border text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50" style={{ borderColor: LIGHT }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl mb-5" style={{ background: LIGHT }}>
          {[
            { key: 'docs', label: 'Client Documentation', icon: FileText },
            { key: 'transcript', label: 'Upload Transcript (AI)', icon: Sparkles },
            { key: 'summary', label: 'Summary & Download', icon: Download },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className="flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-xl text-sm font-medium transition-all"
              style={activeTab === key ? { background: 'white', color: PURPLE, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } : { color: '#7c3aed' }}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Tab: Docs */}
        {activeTab === 'docs' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Click a client to fill in their full handover documentation across 8 tabs.</p>
            {handovers.map(h => {
              const pct = h.completionPct;
              const icon = pct >= 80 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : pct >= 40 ? <Clock className="w-5 h-5 text-yellow-500" /> : <AlertCircle className="w-5 h-5 text-red-400" />;
              return (
                <Link key={h.id} href={`/handovers/${id}/client/${h.id}`}
                  className="flex items-center justify-between bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all group"
                  style={{ borderColor: LIGHT }}>
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <p className="font-semibold text-gray-900">{clientMap[h.clientId] || 'Unknown'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="w-32 rounded-full h-1.5" style={{ background: LIGHT }}>
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#f87171' }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct}% · {h.integrations.length} integrations · {h.accessDetails.length} access · {h.contacts.length} contacts</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-400 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Tab: Transcript */}
        {activeTab === 'transcript' && (
          <div className="rounded-2xl border p-6" style={{ background: '#FBF8FF', borderColor: LIGHT }}>
            <div className="flex items-start gap-3 mb-5">
              <Sparkles className="w-6 h-6 shrink-0" style={{ color: PURPLE }} />
              <div>
                <h3 className="font-bold text-gray-900">AI Transcript Processing</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a Fireflies or any handover call transcript (.txt, .vtt, .srt). Claude AI reads it and auto-fills HubSpot details, tech stack, integrations, access, contacts and ongoing work across all clients.</p>
              </div>
            </div>
            <label className={`flex items-center justify-center gap-2 w-full py-5 rounded-2xl border-2 border-dashed cursor-pointer transition-all font-medium ${uploading || aiProcessing ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : 'hover:bg-white'}`}
              style={!uploading && !aiProcessing ? { borderColor: PURPLE, color: PURPLE } : {}}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              {uploading ? 'Reading file…' : 'Click to upload transcript (.txt, .vtt, .srt)'}
              <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md" onChange={handleFileUpload} className="hidden" disabled={!!uploading || !!aiProcessing} />
            </label>
            {file.firefliesTranscripts.length > 0 && (
              <div className="space-y-2 mt-4">
                {file.firefliesTranscripts.map(t => (
                  <div key={t.id} className="bg-white rounded-xl p-3 flex items-start gap-3 border" style={{ borderColor: LIGHT }}>
                    <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: PURPLE }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{t.fileName}</p>
                        {aiProcessing === t.id ? <span className="flex items-center gap-1 text-xs" style={{ color: PURPLE }}><Loader2 className="w-3 h-3 animate-spin" />AI processing…</span>
                          : t.processed ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" />Processed</span>
                          : <span className="flex items-center gap-1 text-xs text-yellow-600"><Clock className="w-3 h-3" />Pending</span>}
                      </div>
                      {t.summary && <p className="text-xs text-gray-500 mt-0.5">{t.summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">Requires ANTHROPIC_API_KEY in Vercel environment variables.</p>
          </div>
        )}

        {/* Tab: Summary */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: LIGHT }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-900">Handover Summary Document</h3>
                <p className="text-sm text-gray-500 mt-1">Complete, print-ready summary of all documentation. Open in browser → print as PDF.</p>
              </div>
              <button onClick={downloadSummary}
                className="flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                style={{ background: `linear-gradient(135deg, ${PURPLE}, #6B35CC)` }}>
                <Download className="w-4 h-4" /> Download HTML
              </button>
            </div>
            <div className="rounded-2xl p-5 space-y-4" style={{ background: '#FBF8FF', border: `1px solid ${LIGHT}` }}>
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-xs font-semibold" style={{ color: PURPLE }}>Team Member</p><p className="text-sm font-semibold text-gray-900 mt-1">{member}</p><p className="text-xs text-gray-400">{memberRole}</p></div>
                <div><p className="text-xs font-semibold" style={{ color: PURPLE }}>Type</p><p className="text-sm font-medium text-gray-900 mt-1">{HANDOVER_TYPE_LABELS[file.type]}</p></div>
                <div><p className="text-xs font-semibold" style={{ color: PURPLE }}>Status</p><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[file.status]}`}>{STATUS_LABELS[file.status]}</span></div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: PURPLE }}>Clients ({handovers.length})</p>
                <div className="space-y-2">
                  {handovers.map(h => (
                    <div key={h.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border" style={{ borderColor: LIGHT }}>
                      <p className="text-sm font-medium text-gray-900">{clientMap[h.clientId]}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-20 rounded-full h-1.5" style={{ background: LIGHT }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${h.completionPct}%`, background: h.completionPct >= 80 ? '#22c55e' : h.completionPct >= 40 ? '#f59e0b' : '#f87171' }} />
                        </div>
                        <span className="text-xs text-gray-500">{h.completionPct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {file.approvedById && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                  <ShieldCheck className="w-4 h-4" />Approved by {memberMap[file.approvedById]} on {formatDate(file.approvedAt || '')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
