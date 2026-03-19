'use client';
import { useEffect, useState } from 'react';
import { auth, type TeamMember } from '@/lib/storage';
import { ROLE_LABELS } from '@/lib/utils';

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [user, setUser] = useState<TeamMember | null>(null);
  useEffect(() => { setUser(auth.current()); }, []);

  return (
    <header className="h-16 bg-white border-b border-[#E9DDFF] flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h1>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {user && (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#E9DDFF' }}>
            <span className="font-semibold text-xs" style={{ color: '#9354FF' }}>{user.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      )}
    </header>
  );
}
