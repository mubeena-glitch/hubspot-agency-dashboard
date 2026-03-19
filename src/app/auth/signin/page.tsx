'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, ensureSeedData } from '@/lib/storage';
import { ClipboardList } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('sarah@agency.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { ensureSeedData(); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const user = auth.login(email, password);
    if (user) { router.push('/'); }
    else { setError('Invalid credentials. Password is: password123'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Handover Hub</h1>
              <p className="text-sm text-gray-500">Agency Transition Management</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-600 mb-2">Demo accounts — password: <code className="bg-gray-200 px-1 rounded">password123</code></p>
            {['sarah@agency.com (Admin)', 'marcus@agency.com (Integration Specialist)', 'priya@agency.com (PM)', 'lena@agency.com (Designer)', 'james@agency.com (Developer)'].map(a => (
              <p key={a} className="text-xs text-gray-500 font-mono">{a}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
