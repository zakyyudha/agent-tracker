import { NextRequest } from 'next/server';
import { getBoard, type BoardFilters } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const filters: BoardFilters = {
    status: (sp.get('status') ?? '').split(',').filter(Boolean),
    q: sp.get('q') ?? undefined,
    brd: sp.get('brd') ?? undefined,
    sprint: sp.get('sprint') ?? undefined,
    assignee: sp.get('assignee') ?? undefined,
  };
  try {
    return Response.json(getBoard(filters));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'gagal membaca kanban.db';
    return Response.json({ error: message }, { status: 500 });
  }
}
