'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ArrowLeftRight, CalendarOff, AlertTriangle, UserCog, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/storage';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Users },
  { href: '/handovers', label: 'Handovers', icon: ArrowLeftRight },
  { href: '/vacation', label: 'Vacation Plans', icon: CalendarOff },
  { href: '/risks', label: 'Risk Radar', icon: AlertTriangle },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    auth.logout();
    router.push('/auth/signin');
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Agency Hub</p>
            <p className="text-gray-400 text-xs">HubSpot Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
