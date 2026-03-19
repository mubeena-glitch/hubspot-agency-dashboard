'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Building2, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { auth } from '@/lib/storage';
import { cn, isAdmin } from '@/lib/utils';
import Image from 'next/image';

const NAV_ALL = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/handovers', label: 'Handover Files', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Building2 },
];
const NAV_ADMIN = [
  { href: '/team', label: 'Team Members', icon: Users },
  { href: '/admin', label: 'Admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = auth.current();
  const userIsAdmin = user ? isAdmin(user.role) : false;
  const handleLogout = () => { auth.logout(); router.push('/auth/signin'); };

  const navItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
    return (
      <Link key={href} href={href}
        className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
          active
            ? 'text-white shadow-md'
            : 'text-purple-200 hover:text-white hover:bg-white/10'
        )}
        style={active ? { background: 'rgba(255,255,255,0.2)' } : {}}>
        <Icon className="w-4 h-4 shrink-0" />{label}
      </Link>
    );
  };

  return (
    <aside className="w-60 min-h-screen flex flex-col shrink-0" style={{ background: 'linear-gradient(160deg, #9354FF 0%, #6B35CC 100%)' }}>
      {/* NEXA Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden p-1">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQDIrcT_zWeHX-8WAYX8x9b_MveprKSWGEgQ&s"
              alt="NEXA"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">NEXA</p>
            <p className="text-purple-200 text-xs">Handover Hub</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ALL.map(item => navItem(item))}

        {userIsAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-widest px-3">Admin</p>
            </div>
            {NAV_ADMIN.map(item => navItem(item))}
          </>
        )}
      </nav>

      {user && (
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-xs">{user.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-purple-200 text-xs truncate">{user.role.replace('_', ' ')}</p>
            </div>
            {userIsAdmin && <ShieldCheck className="w-3.5 h-3.5 text-purple-300 shrink-0" />}
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-purple-200 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
