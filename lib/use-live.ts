'use client';

// Hook realtime: dengar SSE /api/events, panggil onChange (debounced) saat DB berubah.
import { useEffect, useRef } from 'react';

export function useLive(onChange: () => void) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    const source = new EventSource('/api/events');
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cb.current(), 200);
    };
    source.addEventListener('changed', trigger);
    return () => {
      source.removeEventListener('changed', trigger);
      source.close();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
