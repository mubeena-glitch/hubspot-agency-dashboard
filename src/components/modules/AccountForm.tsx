
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { accounts, users, type HubSpotAccount } from "@/lib/storage";
import { ArrowLeft } from "lucide-react";

const INDUSTRIES = ["SaaS","E-commerce","Healthcare","Construction","Media","Analytics","Finance","Retail","Education","Other"];
const STATUSES = ["ACTIVE","AT_RISK","ONBOARDING","CHURNED"] as const;

export default function AccountFormPage({ isNew }: { isNew?: boolean }) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [form, setForm] = useState({ name:"", hubspotPortalId:"", industry:"SaaS", status:"ACTIVE" as HubSpotAccount["status"], mrr:0, assignedManagerId:"", notes:"" });
  const [teamUsers, setTeamUsers] = useState<{ id:string; name:string }[]>([]);

  useEffect(() => {
    const us = users.all();
    setTeamUsers(us);
    if (!isNew && id) {
      const acc = accounts.get(id);
      if (acc) setForm({ name:acc.name, hubspotPortalId:acc.hubspotPortalId, industry:acc.industry, status:acc.status, mrr:acc.mrr, assignedManagerId:acc.assignedManagerId, notes:acc.notes });
    } else if (us.length > 0) {
      setForm(f => ({ ...f, assignedManagerId: us[0].id }));
    }
  }, [id, isNew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      accounts.create(form);
    } else if (id) {
      accounts.update(id, form);
    }
    router.push("/accounts");
  };

  const F = ({ label, children }: { label:string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div>
      <TopBar title={isNew ? "New Account" : "Edit Account"} />
      <div className="p-6 max-w-2xl">
        <Link href="/accounts" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <F label="Account Name"><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className={inputClass} /></F>
              <F label="HubSpot Portal ID"><input required value={form.hubspotPortalId} onChange={e=>setForm(f=>({...f,hubspotPortalId:e.target.value}))} className={inputClass} /></F>
              <F label="Industry">
                <select value={form.industry} onChange={e=>setForm(f=>({...f,industry:e.target.value}))} className={inputClass}>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
              </F>
              <F label="Status">
                <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as HubSpotAccount["status"]}))} className={inputClass}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="MRR ($)"><input type="number" min="0" value={form.mrr} onChange={e=>setForm(f=>({...f,mrr:Number(e.target.value)}))} className={inputClass} /></F>
              <F label="Assigned Manager">
                <select value={form.assignedManagerId} onChange={e=>setForm(f=>({...f,assignedManagerId:e.target.value}))} className={inputClass}>
                  {teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </F>
            </div>
            <F label="Notes"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3} className={inputClass} /></F>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors">{isNew ? "Create Account" : "Save Changes"}</button>
              <Link href="/accounts" className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium px-6 py-2 rounded-lg text-sm transition-colors">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

