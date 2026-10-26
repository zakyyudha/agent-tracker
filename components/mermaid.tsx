'use client';

import { useEffect, useId, useState } from 'react';

// Mermaid client-side: dynamic import agar tidak membebani bundle awal.
// Menggunakan state SVG + dangerouslySetInnerHTML agar rekonsiliasi DOM React
// tidak bentrok (mencegah error: Failed to execute 'removeChild' on 'Node').
export function Mermaid({ code }: { code: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');

  useEffect(() => {
    let cancelled = false;
    // Gunakan ID unik per eksekusi render untuk menghindari tabrakan ID SVG di Mermaid
    const renderId = `mermaid_${rawId}_${Date.now()}`;

    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          themeVariables: {
            darkMode: true,
            background: '#14161a',
            primaryColor: '#1d2126',
            primaryTextColor: '#ffffff',
            primaryBorderColor: 'rgba(178, 182, 189, 0.2)',
            lineColor: '#38c3d4',
            secondaryColor: '#2a2f36',
            tertiaryColor: '#14161a',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
          },
        });

        const cleanCode = code.trim();
        const { svg: renderedSvg } = await mermaid.render(renderId, cleanCode);
        if (cancelled) return;

        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (!cancelled) {
          setError(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      // Bersihkan node temporer yang mungkin ditinggalkan mermaid di document.body
      const tempEl = document.getElementById(`d${renderId}`) ?? document.getElementById(renderId);
      if (tempEl && tempEl.parentNode) {
        try {
          tempEl.parentNode.removeChild(tempEl);
        } catch {
          // ignore
        }
      }
    };
  }, [code, rawId]);

  if (error) {
    return (
      <div className='my-3 rounded-lg border border-hairline bg-surface-1 p-3'>
        <div className='mb-1 flex items-center justify-between'>
          <span className='text-[11px] font-semibold uppercase tracking-wider text-st-in-review'>
            Diagram Mermaid (Sumber Teks)
          </span>
          <span className='text-[10px] text-ink-subtle'>Render error</span>
        </div>
        <pre className='overflow-x-auto text-[12px] text-ink-muted font-mono'>{code}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className='my-3 flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 p-4 text-[12px] text-ink-subtle animate-pulse'>
        <span className='h-2 w-2 rounded-full bg-st-in-progress' />
        <span>Memuat diagram visual...</span>
      </div>
    );
  }

  return (
    <div
      className='my-3 overflow-x-auto rounded-lg border border-hairline bg-surface-1 p-4 [&_svg]:mx-auto [&_svg]:max-w-full'
      role='img'
      aria-label='Diagram mermaid'
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
