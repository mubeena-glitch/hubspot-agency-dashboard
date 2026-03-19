'use client';
import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { ShieldCheck } from 'lucide-react';

// Import sub-panels lazily per tab
import dynamic from 'next/dynamic';

const UsersAdmin = dynamic(() => import('./UsersAdmin'), { ssr: false });
const AccountsAdmin = dynamic(() => import('./AccountsAdmin'), { ssr: false });

const TABS = ['Users', 'Accounts', 'Data'];

export default function AdminPage() {
  const [tab, setTab] = useState('Users');

  return (
    <div>
      <TopBar title="Admin Panel" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Users' && <UsersAdmin />}
        {tab === 'Accounts' && <AccountsAdmin />}
        {tab === 'Data' && <DataAdmin />}
      </div>
    </div>
  );
}

function DataAdmin() {
  const handleClear = () => {
    if (confirm('Clear ALL data? This cannot be undone.')) {
      ['hs_users','hs_accounts','hs_handovers','hs_tasks','hs_vacations'].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    ['hs_users','hs_accounts','hs_handovers','hs_tasks','hs_vacations'].forEach(k => {
      data[k] = JSON.parse(localStorage.getItem(k) || '[]');
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'dashboard-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
        window.location.reload();
      } catch { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
      <h3 className="font-semibold text-gray-900 mb-4">Data Management</h3>
      <div className="space-y-3">
        <button onClick={handleExport} className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
          📥 Export all data as JSON
        </button>
        <label className="block w-full text-left border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
          📤 Import data from JSON
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        <button onClick={handleClear} className="w-full text-left border border-red-200 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
          🗑️ Clear all data (reset to seed)
        </button>
      </div>
    </div>
  );
}
