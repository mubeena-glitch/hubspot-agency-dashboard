'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { clients, auth, type Client } from '@/lib/storage';
import { isAdmin } from '@/lib/utils';
import { Plus, Edit2, Trash2, Check, X, ExternalLink, Building2 } from 'lucide-react';

const INDUSTRIES = ['SaaS','E-commerce','Healthcare','Real Estate','Construction','Education','Retail','Media','Finance','Hospitality','Other'];
const PURPLE = '#9354FF';
const LIGHT = '#E9DDFF';
const ic = `border rounded-xl px-3 py-2 text-sm focus:outline-none w-full`;

export default function ClientsPage() {
  const [list, setList] = useState<Client[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', industry: 'SaaS', website: '', notes: '' });
  const currentUser = auth.current();
  const userIsAdmin = currentUser ? isAdmin(currentUser.role) : false;

  const reload = () => setList(clients.all());
  useEffect(reload, []);

  const createClient = (e: React.FormEvent) => {
    e.preventDefault();
    clients.create({ ...newForm, createdById: currentUser?.id });
    setShowNew(false);
    setNewForm({ name: '', industry: 'SaaS', website: '', notes: '' });
    reload();
  };
  const saveEdit = () => {
    if (editing) { clients.update(editing, editForm); setEditing(null); reload(); }
  };

  const inputStyle = { borderColor: LIGHT };
  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = PURPLE;
    e.target.style.boxShadow = `0 0 0 3px ${LIGHT}`;
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = LIGHT;
    e.target.style.boxShadow = 'none';
  };

  return (
    <div>
      <TopBar title="Clients" subtitle="All client accounts" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Any team member can add clients here.</p>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, #6B35CC)` }}>
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {showNew && (
          <form onSubmit={createClient} className="rounded-2xl border p-5 mb-4 space-y-3" style={{ background: '#FBF8FF', borderColor: LIGHT }}>
            <h3 className="font-semibold text-sm" style={{ color: PURPLE }}>New Client</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Client Name *</label>
                <input required placeholder="e.g. TechNova Inc" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
                <select value={newForm.industry} onChange={e => setNewForm(f => ({ ...f, industry: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Website</label>
                <input placeholder="https://..." value={newForm.website} onChange={e => setNewForm(f => ({ ...f, website: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input placeholder="Any quick notes" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="text-white text-sm font-semibold px-4 py-2 rounded-xl" style={{ background: PURPLE }}>Add Client</button>
              <button type="button" onClick={() => setShowNew(false)} className="border text-gray-600 text-sm px-4 py-2 rounded-xl hover:bg-gray-50" style={{ borderColor: LIGHT }}>Cancel</button>
            </div>
          </form>
        )}

        {list.length === 0 && !showNew && (
          <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: LIGHT }}>
            <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: LIGHT }} />
            <p className="text-gray-500 font-medium">No clients yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first client to start creating handover files</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: LIGHT }}>
              {editing === c.id ? (
                <div className="space-y-2">
                  <input placeholder="Name" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  <select value={editForm.industry || 'SaaS'} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                  <input placeholder="Website" value={editForm.website || ''} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  <input placeholder="Notes" value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={ic} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-800"><Check className="w-4 h-4" />Save</button>
                    <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"><X className="w-4 h-4" />Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: LIGHT, color: PURPLE }}>{c.industry}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(c.id); setEditForm(c); }} className="text-gray-300 hover:text-purple-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      {/* Only admin can delete */}
                      {userIsAdmin && (
                        <button onClick={() => { clients.remove(c.id); reload(); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 hover:underline mt-1" style={{ color: PURPLE }}>
                      <ExternalLink className="w-3 h-3" />{c.website}
                    </a>
                  )}
                  {c.notes && <p className="text-xs text-gray-400 mt-1">{c.notes}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
