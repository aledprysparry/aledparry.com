import { put, list, get } from "@vercel/blob";
import { NextResponse } from "next/server";

const LATEST_PREFIX = "gtp/latest/";
const SNAPSHOT_PREFIX = "gtp/snapshots/";

async function fetchBlob(blobUrl: string): Promise<string | null> {
  try {
    const result = await get(blobUrl, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
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

// GET /api/gtp — returns latest episodes data
// GET /api/gtp?versions=1 — returns list of saved snapshots
// GET /api/gtp?load=<pathname> — loads a specific snapshot
export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.searchParams.has("versions")) {
    try {
      const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
      const versions = blobs
        .map((b) => ({
          pathname: b.pathname,
          uploadedAt: b.uploadedAt,
          size: b.size,
          url: b.url,
        }))
        .reverse();
      return NextResponse.json({ versions });
    } catch {
      return NextResponse.json({ versions: [] });
    }
  }

  if (url.searchParams.has("load")) {
    try {
      const pathname = url.searchParams.get("load")!;
      const { blobs } = await list({ prefix: SNAPSHOT_PREFIX });
      const match = blobs.find((b) => b.pathname === pathname);
      if (!match)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      const content = await fetchBlob(match.url);
      if (!content)
        return NextResponse.json(
          { error: "Failed to read" },
          { status: 500 }
        );
      return NextResponse.json(JSON.parse(content));
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
  }

  try {
    const raw = await getLatest();
    if (!raw) {
      return NextResponse.json({ episodes: [] });
    }
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ episodes: [] });
  }
}

// POST /api/gtp — auto-save (overwrites latest)
// POST /api/gtp?snapshot=Name — save as named snapshot + update latest
export async function POST(req: Request) {
  try {
    const reqUrl = new URL(req.url);
    const snapshotName = reqUrl.searchParams.get("snapshot");

    const body = await req.json();
    const data = {
      episodes: body.episodes || [],
      activeEpisodeId: body.activeEpisodeId || null,
    };
    const json = JSON.stringify(data);

    await put(LATEST_PREFIX + "data.json", json, {
      access: "private",
      allowOverwrite: true,
    });

    if (snapshotName) {
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const safeName = snapshotName
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 50);
      await put(`${SNAPSHOT_PREFIX}${ts}_${safeName}.json`, json, {
        access: "private",
        allowOverwrite: true,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
