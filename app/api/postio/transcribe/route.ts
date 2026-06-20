import { NextRequest, NextResponse } from 'next/server';
import { requireGate } from '@/lib/postioGate';

// ═══ Postio M2b — transcription via Capsiynau's v1 API ═══
// Postio transcribes a media URL into a dedicated Capsiynau project
// (CAPSIYNAU_PROJECT_ID) and reads the transcript back via /export, so the
// Clip Finder transcript auto-fills. 503 until the CAPSIYNAU_* env vars are
// set. Built to Capsiynau's documented v1 contract — verify against the live
// API before relying on it (status values + the projectId/transcript model
// may need a tweak).
//
// Env: CAPSIYNAU_API_URL (e.g. https://capsiynau.com), CAPSIYNAU_API_KEY,
//      CAPSIYNAU_PROJECT_ID (a Capsiynau project Postio transcribes into).

const BASE = () => process.env.CAPSIYNAU_API_URL;
const KEY = () => process.env.CAPSIYNAU_API_KEY;
const PROJECT = () => process.env.CAPSIYNAU_PROJECT_ID;

function configured(): boolean {
  return Boolean(BASE() && KEY() && PROJECT());
}
function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY()}` } as Record<string, string>;
}
const DONE = new Set(['complete', 'completed', 'done', 'finished']);
// Terminal failure statuses Capsiynau can report with a 200 body. Without
// this set the poller treats them as "still processing" and spins until the
// client-side timeout, hiding the real error (Codex on #72).
const FAILED = new Set(['failed', 'error', 'errored', 'cancelled', 'canceled']);

// Kick off a transcription job for a media URL.
export async function POST(req: NextRequest) {
  // Gate paid transcription behind the server-validated client-area cookie -
  // the server bearer key must never be reachable by anonymous callers (Codex #72).
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!configured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Set CAPSIYNAU_API_URL, CAPSIYNAU_API_KEY and CAPSIYNAU_PROJECT_ID.' }, { status: 503 });
  }
  const { fileUrl, sourceLanguage } = (await req.json().catch(() => ({}))) as { fileUrl?: string; sourceLanguage?: string };
  if (!fileUrl) return NextResponse.json({ error: 'bad_request', message: 'fileUrl is required.' }, { status: 400 });
  try {
    const r = await fetch(`${BASE()}/api/v1/transcribe`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ projectId: PROJECT(), fileUrl, sourceLanguage: sourceLanguage || 'auto' }),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return NextResponse.json({ error: 'capsiynau_error', message: data?.message || data?.error || 'Transcribe request failed.' }, { status: r.status });
    return NextResponse.json({ jobId: data.jobId, status: data.status || 'queued' });
  } catch (e) {
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'failed' }, { status: 502 });
  }
}

// Poll a job; when complete, return the transcript text.
export async function GET(req: NextRequest) {
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!configured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const jobId = req.nextUrl.searchParams.get('jobId');
  if (!jobId) return NextResponse.json({ error: 'bad_request', message: 'jobId is required.' }, { status: 400 });
  try {
    const sr = await fetch(`${BASE()}/api/v1/status?jobId=${encodeURIComponent(jobId)}`, { headers: headers(), cache: 'no-store' });
    const s = await sr.json().catch(() => ({}));
    if (!sr.ok) return NextResponse.json({ error: 'capsiynau_error', message: s?.message || 'Status check failed.' }, { status: sr.status });
    const status = String(s.status || 'processing').toLowerCase();
    // Terminal failure: surface it immediately so the UI stops polling.
    if (FAILED.has(status)) {
      return NextResponse.json(
        { error: 'transcription_failed', status, message: s?.message || s?.error || 'Transcription failed.' },
        { status: 502 },
      );
    }
    if (!DONE.has(status)) return NextResponse.json({ status, progress: s.progress ?? null });

    const er = await fetch(`${BASE()}/api/v1/export?projectId=${encodeURIComponent(PROJECT()!)}&format=txt`, { headers: headers(), cache: 'no-store' });
    const transcript = await er.text();
    if (!er.ok) return NextResponse.json({ error: 'export_failed', message: 'Could not fetch the transcript.' }, { status: er.status });
    return NextResponse.json({ status: 'complete', transcript });
  } catch (e) {
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'failed' }, { status: 502 });
  }
}
