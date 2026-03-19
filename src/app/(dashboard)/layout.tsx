'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, ensureSeedData } from '@/lib/storage';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    ensureSeedData();
    if (!auth.isLoggedIn()) router.push('/auth/signin');
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">{children}</div>
    </div>
  );
}
