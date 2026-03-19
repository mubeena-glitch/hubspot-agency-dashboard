'use client';
import TopBar from '@/components/layout/TopBar';
import { Settings, Download, Upload, Trash2 } from 'lucide-react';

export default function AdminPage() {
  const exportData = () => {
    const data: Record<string, unknown> = {};
    ['hh_members','hh_clients','hh_packages','hh_client_handovers'].forEach(k => {
      data[k] = JSON.parse(localStorage.getItem(k) || '[]');
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `handover-hub-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
        window.location.reload();
      } catch { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (confirm('Clear ALL data? This cannot be undone.')) {
      ['hh_members','hh_clients','hh_packages','hh_client_handovers','hh_auth'].forEach(k => localStorage.removeItem(k));
      window.location.href = '/auth/signin';
    }
  };

  return (
    <div>
      <TopBar title="Admin" />
      <div className="p-6 max-w-xl">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900">System Settings</h2>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          <button onClick={exportData} className="w-full flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4 text-indigo-500" /> Export all data as JSON backup
          </button>
          <label className="w-full flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4 text-green-500" /> Import data from JSON backup
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
          <button onClick={clearAll} className="w-full flex items-center gap-3 border border-red-200 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Clear all data and reset
          </button>
        </div>
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-blue-700 mb-2">To enable AI Transcript Processing:</p>
          <p className="text-xs text-blue-600">Add <code className="bg-blue-100 px-1 rounded">ANTHROPIC_API_KEY</code> to your Vercel environment variables. Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="underline">console.anthropic.com</a></p>
        </div>
      </div>
    </div>
  );
}
