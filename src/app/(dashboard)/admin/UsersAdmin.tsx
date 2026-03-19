'use client';
import { useEffect, useState } from 'react';
import { users, type User, type UserRole } from '@/lib/storage';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const ROLES: UserRole[] = ['ADMIN','MANAGER','ACCOUNT_MANAGER','VIEWER'];
const DEPTS = ['Management','Sales','Client Success','Operations','Finance','Marketing'];

interface NewUserForm {
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export default function UsersAdmin() {
  const [list, setList] = useState<User[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [newForm, setNewForm] = useState<NewUserForm>({
    name: '', email: '', role: 'VIEWER', department: 'Operations'
  });

  const reload = () => setList(users.all());
  useEffect(reload, []);

  const startEdit = (u: User) => { setEditing(u.id); setEditForm(u); };
  const saveEdit = () => {
    if (editing) { users.update(editing, editForm); setEditing(null); reload(); }
  };
  const createUser = (e: React.FormEvent) => {
    e.preventDefault();
    users.create(newForm);
    setShowNew(false);
    setNewForm({ name: '', email: '', role: 'VIEWER', department: 'Operations' });
    reload();
  };

  const ic = 'border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Users ({list.length})</h3>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
          <Plus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      {showNew && (
        <form onSubmit={createUser} className="p-4 bg-orange-50 border-b border-orange-100 flex flex-wrap gap-3 items-end">
          <div>
            <p className="text-xs text-gray-500 mb-1">Name</p>
            <input required placeholder="Name" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} className={ic} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <input required placeholder="Email" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} className={ic} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <select value={newForm.role} onChange={e => setNewForm(f => ({ ...f, role: e.target.value as UserRole }))} className={ic}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Department</p>
            <select value={newForm.department} onChange={e => setNewForm(f => ({ ...f, department: e.target.value }))} className={ic}>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded"><Check className="w-4 h-4" /></button>
          <button type="button" onClick={() => setShowNew(false)} className="border border-gray-200 text-gray-500 text-xs px-3 py-1.5 rounded"><X className="w-4 h-4" /></button>
        </form>
      )}

      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Name','Email','Role','Department','Actions'].map(h => (
              <th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map(u => (
            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
              {editing === u.id ? (
                <>
                  <td className="px-5 py-3"><input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={ic} /></td>
                  <td className="px-5 py-3"><input value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={ic} /></td>
                  <td className="px-5 py-3">
                    <select value={editForm.role || ''} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))} className={ic}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select value={editForm.department || ''} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className={ic}>
                      {DEPTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 flex gap-2">
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                    <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.role}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{u.department}</td>
                  <td className="px-5 py-3 flex gap-2">
                    <button onClick={() => startEdit(u)} className="text-gray-400 hover:text-orange-500"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { users.remove(u.id); reload(); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
