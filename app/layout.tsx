import type { Metadata } from 'next';
import { SideNav } from '@/components/side-nav';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.TRACKER_TITLE || '🐴 Agent Tracker · Execution Harness',
  description:
    process.env.TRACKER_DESC ||
    'Local-first, Git-backed execution harness and Kanban engine for AI coding agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='id'>
      <body className='overflow-hidden'>
        <div className='flex h-screen flex-col md:flex-row'>
          <SideNav />
          <main className='min-h-0 min-w-0 flex-1'>{children}</main>
        </div>
      </body>
    </html>
  );
}
