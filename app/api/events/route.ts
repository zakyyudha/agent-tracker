import { subscribe } from '@/lib/watch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// SSE: satu arah server → client. Event `changed` dikirim saat kanban.db berubah.
export async function GET() {
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: NodeJS.Timeout | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* stream sudah ditutup */
        }
      };

      send(`retry: 3000\n\n`);
      send(`event: ready\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

      unsubscribe = subscribe(() => {
        send(`event: changed\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
      });

      heartbeat = setInterval(() => send(`: ping\n\n`), 25_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
