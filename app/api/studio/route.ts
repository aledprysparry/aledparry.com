import { put, list, del, get } from "@vercel/blob";
import { NextResponse } from "next/server";

// ── CORS ──
const ALLOWED_ORIGINS = [
  "https://aledprysparry.github.io",
  "https://www.aledparry.com",
  "https://aledparry.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function withCors(req: Request) {
  const headers = corsHeaders(req);
  return function(data: unknown, opts?: { status?: number }) {
    return NextResponse.json(data, { status: opts?.status || 200, headers });
  };
}

// Preflight
export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

const LATEST_PREFIX = "studio/latest/";
const SNAPSHOT_PREFIX = "studio/snapshots/";
const PROJECT_PREFIX = "studio/projects/";
const BRAND_PREFIX = "studio/brands/";

async function fetchBlob(blobUrl: string): Promise<string | null> {
  try {
    const result = await get(blobUrl, { access: "private" });
    if (!result) return null;
    return new Response(result.stream).text();
  } catch {
    return null;
  }
}

async function getLatest(): Promise<string | null> {
  const { blobs } = await list({ prefix: LATEST_PREFIX });
  if (!blobs.length) return null;
  return fetchBlob(blobs[blobs.length - 1].url);
}

// GET /api/studio — returns latest data
// GET /api/studio?versions=1 — returns list of saved snapshots
// GET /api/studio?load=<pathname> — loads a specific snapshot
export async function GET(req: Request) {
  const json = withCors(req);
  const url = new URL(req.url);

  // List all snapshots
  if (url.searchParams.has("versions")) {
    try {
      const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
      const versions = blobs.map((b) => ({
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
        size: b.size,
        url: b.url,
      })).reverse();
      return json({ versions });
    } catch {
      return json({ versions: [] });
    }
  }

  if (url.searchParams.has("load")) {
    try {
      const pathname = url.searchParams.get("load")!;
      const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
      const match = blobs.find((b) => b.pathname === pathname);
      if (!match) return json({ error: "Not found" }, { status: 404 });
      const content = await fetchBlob(match.url);
      if (!content) return json({ error: "Failed to read" }, { status: 500 });
      return json(JSON.parse(content));
    } catch {
      return json({ error: "Failed" }, { status: 500 });
    }
  }

  if (url.searchParams.has("brands")) {
    try {
      const { blobs } = await list({ prefix: BRAND_PREFIX });
      const brands = [];
      for (const b of blobs) {
        const content = await fetchBlob(b.url);
        if (content) brands.push(JSON.parse(content));
      }
      return json({ brands });
    } catch {
      return json({ brands: [] });
    }
  }

  if (url.searchParams.has("project")) {
    try {
      const projectId = url.searchParams.get("project")!;
      const { blobs } = await list({ prefix: PROJECT_PREFIX + projectId + "/" });
      if (!blobs.length) return json({ project: null });
      const content = await fetchBlob(blobs[blobs.length - 1].url);
      if (!content) return json({ project: null });
      return json({ project: JSON.parse(content) });
    } catch {
      return json({ project: null });
    }
  }

  if (url.searchParams.has("projects")) {
    try {
      const { blobs } = await list({ prefix: PROJECT_PREFIX });
      const projects = blobs.map((b) => ({
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
        size: b.size,
      }));
      return json({ projects });
    } catch {
      return json({ projects: [] });
    }
  }

  // Default: return latest
  try {
    const raw = await getLatest();
    if (!raw) return json({ brands: [], projects: [], templates: [] });
    return json(JSON.parse(raw));
  } catch {
    return json({ brands: [], projects: [], templates: [] });
  }
}

// POST /api/studio?project=ID — save a single project (small payload)
// POST /api/studio — auto-save all (overwrites latest)
// POST /api/studio?snapshot=Name — save as named snapshot + update latest
export async function POST(req: Request) {
  const resp = withCors(req);
  try {
    const reqUrl = new URL(req.url);
    const projectId = reqUrl.searchParams.get("project");
    const snapshotName = reqUrl.searchParams.get("snapshot");

    const brandId = reqUrl.searchParams.get("brand");
    if (brandId) {
      const body = await req.json();
      const str = JSON.stringify(body);
      const { blobs } = await list({ prefix: BRAND_PREFIX + brandId + "/" });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
      await put(BRAND_PREFIX + brandId + "/data.json", str, { access: "private" });
      return resp({ ok: true, size: str.length });
    }

    if (projectId) {
      const body = await req.json();
      const str = JSON.stringify(body);
      const { blobs } = await list({ prefix: PROJECT_PREFIX + projectId + "/" });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
      await put(PROJECT_PREFIX + projectId + "/data.json", str, { access: "private" });
      return resp({ ok: true, size: str.length });
    }

    const body = await req.json();
    const data = { brands: body.brands || [], projects: body.projects || [], templates: body.templates || [] };
    const str = JSON.stringify(data);

    const { blobs: latestBlobs } = await list({ prefix: LATEST_PREFIX });
    if (latestBlobs.length > 0) await del(latestBlobs.map((b) => b.url));
    await put(LATEST_PREFIX + "data.json", str, { access: "private" });

    if (snapshotName) {
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = snapshotName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      await put(`${SNAPSHOT_PREFIX}${ts}_${safeName}.json`, str, { access: "private" });
    }

    return resp({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return resp({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const resp = withCors(req);
  try {
    const url = new URL(req.url);
    const pathname = url.searchParams.get("delete");
    if (!pathname) return resp({ error: "Missing pathname" }, { status: 400 });
    const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
    const match = blobs.find((b) => b.pathname === pathname);
    if (match) await del([match.url]);
    return resp({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return resp({ error: msg }, { status: 500 });
  }
}
