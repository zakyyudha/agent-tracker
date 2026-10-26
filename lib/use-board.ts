'use client';

// Satu sumber data untuk ketiga view: /api/board + SSE refetch.
import { useCallback, useEffect, useState } from 'react';
import { useLive } from './use-live';
import type { BoardResponse } from './types';

export function useBoard() {
  const [data, setData] = useState<BoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/board', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'gagal memuat data board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLive(load);

  return { data, error, loading, reload: load };
}
