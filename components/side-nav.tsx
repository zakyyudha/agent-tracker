'use client';

// Shell: sidebar nav (desktop) / tab bar atas (mobile). Konten full-width, tanpa kotak terpusat.
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/kanban', label: 'Kanban' },
  { href: '/requirements', label: 'Index Requirement' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function SideNav() {
  const pathname = usePathname() ?? '/';

  return (
    <>
      {/* Sidebar desktop */}
      <aside className='hidden h-screen w-[220px] shrink-0 flex-col justify-between border-r border-hairline px-4 py-6 md:flex'>
        <nav className='flex flex-col gap-1' aria-label='Navigasi tracker'>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-[13px] transition ${
                isActive(pathname, item.href)
                  ? 'bg-surface-2 font-semibold text-ink'
                  : 'text-ink-muted hover:bg-surface-1 hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className='space-y-1 px-3 text-[11px] leading-relaxed text-ink-subtle'>
          <p className='font-semibold uppercase tracking-[0.6px] text-ink-muted'>
            {process.env.NEXT_PUBLIC_TRACKER_PROJECT || 'Agent Tracker'}
          </p>
          <p>{process.env.NEXT_PUBLIC_TRACKER_SUBTITLE || 'Local-first Execution Harness'}</p>
          <p>Single source of truth: kanban.db</p>
        </div>
      </aside>

      {/* Tab bar mobile */}
      <nav
        className='flex items-center gap-1 border-b border-hairline px-4 py-2 md:hidden'
        aria-label='Navigasi tracker'
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-[13px] ${
              isActive(pathname, item.href)
                ? 'bg-surface-2 font-semibold text-ink'
                : 'text-ink-muted'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <span className='ml-auto text-[11px] text-ink-subtle'>
          {process.env.NEXT_PUBLIC_TRACKER_PROJECT || 'Agent Tracker'}
        </span>
      </nav>
    </>
  );
}
