import { put, get } from "@vercel/blob";
import { NextResponse } from "next/server";

const LIVE_PATH = "gtp/live/state.json";
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" };
const DEFAULT_STATE = { asset: "intro", round: 1, S: {}, scores: [0, 0], agents: ["Agent 1", "Agent 2"], ts: 0 };

async function getLiveState(): Promise<string | null> {
  try {
    const result = await get(LIVE_PATH, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return new Response(result.stream).text();
  } catch {
    return null;
  }
}

// GET /api/gtp/live — returns current live display state
export async function GET() {
  try {
    const raw = await getLiveState();
    if (!raw) return NextResponse.json(DEFAULT_STATE, { headers: NO_CACHE });
    return NextResponse.json(JSON.parse(raw), { headers: NO_CACHE });
  } catch {
    return NextResponse.json(DEFAULT_STATE, { headers: NO_CACHE });
  }
}

// POST /api/gtp/live — update live display state
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const state = {
      asset: body.asset || "intro",
      round: body.round || 1,
      S: body.S || {},
      scores: body.scores || [0, 0],
      agents: body.agents || ["Agent 1", "Agent 2"],
      agentImages: body.agentImages || ["", ""],
      logoImage: body.logoImage || "",
      photos: body.photos || [],
      heroPhotoIndex: body.heroPhotoIndex || 0,
      roundData: body.roundData || null,
      ts: body.ts || Date.now(),
    };
    const json = JSON.stringify(state);

    await put(LIVE_PATH, json, {
      access: "private",
      allowOverwrite: true,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
