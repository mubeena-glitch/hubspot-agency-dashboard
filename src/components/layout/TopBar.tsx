'use client';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { auth, type User } from '@/lib/storage';

export default function TopBar({ title }: { title: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(auth.currentUser());
  }, []);

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-700 font-semibold text-xs">{user.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
