import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NEXA Handover Hub',
  description: 'Complete handover documentation for NEXA team transitions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Poppins', sans-serif" }} className="bg-[#F5F0FF] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
