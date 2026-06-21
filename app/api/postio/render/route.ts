import { NextRequest, NextResponse } from 'next/server';
import { requireGate } from '@/lib/postioGate';

// ═══ Postio P3a - video render proxy ═══
// FFmpeg cannot run on Vercel serverless (no binary, time limits), so the cut +
// burn-in work lives in a standalone worker (Railway + Docker + ffmpeg). This
// route is the thin proxy: it forwards an authenticated render request to the
// worker and relays status polls back. It degrades to 503 (same pattern as
// app/api/postio/transcribe) until the worker env vars are set, so the feature
// ships dark and lights up the moment the operator configures it.
//
// Env: POSTIO_WORKER_URL  (e.g. https://postio-worker.up.railway.app)
//      POSTIO_WORKER_TOKEN (shared secret; must match the worker's token)

const WORKER = () => process.env.POSTIO_WORKER_URL;
const TOKEN = () => process.env.POSTIO_WORKER_TOKEN;

function configured(): boolean {
  return Boolean(WORKER() && TOKEN());
}
function workerHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN()}` } as Record<string, string>;
}
function base() {
  return String(WORKER()).replace(/\/$/, '');
}

// Kick off a render job on the worker.
export async function POST(req: NextRequest) {
  // Gate paid compute behind the server-validated client-area cookie - the
  // worker token must never be reachable by anonymous callers (same as the
  // transcribe proxy).
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!configured()) {
    return NextResponse.json(
      { error: 'not_configured', message: 'Video export is being set up. Set POSTIO_WORKER_URL and POSTIO_WORKER_TOKEN.' },
      { status: 503 },
    );
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (!body?.sourceUrl) return NextResponse.json({ error: 'bad_request', message: 'sourceUrl is required.' }, { status: 400 });
  try {
    const r = await fetch(`${base()}/render`, {
      method: 'POST',
      headers: workerHeaders(),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: 'worker_error', message: data?.message || data?.error || 'Render request failed.' }, { status: r.status });
    return NextResponse.json({ jobId: data.jobId, status: data.status || 'queued' });
  } catch (e) {
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'failed' }, { status: 502 });
  }
}

// Poll a render job; when complete the worker returns the output URL.
export async function GET(req: NextRequest) {
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!configured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'bad_request', message: 'jobId is required.' }, { status: 400 });
  try {
    const r = await fetch(`${base()}/status?jobId=${encodeURIComponent(jobId)}`, { headers: workerHeaders(), cache: 'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: 'worker_error', message: data?.message || 'Status check failed.' }, { status: r.status });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'failed' }, { status: 502 });
  }
}
