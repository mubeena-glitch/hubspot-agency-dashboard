'use client';
import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { users, accounts, type User } from '@/lib/storage';

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  ACCOUNT_MANAGER: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-600',
};

export default function TeamPage() {
  const [team, setTeam] = useState<User[]>([]);
  const [accountCountMap, setAccountCountMap] = useState<Record<string, number>>({});

  useEffect(() => {
    setTeam(users.all());
    const counts: Record<string, number> = {};
    accounts.all().forEach(a => { counts[a.assignedManagerId] = (counts[a.assignedManagerId] || 0) + 1; });
    setAccountCountMap(counts);
  }, []);

  return (
    <div>
      <TopBar title="Team" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map(u => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-700 font-bold">{u.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role]}`}>{u.role.replace('_', ' ')}</span>
                <span className="text-xs text-gray-500">{u.department}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Accounts assigned: <span className="font-semibold text-gray-900">{accountCountMap[u.id] || 0}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
