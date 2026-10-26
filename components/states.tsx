export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className='animate-pulse space-y-3' aria-busy='true' aria-label='Memuat data'>
      <div className='h-8 w-64 rounded bg-surface-2' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className='h-40 rounded-xl border border-hairline bg-surface-1' />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className='rounded-xl border border-dashed border-hairline bg-surface-1 p-6 text-center text-[14px] text-ink-muted'>
      {children}
    </p>
  );
}
