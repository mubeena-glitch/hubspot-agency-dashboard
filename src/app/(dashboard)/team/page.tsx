'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { members, auth, type TeamMember, type UserRole } from '@/lib/storage';
import { ROLE_LABELS, isAdmin } from '@/lib/utils';
import { Plus, Edit2, Trash2, Check, X, ShieldCheck } from 'lucide-react';

const ROLES: UserRole[] = ['ADMIN','PM','INTEGRATION_SPECIALIST','DESIGNER','DEVELOPER','TEAM_LEAD','COPYWRITER','SEO_SPECIALIST','OTHER'];
const PURPLE = '#9354FF';
const LIGHT = '#E9DDFF';
const ic = 'border rounded-xl px-3 py-2 text-sm focus:outline-none w-full';

interface NewMemberForm {
  name: string; email: string; role: UserRole;
  department: string; phone: string; slack: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [list, setList] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TeamMember>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<NewMemberForm>({ name: '', email: '', role: 'PM', department: '', phone: '', slack: '' });
  const currentUser = auth.current();

  useEffect(() => {
    // Admin-only page guard
    if (currentUser && !isAdmin(currentUser.role)) {
      router.push('/');
    }
  }, [currentUser, router]);

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

  const inputStyle = { borderColor: LIGHT };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = `0 0 0 3px ${LIGHT}`; };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = LIGHT; e.target.style.boxShadow = 'none'; };

  return (
    <div>
      <TopBar title="Team Members" subtitle="Admin only — manage team" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
            <ShieldCheck className="w-4 h-4" />
            <span>Only admins can manage team members</span>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #6B35CC)` }}>
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {showNew && (
          <form onSubmit={createMember} className="rounded-2xl border p-5 mb-4 space-y-3" style={{ background: '#FBF8FF', borderColor: LIGHT }}>
            <h3 className="font-semibold text-sm" style={{ color: PURPLE }}>New Team Member</h3>
            <div className="grid grid-cols-2 gap-3">
              {([['Full Name','name','text'],['Email','email','email'],['Department','department','text'],['Phone','phone','text'],['Slack Handle','slack','text']] as [string,string,string][]).map(([label, field, type]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                  <input type={type} required={['name','email'].includes(field)} placeholder={label}
                    value={(newForm as unknown as Record<string,string>)[field] || ''}
                    onChange={e => setNewForm(f => ({ ...f, [field]: e.target.value }))}
                    className={ic} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                <select value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value as UserRole }))} className={ic} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                  {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="text-white text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: PURPLE }}>Add Member</button>
              <button type="button" onClick={() => setShowNew(false)} className="border text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50" style={{ borderColor: LIGHT }}>Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map(m => (
            <div key={m.id} className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: LIGHT }}>
              {editing === m.id ? (
                <div className="space-y-2">
                  {([['Name','name'],['Email','email'],['Department','department'],['Phone','phone'],['Slack','slack']] as [string,string][]).map(([label,field]) => (
                    <input key={field} placeholder={label} value={(editForm as Record<string,string>)[field] || ''}
                      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                      className={ic} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  ))}
                  <select value={editForm.role || 'PM'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))} className={ic} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="flex items-center gap-1 text-sm font-medium text-green-600"><Check className="w-4 h-4" />Save</button>
                    <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-gray-400"><X className="w-4 h-4" />Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: LIGHT }}>
                        <span className="font-bold text-sm" style={{ color: PURPLE }}>{m.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditing(m.id); setEditForm(m); }} className="text-gray-300 hover:text-purple-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm('Remove this team member?')) { members.remove(m.id); reload(); } }} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-lg font-semibold" style={{ background: LIGHT, color: PURPLE }}>{ROLE_LABELS[m.role]}</span>
                    {m.department && <span className="text-gray-500">{m.department}</span>}
                    {m.phone && <span className="text-gray-400">📞 {m.phone}</span>}
                    {m.slack && <span className="text-gray-400">💬 {m.slack}</span>}
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
