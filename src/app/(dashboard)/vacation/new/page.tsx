'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { vacations, users, type VacationPlan } from '@/lib/storage';
import { ArrowLeft } from 'lucide-react';

interface VacationForm {
  userId: string;
  coverageUserId: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: VacationPlan['status'];
}

export default function NewVacationPage() {
  const router = useRouter();
  const [form, setForm] = useState<VacationForm>({
    userId: '', coverageUserId: '', startDate: '', endDate: '', notes: '', status: 'PENDING'
  });
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const us = users.all();
    setUserList(us);
    if (us.length > 0) {
      setForm(f => ({ ...f, userId: us[0].id, coverageUserId: us[0].id }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    vacations.create({
      ...form,
      startDate: form.startDate + 'T00:00:00Z',
      endDate: form.endDate + 'T00:00:00Z',
    });
    router.push('/vacation');
  };

  const ic = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div>
      <TopBar title="New Vacation Plan" />
      <div className="p-6 max-w-xl">
        <Link href="/vacation" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
              <select required value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} className={ic}>
                {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Person</label>
              <select required value={form.coverageUserId} onChange={e => setForm(f => ({ ...f, coverageUserId: e.target.value }))} className={ic}>
                {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" required value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={ic} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg text-sm">Create Plan</button>
              <Link href="/vacation" className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
