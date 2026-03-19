'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { clientHandovers, handoverFiles, clients, members, type ClientHandover, type Integration, type AccessDetail, type KeyContact, type Document } from '@/lib/storage';
import { calcCompletion, ROLE_LABELS } from '@/lib/utils';
import { ArrowLeft, Save, Plus, Trash2, ExternalLink, Upload, Link2 } from 'lucide-react';

const TABS = ['HubSpot', 'Tech Stack', 'Integrations', 'Access Details', 'Contacts', 'Documents', 'Ongoing Work', 'Role-Specific'];
const HUBS = ['Marketing Hub', 'Sales Hub', 'Service Hub', 'CMS Hub', 'Operations Hub'];
const SITE_TYPES = ['WordPress', 'React', 'Next.js', 'Shopify', 'Webflow', 'Vue', 'Angular', 'Laravel', 'Custom', 'Other'];

const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white';
const ta = ic + ' resize-none';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{label}{hint && <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">{hint}</span>}</label>
      {children}
    </div>
  );
}

export default function ClientHandoverPage() {
  const { id: packageId, clientId: handoverId } = useParams<{ id: string; clientId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [h, setH] = useState<ClientHandover | null>(null);
  const [clientName, setClientName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [saved, setSaved] = useState(false);

  const reload = useCallback(() => {
    const handover = clientHandovers.get(handoverId);
    if (!handover) { router.push(`/handovers/${packageId}`); return; }
    setH(handover);
    const c = clients.get(handover.clientId);
    setClientName(c?.name || 'Unknown Client');
    const pkg = handoverFiles.get(packageId);
    if (pkg) { const m = members.get(pkg.teamMemberId); if (m) setMemberRole(ROLE_LABELS[m.role]); }
  }, [handoverId, packageId, router]);

  useEffect(() => { reload(); }, [reload]);

  const save = (updates: Partial<ClientHandover>) => {
    if (!h) return;
    const merged = { ...h, ...updates };
    merged.completionPct = calcCompletion(merged as ClientHandover);
    clientHandovers.update(handoverId, merged);
    setH(merged as ClientHandover);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const upd = <K extends keyof ClientHandover>(field: K, val: ClientHandover[K]) => save({ [field]: val } as Partial<ClientHandover>);

  if (!h) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  // Nested updaters
  const hub = h.hubspot;
  const tech = h.techStack;
  const ongoing = h.ongoingWork;
  const role = h.roleSpecific;

  const addIntegration = () => {
    save({ integrations: [...h.integrations, { id: Date.now().toString(), name: '', type: '', purpose: '', accessMethod: '', credentialsLocation: '', notes: '' }] });
  };
  const updIntegration = (i: number, field: keyof Integration, val: string) => {
    const list = [...h.integrations]; list[i] = { ...list[i], [field]: val }; save({ integrations: list });
  };
  const removeIntegration = (i: number) => save({ integrations: h.integrations.filter((_, idx) => idx !== i) });

  const addAccess = () => save({ accessDetails: [...h.accessDetails, { id: Date.now().toString(), tool: '', url: '', username: '', credentialsLocation: '', twoFactorInfo: '', accessLevel: '', notes: '' }] });
  const updAccess = (i: number, field: keyof AccessDetail, val: string) => {
    const list = [...h.accessDetails]; list[i] = { ...list[i], [field]: val }; save({ accessDetails: list });
  };
  const removeAccess = (i: number) => save({ accessDetails: h.accessDetails.filter((_, idx) => idx !== i) });

  const addContact = () => save({ contacts: [...h.contacts, { id: Date.now().toString(), name: '', role: '', email: '', phone: '', notes: '' }] });
  const updContact = (i: number, field: keyof KeyContact, val: string) => {
    const list = [...h.contacts]; list[i] = { ...list[i], [field]: val }; save({ contacts: list });
  };
  const removeContact = (i: number) => save({ contacts: h.contacts.filter((_, idx) => idx !== i) });

  const addLink = () => save({ documents: [...h.documents, { id: Date.now().toString(), name: '', type: 'link', url: '', notes: '', createdAt: new Date().toISOString() }] });
  const updDoc = (i: number, field: keyof Document, val: string) => {
    const list = [...h.documents]; list[i] = { ...list[i], [field]: val } as Document; save({ documents: list });
  };
  const removeDoc = (i: number) => save({ documents: h.documents.filter((_, idx) => idx !== i) });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const doc: Document = {
        id: Date.now().toString(), name: file.name, type: 'file',
        url: '', fileData: ev.target?.result as string, mimeType: file.type,
        notes: '', createdAt: new Date().toISOString()
      };
      save({ documents: [...h.documents, doc] });
    };
    reader.readAsDataURL(file);
  };

  const completionColor = h.completionPct >= 80 ? 'bg-green-500' : h.completionPct >= 40 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div>
      <TopBar title={clientName} subtitle={`Handover documentation · ${memberRole}`} />
      <div className="flex flex-col flex-1">
        {/* Breadcrumb + completion */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/handovers" className="hover:text-gray-700">Handovers</Link>
            <span>/</span>
            <Link href={`/handovers/${packageId}`} className="hover:text-gray-700">Handover</Link>
            <span>/</span>
            <span className="font-medium text-gray-900">{clientName}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${completionColor}`} style={{ width: `${h.completionPct}%` }} />
              </div>
              <span className="text-xs text-gray-500">{h.completionPct}%</span>
            </div>
            {saved && <span className="text-xs text-green-600 flex items-center gap-1"><Save className="w-3 h-3" /> Saved</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === i ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 max-w-4xl">

          {/* ─── HUBSPOT ─── */}
          {tab === 0 && (
            <div className="space-y-5">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-2">
                <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">HubSpot CRM Setup</p>
                <p className="text-xs text-orange-600">Document every HubSpot configuration this person owns for this client</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Portal ID"><input value={hub.portalId} onChange={e => upd('hubspot', { ...hub, portalId: e.target.value })} className={ic} placeholder="e.g. 12345678" /></Field>
                <Field label="Portal URL"><input value={hub.portalUrl} onChange={e => upd('hubspot', { ...hub, portalUrl: e.target.value })} className={ic} placeholder="https://app.hubspot.com/..." /></Field>
                <Field label="HubSpot Tier / Plan"><input value={hub.tier} onChange={e => upd('hubspot', { ...hub, tier: e.target.value })} className={ic} placeholder="e.g. Marketing Hub Professional" /></Field>
              </div>
              <Field label="Active Hubs" hint="(select all that apply)">
                <div className="flex flex-wrap gap-2 mt-1">
                  {HUBS.map(h2 => (
                    <label key={h2} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm transition-colors ${hub.activeHubs.includes(h2 as typeof hub.activeHubs[0]) ? 'bg-orange-100 border-orange-300 text-orange-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={hub.activeHubs.includes(h2 as typeof hub.activeHubs[0])}
                        onChange={e => upd('hubspot', { ...hub, activeHubs: e.target.checked ? [...hub.activeHubs, h2 as typeof hub.activeHubs[0]] : hub.activeHubs.filter(x => x !== h2) })}
                        className="hidden" />
                      {h2}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label="Pipeline Names" hint="— list all deal/ticket pipelines"><textarea value={hub.pipelineNames} onChange={e => upd('hubspot', { ...hub, pipelineNames: e.target.value })} className={ta} rows={2} placeholder="Sales Pipeline: New Leads → Discovery → Proposal → Closed Won..." /></Field>
              <Field label="Key Workflows & Automations" hint="— what's automated, what triggers them"><textarea value={hub.keyWorkflows} onChange={e => upd('hubspot', { ...hub, keyWorkflows: e.target.value })} className={ta} rows={3} placeholder="Lead nurture workflow triggers on form submission on /contact. Email sequence: 5 emails over 14 days..." /></Field>
              <Field label="Forms & Landing Pages" hint="— active forms, which pages they're on"><textarea value={hub.formsLandingPages} onChange={e => upd('hubspot', { ...hub, formsLandingPages: e.target.value })} className={ta} rows={2} placeholder="Contact form on /contact, Newsletter form in footer, Demo request on /demo..." /></Field>
              <Field label="Email Templates"><textarea value={hub.emailTemplates} onChange={e => upd('hubspot', { ...hub, emailTemplates: e.target.value })} className={ta} rows={2} placeholder="Welcome email, Monthly newsletter, Re-engagement campaign..." /></Field>
              <Field label="Reports & Dashboards" hint="— key dashboards the client reviews"><textarea value={hub.reportsDashboards} onChange={e => upd('hubspot', { ...hub, reportsDashboards: e.target.value })} className={ta} rows={2} placeholder="Monthly performance dashboard shared every 1st of month..." /></Field>
              <Field label="Custom Properties Created"><textarea value={hub.customProperties} onChange={e => upd('hubspot', { ...hub, customProperties: e.target.value })} className={ta} rows={2} placeholder="Lead Score, Industry Vertical, Last Campaign Response..." /></Field>
              <Field label="CRM Notes / Gotchas" hint="— anything a newcomer MUST know"><textarea value={hub.crmNotes} onChange={e => upd('hubspot', { ...hub, crmNotes: e.target.value })} className={ta} rows={3} placeholder="Do NOT delete the 'Nurture' list — it feeds 3 workflows. The client logs in every Monday morning..." /></Field>
            </div>
          )}

          {/* ─── TECH STACK ─── */}
          {tab === 1 && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Tech Stack & Infrastructure</p>
                <p className="text-xs text-blue-600">All technical details needed to continue managing this client's website and systems</p>
              </div>
              <Field label="Site Type / Framework">
                <select value={tech.siteType} onChange={e => upd('techStack', { ...tech, siteType: e.target.value as typeof tech.siteType })} className={ic}>
                  {SITE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Live Site URL"><input value={tech.siteUrl} onChange={e => upd('techStack', { ...tech, siteUrl: e.target.value })} className={ic} placeholder="https://clientsite.com" /></Field>
                <Field label="Staging / Dev URL"><input value={tech.stagingUrl} onChange={e => upd('techStack', { ...tech, stagingUrl: e.target.value })} className={ic} placeholder="https://staging.clientsite.com" /></Field>
                <Field label="Admin / CMS URL"><input value={tech.adminUrl} onChange={e => upd('techStack', { ...tech, adminUrl: e.target.value })} className={ic} placeholder="https://clientsite.com/wp-admin" /></Field>
                <Field label="Repository URL"><input value={tech.repoUrl} onChange={e => upd('techStack', { ...tech, repoUrl: e.target.value })} className={ic} placeholder="https://github.com/agency/client-site" /></Field>
                <Field label="Repo / Main Branch"><input value={tech.repoBranch} onChange={e => upd('techStack', { ...tech, repoBranch: e.target.value })} className={ic} placeholder="main" /></Field>
                <Field label="PHP Version (if WP)"><input value={tech.phpVersion} onChange={e => upd('techStack', { ...tech, phpVersion: e.target.value })} className={ic} placeholder="8.1" /></Field>
                <Field label="Hosting Provider"><input value={tech.hostingProvider} onChange={e => upd('techStack', { ...tech, hostingProvider: e.target.value })} className={ic} placeholder="SiteGround / WP Engine / Cloudways..." /></Field>
                <Field label="Hosting Control Panel URL"><input value={tech.hostingUrl} onChange={e => upd('techStack', { ...tech, hostingUrl: e.target.value })} className={ic} placeholder="https://my.siteground.com/..." /></Field>
              </div>
              <Field label="Theme / Framework" hint="— e.g. Divi, Genesis, custom child theme, Tailwind"><input value={tech.themeFramework} onChange={e => upd('techStack', { ...tech, themeFramework: e.target.value })} className={ic} placeholder="Divi 4.x with custom child theme 'ClientTheme'" /></Field>
              <Field label="Key Plugins / Packages" hint="— critical ones to know about"><textarea value={tech.plugins} onChange={e => upd('techStack', { ...tech, plugins: e.target.value })} className={ta} rows={3} placeholder="WooCommerce 8.2, Yoast SEO Premium, WP Rocket (cache), Gravity Forms (license: see LastPass)..." /></Field>
              <Field label="Deployment Process" hint="— how to push changes to production"><textarea value={tech.deploymentProcess} onChange={e => upd('techStack', { ...tech, deploymentProcess: e.target.value })} className={ta} rows={3} placeholder="1. Develop on staging branch 2. PR to main 3. GitHub Actions deploys to WP Engine automatically..." /></Field>
              <Field label="Local Setup Instructions" hint="— how to run this locally"><textarea value={tech.localSetup} onChange={e => upd('techStack', { ...tech, localSetup: e.target.value })} className={ta} rows={3} placeholder="Clone repo, run `npm install`, copy .env.example to .env, LocalWP for WordPress..." /></Field>
              <Field label="Technical Notes / Gotchas"><textarea value={tech.techNotes} onChange={e => upd('techStack', { ...tech, techNotes: e.target.value })} className={ta} rows={3} placeholder="Cache must be cleared after any WooCommerce update. Do NOT update Gravity Forms without testing first..." /></Field>
            </div>
          )}

          {/* ─── INTEGRATIONS ─── */}
          {tab === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex-1 mr-4">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Integrations & Connected Tools</p>
                  <p className="text-xs text-purple-600">Every third-party integration connected to this client's HubSpot or website</p>
                </div>
                <button onClick={addIntegration} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0">
                  <Plus className="w-4 h-4" /> Add Integration
                </button>
              </div>
              {h.integrations.length === 0 && (
                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm">No integrations added yet</p>
                  <button onClick={addIntegration} className="mt-2 text-indigo-600 text-sm hover:underline">+ Add first integration</button>
                </div>
              )}
              {h.integrations.map((int, i) => (
                <div key={int.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Integration #{i + 1}</span>
                    <button onClick={() => removeIntegration(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Integration Name"><input value={int.name} onChange={e => updIntegration(i, 'name', e.target.value)} className={ic} placeholder="e.g. Mailchimp, Zapier, Stripe" /></Field>
                    <Field label="Type"><input value={int.type} onChange={e => updIntegration(i, 'type', e.target.value)} className={ic} placeholder="e.g. Email Marketing, Payment, Analytics" /></Field>
                    <Field label="Purpose / What it Does"><input value={int.purpose} onChange={e => updIntegration(i, 'purpose', e.target.value)} className={ic} placeholder="e.g. Syncs leads from HubSpot to email list" /></Field>
                    <Field label="Access Method"><input value={int.accessMethod} onChange={e => updIntegration(i, 'accessMethod', e.target.value)} className={ic} placeholder="e.g. API Key, OAuth, Username/Password" /></Field>
                  </div>
                  <Field label="Where are the Credentials?" hint="— be specific">
                    <input value={int.credentialsLocation} onChange={e => updIntegration(i, 'credentialsLocation', e.target.value)} className={ic} placeholder="e.g. LastPass > Client Folder > Mailchimp API Key" />
                  </Field>
                  <Field label="Notes / Important Info">
                    <textarea value={int.notes} onChange={e => updIntegration(i, 'notes', e.target.value)} className={ta} rows={2} placeholder="Any quirks, rate limits, known issues…" />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {/* ─── ACCESS DETAILS ─── */}
          {tab === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex-1 mr-4">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Access Details</p>
                  <p className="text-xs text-red-600">Every tool, platform, and system this person had access to for this client</p>
                </div>
                <button onClick={addAccess} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0">
                  <Plus className="w-4 h-4" /> Add Access
                </button>
              </div>
              {h.accessDetails.length === 0 && (
                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm">No access details added yet</p>
                  <button onClick={addAccess} className="mt-2 text-indigo-600 text-sm hover:underline">+ Add first access detail</button>
                </div>
              )}
              {h.accessDetails.map((acc, i) => (
                <div key={acc.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Access #{i + 1}</span>
                    <button onClick={() => removeAccess(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Tool / Platform Name"><input value={acc.tool} onChange={e => updAccess(i, 'tool', e.target.value)} className={ic} placeholder="e.g. HubSpot, WordPress, Cloudways" /></Field>
                    <Field label="URL"><input value={acc.url} onChange={e => updAccess(i, 'url', e.target.value)} className={ic} placeholder="https://..." /></Field>
                    <Field label="Username / Email"><input value={acc.username} onChange={e => updAccess(i, 'username', e.target.value)} className={ic} placeholder="e.g. agency@client.com" /></Field>
                    <Field label="Access Level"><input value={acc.accessLevel} onChange={e => updAccess(i, 'accessLevel', e.target.value)} className={ic} placeholder="e.g. Super Admin, Editor, Billing" /></Field>
                  </div>
                  <Field label="Where are the Credentials?" hint="— be specific">
                    <input value={acc.credentialsLocation} onChange={e => updAccess(i, 'credentialsLocation', e.target.value)} className={ic} placeholder="e.g. LastPass > Clients > TechNova > WordPress Admin" />
                  </Field>
                  <Field label="2FA / MFA Info">
                    <input value={acc.twoFactorInfo} onChange={e => updAccess(i, 'twoFactorInfo', e.target.value)} className={ic} placeholder="e.g. Authy on Marcus's phone — needs transfer, or OTP to shared@agency.com" />
                  </Field>
                  <Field label="Notes">
                    <textarea value={acc.notes} onChange={e => updAccess(i, 'notes', e.target.value)} className={ta} rows={2} placeholder="Anything important to know about this access…" />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {/* ─── CONTACTS ─── */}
          {tab === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex-1 mr-4">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Key Contacts (Client Side)</p>
                  <p className="text-xs text-green-600">Everyone at the client's company you'll need to deal with</p>
                </div>
                <button onClick={addContact} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg shrink-0">
                  <Plus className="w-4 h-4" /> Add Contact
                </button>
              </div>
              {h.contacts.length === 0 && (
                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <button onClick={addContact} className="text-indigo-600 text-sm hover:underline">+ Add first contact</button>
                </div>
              )}
              {h.contacts.map((ct, i) => (
                <div key={ct.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Contact #{i + 1}</span>
                    <button onClick={() => removeContact(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Full Name"><input value={ct.name} onChange={e => updContact(i, 'name', e.target.value)} className={ic} placeholder="e.g. Jane Doe" /></Field>
                    <Field label="Role / Title"><input value={ct.role} onChange={e => updContact(i, 'role', e.target.value)} className={ic} placeholder="e.g. Marketing Manager, CTO, Owner" /></Field>
                    <Field label="Email"><input value={ct.email} onChange={e => updContact(i, 'email', e.target.value)} className={ic} placeholder="jane@clientcompany.com" /></Field>
                    <Field label="Phone / WhatsApp"><input value={ct.phone} onChange={e => updContact(i, 'phone', e.target.value)} className={ic} placeholder="+971 50 123 4567" /></Field>
                  </div>
                  <Field label="Notes" hint="— communication style, preferences, what they care about">
                    <textarea value={ct.notes} onChange={e => updContact(i, 'notes', e.target.value)} className={ta} rows={2} placeholder="Prefers WhatsApp. Very detail-oriented. Always CC her manager on emails..." />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {/* ─── DOCUMENTS ─── */}
          {tab === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex-1">
                  <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">Documents & Links</p>
                  <p className="text-xs text-yellow-600">All files, links, recordings, briefs, contracts, SOWs, brand assets, etc.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={addLink} className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg">
                    <Link2 className="w-4 h-4" /> Add Link
                  </button>
                  <label className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload File
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
              {h.documents.length === 0 && (
                <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-sm">No documents or links yet</p>
                </div>
              )}
              {h.documents.map((doc, i) => (
                <div key={doc.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${doc.type === 'link' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{doc.type === 'link' ? 'LINK' : 'FILE'}</span>
                    <button onClick={() => removeDoc(i)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name / Title"><input value={doc.name} onChange={e => updDoc(i, 'name', e.target.value)} className={ic} placeholder="e.g. Brand Guidelines, SOW, Figma Link" /></Field>
                    {doc.type === 'link' && (
                      <Field label="URL">
                        <div className="flex gap-1">
                          <input value={doc.url} onChange={e => updDoc(i, 'url', e.target.value)} className={ic} placeholder="https://..." />
                          {doc.url && <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center px-2 border border-gray-200 rounded-lg hover:bg-gray-50"><ExternalLink className="w-4 h-4 text-gray-400" /></a>}
                        </div>
                      </Field>
                    )}
                    {doc.type === 'file' && doc.fileData && (
                      <div className="flex items-end">
                        <a href={doc.fileData} download={doc.name} className="flex items-center gap-1.5 text-indigo-600 hover:underline text-sm"><ExternalLink className="w-4 h-4" /> Download {doc.name}</a>
                      </div>
                    )}
                  </div>
                  <Field label="Notes"><textarea value={doc.notes} onChange={e => updDoc(i, 'notes', e.target.value)} className={ta} rows={1} placeholder="What is this document for?" /></Field>
                </div>
              ))}
            </div>
          )}

          {/* ─── ONGOING WORK ─── */}
          {tab === 6 && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Ongoing Work & Open Loops</p>
                <p className="text-xs text-amber-600">Everything in flight — projects, tasks, expectations, critical dates. The new person needs to pick up exactly where you left off.</p>
              </div>
              <Field label="Active Projects" hint="— what's currently being worked on">
                <textarea value={ongoing.activeProjects} onChange={e => upd('ongoingWork', { ...ongoing, activeProjects: e.target.value })} className={ta} rows={4} placeholder="1. Website redesign — Phase 2 in progress (wireframes approved, waiting on client copy)&#10;2. HubSpot onboarding — completing pipeline setup this week..." />
              </Field>
              <Field label="Pending / Blocked Tasks">
                <textarea value={ongoing.pendingTasks} onChange={e => upd('ongoingWork', { ...ongoing, pendingTasks: e.target.value })} className={ta} rows={3} placeholder="Waiting on client to approve homepage design (sent 12 Mar)&#10;Google Analytics access request pending from client IT..." />
              </Field>
              <Field label="Open Issues / Bugs">
                <textarea value={ongoing.openIssues} onChange={e => upd('ongoingWork', { ...ongoing, openIssues: e.target.value })} className={ta} rows={3} placeholder="Contact form occasionally fails on mobile Safari — investigating WPForms conflict&#10;HubSpot email open rates dropped — checking deliverability..." />
              </Field>
              <Field label="Critical Deadlines & Key Dates">
                <textarea value={ongoing.criticalDeadlines} onChange={e => upd('ongoingWork', { ...ongoing, criticalDeadlines: e.target.value })} className={ta} rows={3} placeholder="1 Apr — Monthly performance report due to client&#10;15 Apr — Domain renewal (auto-renews, check with billing)&#10;30 Apr — Contract renewal discussion..." />
              </Field>
              <Field label="Weekly / Recurring Tasks" hint="— things that happen on a schedule">
                <textarea value={ongoing.weeklyTasks} onChange={e => upd('ongoingWork', { ...ongoing, weeklyTasks: e.target.value })} className={ta} rows={3} placeholder="Every Monday: Send weekly traffic report from GA4&#10;Every 1st: Send HubSpot performance summary&#10;Every quarter: Review and clean HubSpot contact list..." />
              </Field>
              <Field label="Client Expectations & Relationship Notes">
                <textarea value={ongoing.clientExpectations} onChange={e => upd('ongoingWork', { ...ongoing, clientExpectations: e.target.value })} className={ta} rows={3} placeholder="Client expects same-day responses on WhatsApp. Very particular about brand colours. Don't make changes without written approval..." />
              </Field>
              <Field label="⚠️ DO NOT TOUCH" hint="— things that must not be changed">
                <textarea value={ongoing.doNotTouch} onChange={e => upd('ongoingWork', { ...ongoing, doNotTouch: e.target.value })} className={ta} rows={3} placeholder="DO NOT update Elementor — it breaks the homepage layout&#10;DO NOT touch the 'Loyalty Members' HubSpot list — it feeds a payment integration..." />
              </Field>
              <Field label="General Notes">
                <textarea value={ongoing.notes} onChange={e => upd('ongoingWork', { ...ongoing, notes: e.target.value })} className={ta} rows={3} placeholder="Anything else the next person needs to know…" />
              </Field>
            </div>
          )}

          {/* ─── ROLE SPECIFIC ─── */}
          {tab === 7 && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Role-Specific Details</p>
                <p className="text-xs text-slate-500">Fill in the sections relevant to this person&apos;s role: {memberRole}</p>
              </div>

              {/* PM Section */}
              <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">📋 Project Management</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="PM Tool Used"><input value={role.pmTool} onChange={e => upd('roleSpecific', { ...role, pmTool: e.target.value })} className={ic} placeholder="e.g. Asana, Jira, ClickUp, Notion" /></Field>
                  <Field label="Project Board URL"><input value={role.pmUrl} onChange={e => upd('roleSpecific', { ...role, pmUrl: e.target.value })} className={ic} placeholder="https://app.asana.com/..." /></Field>
                </div>
                <Field label="Meeting Cadence with Client"><input value={role.meetingCadence} onChange={e => upd('roleSpecific', { ...role, meetingCadence: e.target.value })} className={ic} placeholder="e.g. Weekly Monday 3pm GST via Google Meet" /></Field>
                <Field label="Reporting Schedule"><input value={role.reportingSchedule} onChange={e => upd('roleSpecific', { ...role, reportingSchedule: e.target.value })} className={ic} placeholder="e.g. Monthly report on 1st, Quarterly review in March/June/Sep/Dec" /></Field>
                <Field label="Key Stakeholders (client side)"><textarea value={role.stakeholders} onChange={e => upd('roleSpecific', { ...role, stakeholders: e.target.value })} className={ta} rows={2} placeholder="CEO: John Smith (decisions). Marketing Manager: Lisa (day-to-day). Finance: Bill (invoices)." /></Field>
                <Field label="Current Project Status / Phase"><textarea value={role.projectStatus} onChange={e => upd('roleSpecific', { ...role, projectStatus: e.target.value })} className={ta} rows={2} placeholder="In Phase 2 of 3. Phase 1 (discovery) complete. Phase 2 (build) 60% done. Phase 3 (launch) starts May." /></Field>
              </div>

              {/* Designer Section */}
              <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">🎨 Design Assets</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Figma / Design Tool URL"><input value={role.figmaUrl} onChange={e => upd('roleSpecific', { ...role, figmaUrl: e.target.value })} className={ic} placeholder="https://figma.com/file/..." /></Field>
                  <Field label="Brand Guidelines URL"><input value={role.brandGuidelinesUrl} onChange={e => upd('roleSpecific', { ...role, brandGuidelinesUrl: e.target.value })} className={ic} placeholder="https://..." /></Field>
                </div>
                <Field label="Assets Location" hint="— where are the raw files?"><input value={role.assetsLocation} onChange={e => upd('roleSpecific', { ...role, assetsLocation: e.target.value })} className={ic} placeholder="e.g. Google Drive > Clients > TechNova > Assets" /></Field>
                <Field label="Design Notes"><textarea value={role.designNotes} onChange={e => upd('roleSpecific', { ...role, designNotes: e.target.value })} className={ta} rows={2} placeholder="Client is very particular about using exactly #FF6B00 (not orange). Always use Proxima Nova..." /></Field>
              </div>

              {/* Integration Specialist Section */}
              <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">🔌 Integration Architecture</h4>
                <Field label="Integration Architecture Overview"><textarea value={role.integrationArchitecture} onChange={e => upd('roleSpecific', { ...role, integrationArchitecture: e.target.value })} className={ta} rows={4} placeholder="HubSpot → Zapier → Mailchimp (new contact trigger)&#10;WooCommerce → HubSpot native integration (deal creation on purchase)&#10;Typeform → HubSpot via webhook (lead gen forms)..." /></Field>
                <Field label="Data Flow Notes"><textarea value={role.dataFlowNotes} onChange={e => upd('roleSpecific', { ...role, dataFlowNotes: e.target.value })} className={ta} rows={3} placeholder="Contacts created in WooCommerce sync to HubSpot every 15min. HubSpot is the source of truth for contact data..." /></Field>
                <Field label="Webhook / API Endpoints"><textarea value={role.webhookDetails} onChange={e => upd('roleSpecific', { ...role, webhookDetails: e.target.value })} className={ta} rows={3} placeholder="HubSpot webhook: https://clientsite.com/wp-json/hs/v1/webhook&#10;Zapier webhook: https://hooks.zapier.com/hooks/catch/..." /></Field>
                <Field label="API / Integration Notes"><textarea value={role.apiNotes} onChange={e => upd('roleSpecific', { ...role, apiNotes: e.target.value })} className={ta} rows={2} placeholder="HubSpot API key is in LastPass. Zapier is on the agency account — don't delete the Zaps..." /></Field>
              </div>

              {/* Developer Section */}
              <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">💻 Development</h4>
                <Field label="Code Standards / Conventions"><textarea value={role.codeStandards} onChange={e => upd('roleSpecific', { ...role, codeStandards: e.target.value })} className={ta} rows={2} placeholder="Uses BEM for CSS. PHP follows PSR-12. All JS in vanilla (no jQuery)..." /></Field>
                <Field label="Build / Compile Process"><textarea value={role.buildProcess} onChange={e => upd('roleSpecific', { ...role, buildProcess: e.target.value })} className={ta} rows={2} placeholder="npm run build compiles SCSS and JS. Webpack config in webpack.config.js..." /></Field>
                <Field label="Testing Notes"><textarea value={role.testingNotes} onChange={e => upd('roleSpecific', { ...role, testingNotes: e.target.value })} className={ta} rows={2} placeholder="Test on Chrome, Safari, Firefox. Mobile breakpoints: 375, 768, 1024, 1440px..." /></Field>
              </div>

              {/* Team Lead Section */}
              <div className="border border-gray-100 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-semibold text-gray-700">👥 Team Lead Context</h4>
                <Field label="Team Structure for this Client"><textarea value={role.teamStructure} onChange={e => upd('roleSpecific', { ...role, teamStructure: e.target.value })} className={ta} rows={2} placeholder="PM: Priya, Dev: James, Designer: Lena. Client account contact: Sarah (escalation)..." /></Field>
                <Field label="Escalation Path"><input value={role.escalationPath} onChange={e => upd('roleSpecific', { ...role, escalationPath: e.target.value })} className={ic} placeholder="e.g. Account Manager → Team Lead → Agency Director" /></Field>
                <Field label="Decision-Making Authority"><textarea value={role.decisionAuthority} onChange={e => upd('roleSpecific', { ...role, decisionAuthority: e.target.value })} className={ta} rows={2} placeholder="Cover person can approve changes up to AED 5,000. Anything above needs Director sign-off..." /></Field>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
