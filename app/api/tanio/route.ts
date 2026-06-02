import { list, put, del } from "@vercel/blob";
import { NextResponse } from "next/server";

/* ============================================================
   Tanio demo – shared order store backed by Vercel Blob.
   One JSON blob per order under `tanio/orders/<id>.json`, so
   concurrent orders never clobber each other (each create is an
   independent write). This gives the demo cross-device sync
   without any external database – it uses aledparry's own Blob
   store (BLOB_READ_WRITE_TOKEN, already configured on Vercel).

   Blobs are public (demo data only: name, numberplate, items).
   ============================================================ */

export const dynamic = "force-dynamic"; // never cache this route
export const runtime = "nodejs";

const PREFIX = "tanio/orders/";

const putOpts = {
  access: "public" as const,
  addRandomSuffix: false,
  allowOverwrite: true,
  contentType: "application/json",
  cacheControlMaxAge: 0, // keep the CDN from serving stale order JSON
};

async function readAll() {
  const { blobs } = await list({ prefix: PREFIX });
  const orders = await Promise.all(
    blobs.map(async (b) => {
      try {
        const r = await fetch(b.url, { cache: "no-store" });
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    })
  );
  return orders
    .filter(Boolean)
    .sort((a: any, b: any) => (a.placed_at < b.placed_at ? 1 : -1));
}

export async function GET() {
  try {
    return NextResponse.json({ orders: await readAll() });
  } catch (e: any) {
    // No token / Blob unavailable: report empty so the client can fall back.
    return NextResponse.json({ orders: [], error: String(e?.message || e) }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const order = await req.json();
    if (!order?.id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    await put(`${PREFIX}${order.id}.json`, JSON.stringify(order), putOpts);
    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ error: "missing id/status" }, { status: 400 });
    const { blobs } = await list({ prefix: `${PREFIX}${id}.json` });
    if (!blobs.length) return NextResponse.json({ error: "not found" }, { status: 404 });
    const r = await fetch(blobs[0].url, { cache: "no-store" });
    const order = await r.json();
    order.status = status;
    await put(`${PREFIX}${id}.json`, JSON.stringify(order), putOpts);
    return NextResponse.json({ order });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 503 });
  }
}

export async function DELETE() {
  try {
    const { blobs } = await list({ prefix: PREFIX });
    if (blobs.length) await del(blobs.map((b) => b.url));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 503 });
  }
}
