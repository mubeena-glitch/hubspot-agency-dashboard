'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { clients, type Client } from '@/lib/storage';
import { Plus, Edit2, Trash2, Check, X, ExternalLink } from 'lucide-react';

const ic = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full';
const INDUSTRIES = ['SaaS','E-commerce','Healthcare','Real Estate','Construction','Education','Retail','Media','Finance','Hospitality','Other'];

export default function ClientsPage() {
  const [list, setList] = useState<Client[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', industry: 'SaaS', website: '', notes: '' });

  const reload = () => setList(clients.all());
  useEffect(reload, []);

  const createClient = (e: React.FormEvent) => {
    e.preventDefault();
    clients.create(newForm);
    setShowNew(false);
    setNewForm({ name: '', industry: 'SaaS', website: '', notes: '' });
    reload();
  };
  const saveEdit = () => {
    if (editing) { clients.update(editing, editForm); setEditing(null); reload(); }
  };

  return (
    <div>
      <TopBar title="Clients" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {showNew && (
          <form onSubmit={createClient} className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">New Client</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-600 mb-1">Client Name</label><input required placeholder="Client Name" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} className={ic} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Industry</label>
                <select value={newForm.industry} onChange={e => setNewForm(f => ({ ...f, industry: e.target.value }))} className={ic}>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div><label className="block text-xs text-gray-600 mb-1">Website</label><input placeholder="https://..." value={newForm.website} onChange={e => setNewForm(f => ({ ...f, website: e.target.value }))} className={ic} /></div>
              <div><label className="block text-xs text-gray-600 mb-1">Notes</label><input placeholder="Any notes" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} className={ic} /></div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg">Add Client</button>
              <button type="button" onClick={() => setShowNew(false)} className="border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              {editing === c.id ? (
                <div className="space-y-2">
                  <input placeholder="Name" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={ic} />
                  <select value={editForm.industry || 'SaaS'} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} className={ic}>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                  <input placeholder="Website" value={editForm.website || ''} onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))} className={ic} />
                  <input placeholder="Notes" value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={ic} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="text-green-600 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Save</button>
                    <button onClick={() => setEditing(null)} className="text-gray-400 text-sm flex items-center gap-1"><X className="w-4 h-4" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{c.industry}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(c.id); setEditForm(c); }} className="text-gray-300 hover:text-indigo-500"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { clients.remove(c.id); reload(); }} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />{c.website}</a>}
                  {c.notes && <p className="text-xs text-gray-500 mt-1">{c.notes}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
