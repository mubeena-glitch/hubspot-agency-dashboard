'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { members, type TeamMember, type UserRole } from '@/lib/storage';
import { ROLE_LABELS } from '@/lib/utils';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const ROLES: UserRole[] = ['ADMIN','PM','INTEGRATION_SPECIALIST','DESIGNER','DEVELOPER','TEAM_LEAD','COPYWRITER','SEO_SPECIALIST','OTHER'];
const ic = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';

export default function TeamPage() {
  const [list, setList] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', email: '', role: 'PM' as UserRole, department: '', phone: '', slack: '' });

  const reload = () => setList(members.all());
  useEffect(reload, []);

  const createMember = (e: React.FormEvent) => {
    e.preventDefault();
    members.create(newForm);
    setShowNew(false);
    setNewForm({ name: '', email: '', role: 'PM', department: '', phone: '', slack: '' });
    reload();
  };
  const saveEdit = () => {
    if (editing) { members.update(editing, editForm); setEditing(null); reload(); }
  };

  return (
    <div>
      <TopBar title="Team Members" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {showNew && (
          <form onSubmit={createMember} className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">New Team Member</h3>
            <div className="grid grid-cols-2 gap-3">
              {([['Full Name','name'],['Email','email'],['Department','department'],['Phone','phone'],['Slack Handle','slack']] as [string,string][]).map(([label, field]) => (
                <div key={field}>
                  <label className="block text-xs text-gray-600 mb-1">{label}</label>
                  <input required={['name','email'].includes(field)} placeholder={label} value={(newForm as Record<string,string>)[field] || ''}
                    onChange={e => setNewForm(f => ({ ...f, [field]: e.target.value }))} className={ic} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-600 mb-1">Role</label>
                <select value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value as UserRole }))} className={ic}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg">Add Member</button>
              <button type="button" onClick={() => setShowNew(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {editing === m.id ? (
                <div className="space-y-2">
                  {([['Name','name'],['Email','email'],['Department','department'],['Phone','phone'],['Slack','slack']] as [string,string][]).map(([label,field]) => (
                    <input key={field} placeholder={label} value={(editForm as Record<string,string>)[field] || ''}
                      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))} className={ic} />
                  ))}
                  <select value={editForm.role || 'PM'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))} className={ic}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"><Check className="w-4 h-4" /> Save</button>
                    <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"><X className="w-4 h-4" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-700 font-bold text-sm">{m.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(m.id); setEditForm(m); }} className="text-gray-300 hover:text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { members.remove(m.id); reload(); }} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{ROLE_LABELS[m.role]}</span>
                    {m.department && <span>{m.department}</span>}
                    {m.phone && <span>📞 {m.phone}</span>}
                    {m.slack && <span>💬 {m.slack}</span>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
