'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, ensureSeedData } from '@/lib/storage';

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
    else { setError('Invalid credentials. Password: password123'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #9354FF 0%, #6B35CC 60%, #4A1FA8 100%)' }}>
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* NEXA Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 overflow-hidden p-2" style={{ background: '#E9DDFF' }}>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQDIrcT_zWeHX-8WAYX8x9b_MveprKSWGEgQ&s"
                alt="NEXA"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Handover Hub</h1>
            <p className="text-sm text-gray-400 mt-1">by NEXA · Team Transition Management</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#9354FF' } as React.CSSProperties}
                onFocus={e => { e.target.style.borderColor = '#9354FF'; e.target.style.boxShadow = '0 0 0 3px #E9DDFF'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none"
                onFocus={e => { e.target.style.borderColor = '#9354FF'; e.target.style.boxShadow = '0 0 0 3px #E9DDFF'; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                required />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 text-sm"
              style={{ background: loading ? '#B388FF' : 'linear-gradient(135deg, #9354FF, #7B3FE4)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: '#F5F0FF' }}>
            <p className="text-xs font-semibold text-gray-600 mb-2">Demo accounts — password: <code className="bg-white px-1.5 py-0.5 rounded" style={{ color: '#9354FF' }}>password123</code></p>
            {['sarah@agency.com (Admin)', 'marcus@agency.com (Integration Specialist)', 'priya@agency.com (PM)', 'lena@agency.com (Designer)', 'james@agency.com (Developer)'].map(a => (
              <p key={a} className="text-xs text-gray-500 font-mono leading-relaxed">{a}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
