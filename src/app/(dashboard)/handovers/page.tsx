'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { handovers, accounts, users, type Handover } from '@/lib/storage';
import { formatDate, STATUS_COLORS } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface HandoverForm {
  accountId: string;
  fromUserId: string;
  toUserId: string;
  reason: string;
  notes: string;
  startDate: string;
  status: Handover['status'];
}

export default function HandoversPage() {
  const [list, setList] = useState<Handover[]>([]);
  const [accMap, setAccMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<HandoverForm>({
    accountId: '', fromUserId: '', toUserId: '',
    reason: '', notes: '', startDate: '', status: 'PENDING'
  });
  const [accList, setAccList] = useState<{ id: string; name: string }[]>([]);
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);

  const reload = () => {
    const hs = handovers.all();
    setList(hs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    const am: Record<string, string> = {};
    accounts.all().forEach(a => { am[a.id] = a.name; });
    setAccMap(am);
    const um: Record<string, string> = {};
    users.all().forEach(u => { um[u.id] = u.name; });
    setUserMap(um);
    setAccList(accounts.all().map(a => ({ id: a.id, name: a.name })));
    setUserList(users.all().map(u => ({ id: u.id, name: u.name })));
  };

  useEffect(reload, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    handovers.create({ ...form, status: 'PENDING' });
    setShowModal(false);
    setForm({ accountId: '', fromUserId: '', toUserId: '', reason: '', notes: '', startDate: '', status: 'PENDING' });
    reload();
  };

  const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div>
      <TopBar title="Handovers" />
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Handover
          </button>
        </div>

        <div className="space-y-3">
          {list.length === 0 && <div className="text-center text-gray-400 py-16">No handovers yet</div>}
          {list.map(h => (
            <div key={h.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{accMap[h.accountId] || '—'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{userMap[h.fromUserId]} → {userMap[h.toUserId]}</p>
                <p className="text-xs text-gray-400 mt-1">{h.reason}</p>
                {h.startDate && <p className="text-xs text-gray-400 mt-0.5">Start: {formatDate(h.startDate)}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[h.status as keyof typeof STATUS_COLORS]}`}>{h.status}</span>
                <div className="flex gap-2">
                  {h.status !== 'IN_PROGRESS' && (
                    <button onClick={() => { handovers.update(h.id, { status: 'IN_PROGRESS' }); reload(); }}
                      className="text-xs border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600">IN PROGRESS</button>
                  )}
                  {h.status !== 'COMPLETED' && (
                    <button onClick={() => { handovers.update(h.id, { status: 'COMPLETED' }); reload(); }}
                      className="text-xs border border-gray-200 px-2 py-1 rounded hover:bg-gray-50 text-gray-600">COMPLETE</button>
                  )}
                  <button onClick={() => { handovers.remove(h.id); reload(); }} className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">New Handover</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Account</label>
                <select required value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} className={ic}>
                  <option value="">Select…</option>
                  {accList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <select required value={form.fromUserId} onChange={e => setForm(f => ({ ...f, fromUserId: e.target.value }))} className={ic}>
                  <option value="">Select…</option>
                  {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <select required value={form.toUserId} onChange={e => setForm(f => ({ ...f, toUserId: e.target.value }))} className={ic}>
                  <option value="">Select…</option>
                  {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <input type="text" required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={ic} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={ic} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2 rounded-lg text-sm">Create</button>
                <button type="button" onClick={() => setShowModal(false)} className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
