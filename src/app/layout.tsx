import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Handover Hub — Agency Handover Management',
  description: 'Complete handover documentation for agency team transitions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
