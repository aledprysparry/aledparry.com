import { list, put, del, get } from "@vercel/blob";
import { NextResponse } from "next/server";

/* ============================================================
   Tanio demo – shared order store backed by Vercel Blob.
   One JSON blob per order under `tanio/orders/<id>.json`, so
   concurrent orders never clobber each other (each create is an
   independent write). This gives the demo cross-device sync
   without any external database – it uses aledparry's own Blob
   store (BLOB_READ_WRITE_TOKEN, already configured on Vercel).

   The store is PRIVATE: blobs are written and read with the
   token (via get(..., { access: 'private' })), never exposed by
   public URL, so customer names / numberplates stay server-side.
   ============================================================ */

export const dynamic = "force-dynamic"; // never cache this route
export const runtime = "nodejs";

const PREFIX = "tanio/orders/";
const putOpts = {
  access: "private" as const,
  allowOverwrite: true,
  contentType: "application/json",
};

async function readOne(pathname: string) {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || !res.stream) return null;
  try {
    return await new Response(res.stream).json();
  } catch {
    return null;
  }
}

async function readAll() {
  const { blobs } = await list({ prefix: PREFIX });
  const orders = await Promise.all(
    blobs.map((b) => readOne(b.pathname).catch(() => null))
  );
  return orders
    .filter(Boolean)
    .sort((a: any, b: any) => (a.placed_at < b.placed_at ? 1 : -1));
}

export async function GET() {
  try {
    return NextResponse.json({ orders: await readAll() });
  } catch (e: any) {
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
    const order = await readOne(`${PREFIX}${id}.json`);
    if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
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
