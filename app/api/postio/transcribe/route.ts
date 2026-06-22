import { NextRequest, NextResponse } from 'next/server';
import { requireGate, signJobToken, verifyJobToken } from '@/lib/postioGate';

// ═══ Postio M2b — transcription via Capsiynau's v1 API ═══
// Postio transcribes a media URL into a Capsiynau project and reads the
// transcript back via /export, so the Clip Finder transcript auto-fills.
//
// Project handling: if CAPSIYNAU_PROJECT_ID is set, Postio transcribes into
// that fixed project. If it is NOT set, Postio auto-provisions a fresh project
// per job via POST /api/v1/projects — so the integration works with just an API
// key, and each job exports from its own project (no fixed-project overwrite).
// The job's projectId is encoded into the opaque jobId token returned to the
// client, so the GET poll can export from the right project with no client
// change. 503 until CAPSIYNAU_API_URL + CAPSIYNAU_API_KEY are set.
//
// Env: CAPSIYNAU_API_URL (e.g. https://www.capsiynau.com), CAPSIYNAU_API_KEY,
//      CAPSIYNAU_PROJECT_ID (optional — a fixed project to transcribe into).

const BASE = () => process.env.CAPSIYNAU_API_URL;
const KEY = () => process.env.CAPSIYNAU_API_KEY;
const PROJECT = () => process.env.CAPSIYNAU_PROJECT_ID;

// Only the base URL + key are required now; the project is auto-provisioned.
function configured(): boolean {
  return Boolean(BASE() && KEY());
}
function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY()}` } as Record<string, string>;
}
const DONE = new Set(['complete', 'completed', 'done', 'finished']);
// Terminal failure statuses Capsiynau can report with a 200 body. Without
// this set the poller treats them as "still processing" and spins until the
// client-side timeout, hiding the real error (Codex on #72).
const FAILED = new Set(['failed', 'error', 'errored', 'cancelled', 'canceled']);

// jobId + projectId travel together in one HMAC-signed token (signJobToken /
// verifyJobToken in lib/postioGate). The signature stops a caller swapping the
// projectId to export another project (Codex IDOR on #78).

// Accept only well-formed http(s) media URLs. Rejecting junk up front avoids
// provisioning a Capsiynau project for a request that can never transcribe.
function isHttpUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch { return false; }
}

// Create a fresh Capsiynau project and return its id.
async function createProject(): Promise<string> {
  const r = await fetch(`${BASE()}/api/v1/projects`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name: `Postio ${new Date().toISOString().slice(0, 10)}` }),
    cache: 'no-store',
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.message || data?.error || 'Could not create a Capsiynau project.');
  const id = data?.id || data?.projectId || data?.project?.id;
  if (!id) throw new Error('Capsiynau did not return a project id.');
  return String(id);
}

// Best-effort delete of an auto-provisioned project so a failed transcribe
// doesn't leave an empty project behind (Codex orphan finding on #78).
async function deleteProject(id: string): Promise<void> {
  try {
    await fetch(`${BASE()}/api/v1/projects`, {
      method: 'DELETE', headers: headers(), body: JSON.stringify({ id }), cache: 'no-store',
    });
  } catch { /* non-fatal cleanup */ }
}

// Kick off a transcription job for a media URL.
export async function POST(req: NextRequest) {
  // Gate paid transcription behind the server-validated client-area cookie -
  // the server bearer key must never be reachable by anonymous callers (Codex #72).
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!configured()) {
    return NextResponse.json({ error: 'not_configured', message: 'Set CAPSIYNAU_API_URL and CAPSIYNAU_API_KEY.' }, { status: 503 });
  }
  const { fileUrl, sourceLanguage } = (await req.json().catch(() => ({}))) as { fileUrl?: string; sourceLanguage?: string };
  if (!fileUrl || !isHttpUrl(fileUrl)) {
    return NextResponse.json({ error: 'bad_request', message: 'A valid http(s) fileUrl is required.' }, { status: 400 });
  }
  // Track an auto-provisioned project so we can delete it if the transcribe
  // request is rejected (otherwise every bad job leaves an empty project).
  const fixedProject = PROJECT();
  let createdProjectId: string | null = null;
  try {
    let projectId = fixedProject;
    if (!projectId) { createdProjectId = await createProject(); projectId = createdProjectId; }
    const r = await fetch(`${BASE()}/api/v1/transcribe`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ projectId, fileUrl, sourceLanguage: sourceLanguage || 'auto' }),
      cache: 'no-store',
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (createdProjectId) await deleteProject(createdProjectId);
      return NextResponse.json({ error: 'capsiynau_error', message: data?.message || data?.error || 'Transcribe request failed.' }, { status: r.status });
    }
    return NextResponse.json({ jobId: signJobToken(data.jobId, projectId), status: data.status || 'queued' });
  } catch (e) {
    if (createdProjectId) await deleteProject(createdProjectId);
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'failed' }, { status: 502 });
  }
}

// Poll a job; when complete, return the transcript text.
export async function GET(req: NextRequest) {
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!configured()) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const token = req.nextUrl.searchParams.get('jobId');
  if (!token) return NextResponse.json({ error: 'bad_request', message: 'jobId is required.' }, { status: 400 });
  // Verify the HMAC signature before trusting the projectId — a tampered/forged
  // token (swapped projectId) is rejected rather than exporting another project.
  const verified = verifyJobToken(token);
  if (!verified?.projectId) return NextResponse.json({ error: 'bad_request', message: 'Invalid or expired job token.' }, { status: 400 });
  const { jobId, projectId } = verified;
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

    const er = await fetch(`${BASE()}/api/v1/export?projectId=${encodeURIComponent(projectId)}&format=txt`, { headers: headers(), cache: 'no-store' });
    const transcript = await er.text();
    if (!er.ok) return NextResponse.json({ error: 'export_failed', message: 'Could not fetch the transcript.' }, { status: er.status });
    return NextResponse.json({ status: 'complete', transcript });
  } catch (e) {
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'failed' }, { status: 502 });
  }
}
