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
  TYPE_COLORS, ROLE_LABELS, calcCompletion
} from '@/lib/utils';
import {
  ArrowLeft, Upload, Sparkles, CheckCircle2, Clock, AlertCircle,
  ChevronRight, FileText, Loader2, ShieldCheck, Download, Send, XCircle
} from 'lucide-react';

// ─── Summary Generator ─────────────────────────────────────────────────────────
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

  let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Handover File — ${member}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #f8fafc; padding: 40px 20px; }
  .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; padding: 32px 40px; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header p { opacity: 0.8; margin-top: 4px; font-size: 14px; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; padding: 24px 40px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
  .meta-item { }
  .meta-item .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; }
  .meta-item .value { font-size: 14px; font-weight: 600; color: #1e293b; margin-top: 2px; }
  .section { padding: 28px 40px; border-bottom: 1px solid #f1f5f9; }
  .section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4f46e5; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e0e7ff; }
  .client-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
  .client-block h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 14px; }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .field { }
  .field .fl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; font-weight: 600; }
  .field .fv { font-size: 13px; color: #334155; margin-top: 2px; white-space: pre-wrap; word-break: break-word; }
  .field.full { grid-column: 1/-1; }
  .tab-section { margin-top: 16px; padding-top: 14px; border-top: 1px solid #e2e8f0; }
  .tab-section h4 { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }
  .tag { display: inline-block; background: #e0e7ff; color: #4f46e5; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; margin: 2px; }
  .warn { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 10px 14px; margin-top: 10px; }
  .warn .fl { color: #c2410c; }
  .approval { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; margin: 0 40px 20px; }
  .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
  .completion-bar { background: #e2e8f0; border-radius: 4px; height: 6px; margin-top: 8px; }
  .completion-fill { height: 6px; border-radius: 4px; background: #4f46e5; }
  .item-card { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 8px; }
  .item-card .item-title { font-weight: 600; font-size: 13px; color: #1e293b; }
  .item-card .item-detail { font-size: 12px; color: #64748b; margin-top: 3px; }
  @media print { body { background: white; padding: 0; } .container { box-shadow: none; } }
</style></head><body><div class="container">
<div class="header">
  <h1>Handover File — ${member}</h1>
  <p>${role} · ${HANDOVER_TYPE_LABELS[file.type]} · Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
    html += `<div class="approval">
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#16a34a" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  <div><strong>Approved by ${approvedBy}</strong> on ${formatDate(file.approvedAt)}${file.approvalNotes ? ` · "${file.approvalNotes}"` : ''}</div>
</div>`;
  }

  const F = (label: string, value: string | undefined, full = false) =>
    value ? `<div class="field${full ? ' full' : ''}"><div class="fl">${label}</div><div class="fv">${value}</div></div>` : '';

  handovers.forEach(h => {
    const pct = h.completionPct;
    html += `<div class="section"><div class="client-block">
<h3>${clientMap[h.clientId] || 'Unknown Client'}</h3>
<div class="completion-bar"><div class="completion-fill" style="width:${pct}%"></div></div>
<p style="font-size:11px;color:#64748b;margin-top:4px;">${pct}% documented</p>`;

    // HubSpot
    if (h.hubspot.portalId || h.hubspot.keyWorkflows) {
      html += `<div class="tab-section"><h4>🟠 HubSpot Setup</h4><div class="field-grid">
${F('Portal ID', h.hubspot.portalId)}
${F('Portal URL', h.hubspot.portalUrl)}
${F('Tier / Plan', h.hubspot.tier)}
${F('Active Hubs', h.hubspot.activeHubs.join(', '))}
${F('Pipelines', h.hubspot.pipelineNames, true)}
${F('Key Workflows & Automations', h.hubspot.keyWorkflows, true)}
${F('Forms & Landing Pages', h.hubspot.formsLandingPages, true)}
${F('Email Templates', h.hubspot.emailTemplates, true)}
${F('Reports & Dashboards', h.hubspot.reportsDashboards, true)}
${F('Custom Properties', h.hubspot.customProperties, true)}
${F('CRM Notes', h.hubspot.crmNotes, true)}
</div></div>`;
    }

    // Tech Stack
    if (h.techStack.siteUrl || h.techStack.repoUrl) {
      html += `<div class="tab-section"><h4>💻 Tech Stack</h4><div class="field-grid">
${F('Site Type', h.techStack.siteType)}
${F('Live Site URL', h.techStack.siteUrl)}
${F('Staging URL', h.techStack.stagingUrl)}
${F('Admin / CMS URL', h.techStack.adminUrl)}
${F('Repository URL', h.techStack.repoUrl)}
${F('Branch', h.techStack.repoBranch)}
${F('Hosting Provider', h.techStack.hostingProvider)}
${F('Hosting URL', h.techStack.hostingUrl)}
${F('Theme / Framework', h.techStack.themeFramework)}
${F('PHP Version', h.techStack.phpVersion)}
${F('Key Plugins / Packages', h.techStack.plugins, true)}
${F('Deployment Process', h.techStack.deploymentProcess, true)}
${F('Local Setup', h.techStack.localSetup, true)}
${F('Technical Notes', h.techStack.techNotes, true)}
</div></div>`;
    }

    // Integrations
    if (h.integrations.length > 0) {
      html += `<div class="tab-section"><h4>🔌 Integrations (${h.integrations.length})</h4>`;
      h.integrations.forEach(int => {
        html += `<div class="item-card">
<div class="item-title">${int.name} <span class="tag">${int.type}</span></div>
<div class="item-detail">Purpose: ${int.purpose}</div>
<div class="item-detail">Access: ${int.accessMethod} · Credentials: ${int.credentialsLocation}</div>
${int.notes ? `<div class="item-detail">Notes: ${int.notes}</div>` : ''}
</div>`;
      });
      html += `</div>`;
    }

    // Access Details
    if (h.accessDetails.length > 0) {
      html += `<div class="tab-section"><h4>🔐 Access Details (${h.accessDetails.length})</h4>`;
      h.accessDetails.forEach(acc => {
        html += `<div class="item-card">
<div class="item-title">${acc.tool} <span class="tag">${acc.accessLevel}</span></div>
<div class="item-detail">URL: ${acc.url}</div>
<div class="item-detail">Username: ${acc.username} · Credentials: ${acc.credentialsLocation}</div>
${acc.twoFactorInfo ? `<div class="item-detail">2FA: ${acc.twoFactorInfo}</div>` : ''}
${acc.notes ? `<div class="item-detail">Notes: ${acc.notes}</div>` : ''}
</div>`;
      });
      html += `</div>`;
    }

    // Contacts
    if (h.contacts.length > 0) {
      html += `<div class="tab-section"><h4>👤 Key Contacts (${h.contacts.length})</h4>`;
      h.contacts.forEach(ct => {
        html += `<div class="item-card">
<div class="item-title">${ct.name} <span class="tag">${ct.role}</span></div>
<div class="item-detail">${ct.email}${ct.phone ? ` · ${ct.phone}` : ''}</div>
${ct.notes ? `<div class="item-detail">${ct.notes}</div>` : ''}
</div>`;
      });
      html += `</div>`;
    }

    // Documents
    if (h.documents.length > 0) {
      html += `<div class="tab-section"><h4>📎 Documents & Links (${h.documents.length})</h4>`;
      h.documents.forEach(doc => {
        html += `<div class="item-card">
<div class="item-title">${doc.name} <span class="tag">${doc.type.toUpperCase()}</span></div>
${doc.url ? `<div class="item-detail"><a href="${doc.url}">${doc.url}</a></div>` : ''}
${doc.notes ? `<div class="item-detail">${doc.notes}</div>` : ''}
</div>`;
      });
      html += `</div>`;
    }

    // Ongoing Work
    const ow = h.ongoingWork;
    if (ow.activeProjects || ow.pendingTasks || ow.doNotTouch) {
      html += `<div class="tab-section"><h4>⚙️ Ongoing Work</h4><div class="field-grid">
${F('Active Projects', ow.activeProjects, true)}
${F('Pending / Blocked Tasks', ow.pendingTasks, true)}
${F('Open Issues', ow.openIssues, true)}
${F('Critical Deadlines', ow.criticalDeadlines, true)}
${F('Weekly Recurring Tasks', ow.weeklyTasks, true)}
${F('Client Expectations', ow.clientExpectations, true)}
${F('General Notes', ow.notes, true)}
</div>`;
      if (ow.doNotTouch) {
        html += `<div class="warn"><div class="fl">⚠️ DO NOT TOUCH</div><div class="fv" style="color:#9a3412;font-weight:500;">${ow.doNotTouch}</div></div>`;
      }
      html += `</div>`;
    }

    // Role Specific
    const rs = h.roleSpecific;
    const hasRoleData = rs.pmTool || rs.figmaUrl || rs.integrationArchitecture || rs.codeStandards || rs.teamStructure;
    if (hasRoleData) {
      html += `<div class="tab-section"><h4>🎯 Role-Specific Details</h4><div class="field-grid">
${F('PM Tool', rs.pmTool)}${F('Project Board URL', rs.pmUrl)}
${F('Meeting Cadence', rs.meetingCadence)}${F('Reporting Schedule', rs.reportingSchedule)}
${F('Stakeholders', rs.stakeholders, true)}${F('Project Status', rs.projectStatus, true)}
${F('Figma URL', rs.figmaUrl)}${F('Brand Guidelines', rs.brandGuidelinesUrl)}
${F('Assets Location', rs.assetsLocation)}${F('Design Notes', rs.designNotes, true)}
${F('Integration Architecture', rs.integrationArchitecture, true)}
${F('Data Flow Notes', rs.dataFlowNotes, true)}
${F('Webhook / API Details', rs.webhookDetails, true)}
${F('Code Standards', rs.codeStandards, true)}
${F('Build Process', rs.buildProcess, true)}
${F('Team Structure', rs.teamStructure, true)}
${F('Escalation Path', rs.escalationPath)}${F('Decision Authority', rs.decisionAuthority)}
</div></div>`;
    }

    if (h.aiSummary) {
      html += `<div class="tab-section"><h4>🤖 AI Summary</h4><p style="font-size:13px;color:#334155;line-height:1.6;">${h.aiSummary}</p></div>`;
    }

    html += `</div></div>`;
  });

  html += `<div class="footer">Generated by Handover Hub · ${new Date().toLocaleString()}</div>
</div></body></html>`;
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
  const isPM = currentUser?.role === 'PM' || currentUser?.role === 'ADMIN';

  const reload = useCallback(() => {
    const f = handoverFiles.get(id);
    if (!f) { router.push('/handovers'); return; }
    setFile(f);
    const allMembers = members.all();
    const mm: Record<string, string> = {}; const rm: Record<string, string> = {};
    allMembers.forEach(m => { mm[m.id] = m.name; rm[m.id] = ROLE_LABELS[m.role]; });
    setMemberMap(mm); setMemberRoleMap(rm);
    const m = members.get(f.teamMemberId);
    setMember(m?.name || '—');
    setMemberRole(m ? ROLE_LABELS[m.role] : '');
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

  const handleStatusChange = (status: HandoverStatus) => {
    handoverFiles.update(id, { status }); reload();
  };

  const handleApprove = () => {
    if (!currentUser) return;
    handoverFiles.update(id, {
      status: 'APPROVED',
      approvedById: currentUser.id,
      approvedAt: new Date().toISOString(),
      approvalNotes: approvalNotes,
    });
    setShowApprovalForm(false);
    reload();
  };

  const handleMarkComplete = () => {
    if (file?.status !== 'APPROVED') return;
    handoverFiles.update(id, { status: 'COMPLETE' });
    reload();
  };

  const downloadSummary = () => {
    if (!file) return;
    const html = generateSummaryHTML(file, handovers, memberMap, memberRoleMap, clientMap);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Handover-File-${member.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
      setUploading(false);
      setAiProcessing(entryId);
      try {
        const clientNames = handovers.map(h => ({ id: h.id, clientId: h.clientId, name: clientMap[h.clientId] || h.clientId }));
        const prompt = `You are analysing a handover call transcript from a digital agency. The team member handles these clients: ${clientNames.map(c => c.name).join(', ')}.
Transcript:
---
${text.substring(0, 8000)}
---
Extract handover information. Respond ONLY with JSON:
{"clientMatches":[{"clientName":"","handoverId":"","extractedData":{"hubspot":{"portalId":"","activeHubs":[],"keyWorkflows":"","pipelineNames":"","crmNotes":""},"techStack":{"siteType":"","siteUrl":"","stagingUrl":"","adminUrl":"","repoUrl":"","hostingProvider":"","deploymentProcess":"","plugins":"","techNotes":""},"integrations":[{"name":"","type":"","purpose":"","accessMethod":"","credentialsLocation":"","notes":""}],"accessDetails":[{"tool":"","url":"","username":"","credentialsLocation":"","twoFactorInfo":"","accessLevel":"","notes":""}],"contacts":[{"name":"","role":"","email":"","phone":"","notes":""}],"ongoingWork":{"activeProjects":"","openIssues":"","pendingTasks":"","criticalDeadlines":"","doNotTouch":"","clientExpectations":"","weeklyTasks":""},"roleSpecific":{"pmTool":"","pmUrl":"","meetingCadence":"","figmaUrl":"","brandGuidelinesUrl":"","integrationArchitecture":"","dataFlowNotes":""}}}],"summary":"2-3 sentence summary"}
Client handover ID mapping: ${JSON.stringify(clientNames.map(c => ({ name: c.name, handoverId: c.id })))}`;
        const resp = await fetch('/api/ai-process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
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
          const cur = handoverFiles.get(id);
          if (cur) handoverFiles.update(id, { firefliesTranscripts: cur.firefliesTranscripts.map(t => t.id === entryId ? { ...t, processed: true, summary: result.data?.summary || 'Processed' } : t) });
        }
      } catch { const cur = handoverFiles.get(id); if (cur) handoverFiles.update(id, { firefliesTranscripts: cur.firefliesTranscripts.map(t => t.id === entryId ? { ...t, processed: true, summary: 'Processing failed — please fill in manually' } : t) }); }
      setAiProcessing(null); reload();
    };
    reader.readAsText(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  if (!file) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const overallPct = handovers.length > 0 ? Math.round(handovers.reduce((s, h) => s + h.completionPct, 0) / handovers.length) : 0;
  const allComplete = handovers.every(h => h.completionPct >= 80);

  return (
    <div>
      <TopBar title="Handover File" subtitle={`${member} — ${HANDOVER_TYPE_LABELS[file.type]}`} />
      <div className="p-6 max-w-4xl">
        <Link href="/handovers" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <ArrowLeft className="w-4 h-4" /> All Handover Files
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{member}</h2>
                <span className="text-gray-300">·</span>
                <span className="text-gray-600 text-sm">{memberRole}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[file.type]}`}>{HANDOVER_TYPE_LABELS[file.type]}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[file.status]}`}>{STATUS_LABELS[file.status]}</span>
                {file.startDate && <span className="text-sm text-gray-500">Last day: <strong>{formatDate(file.startDate)}</strong></span>}
                {file.endDate && <span className="text-sm text-gray-500">Returns: <strong>{formatDate(file.endDate)}</strong></span>}
                {coverPerson && <span className="text-sm text-gray-500">Cover: <strong>{coverPerson}</strong></span>}
              </div>
              {file.notes && <p className="text-sm text-gray-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">{file.notes}</p>}
            </div>
            <div className="text-center shrink-0">
              <div className="text-3xl font-bold text-indigo-600">{overallPct}%</div>
              <p className="text-xs text-gray-400">documented</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
          </div>

          {/* Approval Section */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            {file.status === 'APPROVED' && file.approvedById && (
              <div className="flex items-center gap-2 mb-3 bg-green-50 px-3 py-2 rounded-lg text-sm text-green-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Approved by <strong>{memberMap[file.approvedById]}</strong> on {formatDate(file.approvedAt || '')}
                  {file.approvalNotes && ` — "${file.approvalNotes}"`}</span>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status flow buttons */}
              {file.status === 'DRAFT' && (
                <button onClick={() => handleStatusChange('PENDING_APPROVAL')} disabled={!allComplete}
                  title={!allComplete ? 'Complete all client documentation first' : ''}
                  className="flex items-center gap-1.5 text-sm border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="w-3.5 h-3.5" /> Submit for PM Approval
                </button>
              )}

              {file.status === 'PENDING_APPROVAL' && isPM && !showApprovalForm && (
                <button onClick={() => setShowApprovalForm(true)}
                  className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5" /> Review & Approve
                </button>
              )}

              {file.status === 'PENDING_APPROVAL' && isPM && (
                <button onClick={() => handleStatusChange('DRAFT')}
                  className="flex items-center gap-1.5 text-sm border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Send Back to Draft
                </button>
              )}

              {file.status === 'APPROVED' && (
                <button onClick={handleMarkComplete}
                  className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark as Complete
                </button>
              )}

              {!allComplete && file.status === 'DRAFT' && (
                <span className="text-xs text-gray-400 italic">Complete all client documentation to submit for approval</span>
              )}
            </div>

            {/* Approval form */}
            {showApprovalForm && file.status === 'PENDING_APPROVAL' && (
              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-indigo-800">PM Approval</p>
                <textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} rows={2}
                  placeholder="Optional: Add approval notes or feedback…"
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                <div className="flex gap-2">
                  <button onClick={handleApprove}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                    <ShieldCheck className="w-4 h-4" /> Approve Handover File
                  </button>
                  <button onClick={() => setShowApprovalForm(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
          {[
            { key: 'docs', label: 'Client Documentation', icon: FileText },
            { key: 'transcript', label: 'Upload Transcript (AI)', icon: Sparkles },
            { key: 'summary', label: 'Summary & Download', icon: Download },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 flex-1 justify-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* Tab: Client Documentation */}
        {activeTab === 'docs' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Click a client to fill in their full handover documentation across 8 tabs.</p>
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
                        <span className="text-xs text-gray-400">{pct}% · {h.integrations.length} integrations · {h.accessDetails.length} access · {h.contacts.length} contacts</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}

        {/* Tab: Transcript Upload */}
        {activeTab === 'transcript' && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
            <div className="flex items-start gap-3 mb-5">
              <Sparkles className="w-6 h-6 text-indigo-600 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900">AI Transcript Processing</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a Fireflies or any handover call transcript (.txt, .vtt, .srt). Claude AI will read it and automatically fill in HubSpot details, tech stack, integrations, access details, contacts, and ongoing work across all clients.</p>
              </div>
            </div>
            <label className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploading || aiProcessing ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-indigo-300 hover:border-indigo-400 hover:bg-indigo-100 text-indigo-600'}`}>
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              <span className="font-medium">{uploading ? 'Reading file…' : 'Click to upload transcript (.txt, .vtt, .srt)'}</span>
              <input ref={fileRef} type="file" accept=".txt,.vtt,.srt,.md" onChange={handleFileUpload} className="hidden" disabled={!!uploading || !!aiProcessing} />
            </label>
            {file.firefliesTranscripts.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Uploaded Transcripts</p>
                {file.firefliesTranscripts.map(t => (
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
            <p className="text-xs text-gray-400 mt-4">Requires ANTHROPIC_API_KEY in Vercel environment variables. Get your key at console.anthropic.com</p>
          </div>
        )}

        {/* Tab: Summary & Download */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Handover Summary Document</h3>
                  <p className="text-sm text-gray-500 mt-1">A complete, print-ready summary of all documentation across every client. Share with the team or archive it.</p>
                </div>
                <button onClick={downloadSummary}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
                  <Download className="w-4 h-4" /> Download as HTML
                </button>
              </div>

              {/* Preview summary */}
              <div className="border border-gray-100 rounded-xl p-5 bg-slate-50 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Team Member</p>
                  <p className="font-semibold text-gray-900">{member} — {memberRole}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-xs text-gray-400">Type</p><p className="text-sm font-medium">{HANDOVER_TYPE_LABELS[file.type]}</p></div>
                  <div><p className="text-xs text-gray-400">Status</p><p className={`text-xs font-medium inline-block px-2 py-0.5 rounded-full ${STATUS_COLORS[file.status]}`}>{STATUS_LABELS[file.status]}</p></div>
                  <div><p className="text-xs text-gray-400">Cover Person</p><p className="text-sm font-medium">{coverPerson || '—'}</p></div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Clients ({handovers.length})</p>
                  <div className="space-y-2">
                    {handovers.map(h => (
                      <div key={h.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{clientMap[h.clientId]}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${h.completionPct >= 80 ? 'bg-green-500' : h.completionPct >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${h.completionPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{h.completionPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {file.approvedById && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                    Approved by {memberMap[file.approvedById]} on {formatDate(file.approvedAt || '')}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">The downloaded HTML file can be opened in any browser and printed as PDF (File → Print → Save as PDF).</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
