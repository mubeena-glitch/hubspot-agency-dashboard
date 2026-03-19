'use client';
import { useEffect, useState } from 'react';
import { accounts, users, type HubSpotAccount } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const INDUSTRIES = ['SaaS','E-commerce','Healthcare','Construction','Media','Analytics','Finance','Retail','Education','Other'];
const STATUSES: HubSpotAccount['status'][] = ['ACTIVE','AT_RISK','ONBOARDING','CHURNED'];

interface NewForm {
  name: string;
  hubspotPortalId: string;
  industry: string;
  status: HubSpotAccount['status'];
  mrr: number;
  assignedManagerId: string;
  notes: string;
}

export default function AccountsAdmin() {
  const [list, setList] = useState<HubSpotAccount[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HubSpotAccount>>({});
  const [showNew, setShowNew] = useState(false);
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [newForm, setNewForm] = useState<NewForm>({
    name: '', hubspotPortalId: '', industry: 'SaaS',
    status: 'ACTIVE', mrr: 0, assignedManagerId: '', notes: ''
  });

  const reload = () => {
    setList(accounts.all());
    const ul = users.all();
    setUserList(ul);
    const um: Record<string, string> = {};
    ul.forEach(u => { um[u.id] = u.name; });
    setUserMap(um);
    if (!newForm.assignedManagerId && ul.length > 0) {
      setNewForm(f => ({ ...f, assignedManagerId: ul[0].id }));
    }
  };

  useEffect(reload, []);

  const startEdit = (a: HubSpotAccount) => { setEditing(a.id); setEditForm(a); };
  const saveEdit = () => {
    if (editing) { accounts.update(editing, editForm); setEditing(null); reload(); }
  };
  const createAcc = (e: React.FormEvent) => {
    e.preventDefault();
    accounts.create(newForm);
    setShowNew(false);
    reload();
  };

  const ic = 'border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Accounts ({list.length})</h3>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add Account
        </button>
      </div>

      {showNew && (
        <form onSubmit={createAcc} className="p-4 bg-orange-50 border-b border-orange-100 flex flex-wrap gap-3 items-end">
          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <input required placeholder="Name" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} className={ic} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Portal ID</p>
            <input required placeholder="Portal ID" value={newForm.hubspotPortalId} onChange={e => setNewForm(f => ({ ...f, hubspotPortalId: e.target.value }))} className={ic} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Industry</p>
            <select value={newForm.industry} onChange={e => setNewForm(f => ({ ...f, industry: e.target.value }))} className={ic}>
              {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <select value={newForm.status} onChange={e => setNewForm(f => ({ ...f, status: e.target.value as HubSpotAccount['status'] }))} className={ic}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">MRR</p>
            <input type="number" min="0" placeholder="MRR" value={newForm.mrr} onChange={e => setNewForm(f => ({ ...f, mrr: Number(e.target.value) }))} className={ic} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Manager</p>
            <select value={newForm.assignedManagerId} onChange={e => setNewForm(f => ({ ...f, assignedManagerId: e.target.value }))} className={ic}>
              {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded"><Check className="w-4 h-4" /></button>
          <button type="button" onClick={() => setShowNew(false)} className="border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded"><X className="w-4 h-4" /></button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Name','Portal ID','Status','MRR','Manager','Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(a => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                {editing === a.id ? (
                  <>
                    <td className="px-5 py-3"><input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={ic} /></td>
                    <td className="px-5 py-3"><input value={editForm.hubspotPortalId || ''} onChange={e => setEditForm(f => ({ ...f, hubspotPortalId: e.target.value }))} className={ic} /></td>
                    <td className="px-5 py-3">
                      <select value={editForm.status || 'ACTIVE'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as HubSpotAccount['status'] }))} className={ic}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3"><input type="number" value={editForm.mrr ?? 0} onChange={e => setEditForm(f => ({ ...f, mrr: Number(e.target.value) }))} className={`${ic} w-24`} /></td>
                    <td className="px-5 py-3">
                      <select value={editForm.assignedManagerId || ''} onChange={e => setEditForm(f => ({ ...f, assignedManagerId: e.target.value }))} className={ic}>
                        {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={saveEdit} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">#{a.hubspotPortalId}</td>
                    <td className="px-5 py-3 text-sm">{a.status}</td>
                    <td className="px-5 py-3 text-sm font-semibold">{formatCurrency(a.mrr)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{userMap[a.assignedManagerId] || '—'}</td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={() => startEdit(a)} className="text-gray-400 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { accounts.remove(a.id); reload(); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
