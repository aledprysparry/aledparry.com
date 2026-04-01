import { put, list, del, get } from "@vercel/blob";
import { NextResponse } from "next/server";

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
      })).reverse(); // newest first
      return NextResponse.json({ versions });
    } catch {
      return NextResponse.json({ versions: [] });
    }
  }

  // Load a specific snapshot
  if (url.searchParams.has("load")) {
    try {
      const pathname = url.searchParams.get("load")!;
      const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
      const match = blobs.find((b) => b.pathname === pathname);
      if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const content = await fetchBlob(match.url);
      if (!content) return NextResponse.json({ error: "Failed to read" }, { status: 500 });
      return NextResponse.json(JSON.parse(content));
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  // Load all saved brands
  if (url.searchParams.has("brands")) {
    try {
      const { blobs } = await list({ prefix: BRAND_PREFIX });
      const brands = [];
      for (const b of blobs) {
        const content = await fetchBlob(b.url);
        if (content) brands.push(JSON.parse(content));
      }
      return NextResponse.json({ brands });
    } catch {
      return NextResponse.json({ brands: [] });
    }
  }

  // Load a specific project by ID
  if (url.searchParams.has("project")) {
    try {
      const projectId = url.searchParams.get("project")!;
      const { blobs } = await list({ prefix: PROJECT_PREFIX + projectId + "/" });
      if (!blobs.length) return NextResponse.json({ project: null });
      const content = await fetchBlob(blobs[blobs.length - 1].url);
      if (!content) return NextResponse.json({ project: null });
      return NextResponse.json({ project: JSON.parse(content) });
    } catch {
      return NextResponse.json({ project: null });
    }
  }

  // List all saved projects (metadata only)
  if (url.searchParams.has("projects")) {
    try {
      const { blobs } = await list({ prefix: PROJECT_PREFIX });
      const projects = blobs.map((b) => ({
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
        size: b.size,
      }));
      return NextResponse.json({ projects });
    } catch {
      return NextResponse.json({ projects: [] });
    }
  }

  // Default: return latest
  try {
    const raw = await getLatest();
    if (!raw) {
      return NextResponse.json({ brands: [], projects: [], templates: [] });
    }
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ brands: [], projects: [], templates: [] });
  }
}

// POST /api/studio?project=ID — save a single project (small payload)
// POST /api/studio — auto-save all (overwrites latest)
// POST /api/studio?snapshot=Name — save as named snapshot + update latest
export async function POST(req: Request) {
  try {
    const reqUrl = new URL(req.url);
    const projectId = reqUrl.searchParams.get("project");
    const snapshotName = reqUrl.searchParams.get("snapshot");

    // Per-brand save
    const brandId = reqUrl.searchParams.get("brand");
    if (brandId) {
      const body = await req.json();
      const json = JSON.stringify(body);
      const { blobs } = await list({ prefix: BRAND_PREFIX + brandId + "/" });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
      await put(BRAND_PREFIX + brandId + "/data.json", json, { access: "private" });
      return NextResponse.json({ ok: true, size: json.length });
    }

    // Per-project save — small, fast, no 413 risk
    if (projectId) {
      const body = await req.json();
      const json = JSON.stringify(body);
      // Delete old version of this project
      const { blobs } = await list({ prefix: PROJECT_PREFIX + projectId + "/" });
      if (blobs.length > 0) await del(blobs.map((b) => b.url));
      // Save new version
      await put(PROJECT_PREFIX + projectId + "/data.json", json, { access: "private" });
      return NextResponse.json({ ok: true, size: json.length });
    }

    const body = await req.json();
    const data = {
      brands: body.brands || [],
      projects: body.projects || [],
      templates: body.templates || [],
    };
    const json = JSON.stringify(data);

    // Always update latest (delete old, write new)
    const { blobs: latestBlobs } = await list({ prefix: LATEST_PREFIX });
    if (latestBlobs.length > 0) {
      await del(latestBlobs.map((b) => b.url));
    }
    await put(LATEST_PREFIX + "data.json", json, { access: "private" });

    // If snapshot requested, also save a timestamped copy
    if (snapshotName) {
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = snapshotName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
      await put(`${SNAPSHOT_PREFIX}${ts}_${safeName}.json`, json, {
        access: "private",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/studio?delete=<pathname> — delete a snapshot
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const pathname = url.searchParams.get("delete");
    if (!pathname) return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
    const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
    const match = blobs.find((b) => b.pathname === pathname);
    if (match) await del([match.url]);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
// trigger redeploy Tue Mar 24 21:31:05 GMT 2026
