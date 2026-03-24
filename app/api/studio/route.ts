import { put, list } from "@vercel/blob";
import { NextResponse } from "next/server";

const BLOB_PATH = "studio/data.json";

async function getExistingBlob(): Promise<string | null> {
  const { blobs } = await list({ prefix: "studio/" });
  const match = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!match) return null;
  const res = await fetch(match.url);
  return res.ok ? res.text() : null;
}

export async function GET() {
  try {
    const raw = await getExistingBlob();
    if (!raw) {
      return NextResponse.json({ brands: [], projects: [], templates: [] });
    }
    return NextResponse.json(JSON.parse(raw));
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
    await put(BLOB_PATH, JSON.stringify(data), {
      access: "public",
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
