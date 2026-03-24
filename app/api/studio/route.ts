import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_PREFIX = "studio/";

async function getExistingBlob(): Promise<{ url: string; content: string } | null> {
  const { blobs } = await list({ prefix: BLOB_PREFIX });
  if (!blobs.length) return null;
  // Get the most recent blob
  const blob = blobs[blobs.length - 1];
  const res = await fetch(blob.url);
  if (!res.ok) return null;
  return { url: blob.url, content: await res.text() };
}

export async function GET() {
  try {
    const existing = await getExistingBlob();
    if (!existing) {
      return NextResponse.json({ brands: [], projects: [], templates: [] });
    }
    return NextResponse.json(JSON.parse(existing.content));
  } catch {
    return NextResponse.json({ brands: [], projects: [], templates: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = {
      brands: body.brands || [],
      projects: body.projects || [],
      templates: body.templates || [],
    };

    // Delete old blobs first to avoid accumulation
    const { blobs } = await list({ prefix: BLOB_PREFIX });
    if (blobs.length > 0) {
      await del(blobs.map((b) => b.url));
    }

    // Write new blob (with random suffix — simpler, always works)
    await put("studio/data.json", JSON.stringify(data), {
      access: "public",
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
