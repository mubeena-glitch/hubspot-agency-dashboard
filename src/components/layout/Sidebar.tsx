'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LayoutDashboard, FileText, Users, Building2, Settings, LogOut } from 'lucide-react';
import { auth } from '@/lib/storage';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/handovers', label: 'Handover Files', icon: FileText },
  { href: '/team', label: 'Team Members', icon: Users },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = () => { auth.logout(); router.push('/auth/signin'); };

  return (
    <aside className="w-60 min-h-screen bg-slate-900 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Handover Hub</p>
            <p className="text-slate-400 text-xs">Transition Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800')}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-800">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <LogOut className="w-4 h-4" />Sign Out
        </button>
      </div>
    </aside>
  );
}
