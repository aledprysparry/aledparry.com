import { list, put, get, del } from "@vercel/blob";
import { NextResponse } from "next/server";

/**
 * Shared "saved / tagged" store for Momentwm, backed by Vercel Blob (same
 * pattern as the Tanio demo, using aledparry's BLOB_READ_WRITE_TOKEN). One
 * private JSON blob per opportunity under `momentwm/saves/<id>.json`, so
 * concurrent saves never clobber each other. This is what lets the team see
 * what's already being looked at — it's shared, not per-browser.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PREFIX = "momentwm/saves/";
const putOpts = { access: "private" as const, allowOverwrite: true, contentType: "application/json" };

interface SaveRec {
  id: string;
  saved: boolean;
  status: string | null; // e.g. "dan-sylw" | "wedi-hawlio" | "wedi-gwneud"
  by: string | null; // optional display name
  title: string;
  sourceUrl: string;
  occursYear: number;
  updatedAt: string;
}

async function readOne(pathname: string): Promise<SaveRec | null> {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || !res.stream) return null;
  try {
    return (await new Response(res.stream).json()) as SaveRec;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    const recs = (await Promise.all(blobs.map((b) => readOne(b.pathname).catch(() => null)))).filter(Boolean) as SaveRec[];
    const saves: Record<string, SaveRec> = {};
    for (const r of recs) saves[r.id] = r;
    return NextResponse.json({ saves });
  } catch (e) {
    // Blob not configured / unreachable: behave like an empty store (UI degrades to read-only).
    return NextResponse.json({ saves: {}, error: String((e as Error)?.message || e) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const id = String(b?.id || "");
    if (!id || !/^[a-z0-9-]+$/i.test(id) || id.length > 80) {
      return NextResponse.json({ error: "bad id" }, { status: 400 });
    }
    const rec: SaveRec = {
      id,
      saved: !!b.saved,
      status: b.status ? String(b.status).slice(0, 24) : null,
      by: b.by ? String(b.by).slice(0, 40) : null,
      title: String(b.title || "").slice(0, 200),
      sourceUrl: String(b.sourceUrl || "").slice(0, 400),
      occursYear: Number(b.occursYear) || 0,
      updatedAt: new Date().toISOString(),
    };
    await put(`${PREFIX}${id}.json`, JSON.stringify(rec), putOpts);
    return NextResponse.json({ rec });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 });
  }
}

// Full removal — used when a story is fully un-saved (no save, no status).
export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id || !/^[a-z0-9-]+$/i.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
    const { blobs } = await list({ prefix: `${PREFIX}${id}.json` });
    await Promise.all(blobs.map((b) => del(b.url)));
    return NextResponse.json({ removed: true, id });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error)?.message || e) }, { status: 500 });
  }
}
