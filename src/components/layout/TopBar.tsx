'use client';
import { useEffect, useState } from 'react';
import { auth, type TeamMember } from '@/lib/storage';
import { ROLE_LABELS } from '@/lib/utils';

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [user, setUser] = useState<TeamMember | null>(null);
  useEffect(() => { setUser(auth.current()); }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {user && (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-700 font-semibold text-xs">{user.name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      )}
    </header>
  );
}
