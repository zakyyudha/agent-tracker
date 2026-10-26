import Link from 'next/link';

export function Crumb({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className='text-ink-muted hover:text-ink'>
      {children}
    </Link>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className='text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-subtle'>
        {label}
      </dt>
      <dd className='mt-1 text-[13px] text-ink-muted'>{children}</dd>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='rounded-lg border border-hairline bg-surface-1 p-4'>
      <h2 className='mb-3 text-[11px] font-semibold uppercase tracking-[0.6px] text-ink-muted'>
        {title}
      </h2>
      {children}
    </section>
  );
}
