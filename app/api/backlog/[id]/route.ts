import { getBacklog } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = getBacklog(decodeURIComponent(id));
    if (!data) return Response.json({ error: `backlog tidak ditemukan: ${id}` }, { status: 404 });
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'gagal membaca kanban.db';
    return Response.json({ error: message }, { status: 500 });
  }
}
