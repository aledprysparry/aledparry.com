import { put, get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "edge";

const LIVE_PATH = "gtp/live/state.json";
const NO_CACHE = { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" };
const DEFAULT_STATE = { asset: "intro", round: 1, S: {}, scores: [0, 0], agents: ["Agent 1", "Agent 2"], ts: 0 };

// In-memory cache — persists across requests within the same Edge isolate
let cachedState: string | null = null;
let cachedTs = 0;

// GET /api/gtp/live — returns current live display state (from cache or blob)
export async function GET(req: Request) {
  try {
    // If we have a recent cache (< 5s old), serve it instantly
    if (cachedState && (Date.now() - cachedTs) < 5000) {
      return new NextResponse(cachedState, {
        headers: { ...NO_CACHE, "Content-Type": "application/json" },
      });
    }

    // Otherwise fetch from blob
    const result = await get(LIVE_PATH, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json(DEFAULT_STATE, { headers: NO_CACHE });
    }
    const raw = await new Response(result.stream).text();
    cachedState = raw;
    cachedTs = Date.now();
    return new NextResponse(raw, {
      headers: { ...NO_CACHE, "Content-Type": "application/json" },
    });
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

    // Update in-memory cache immediately
    cachedState = json;
    cachedTs = Date.now();

    // Persist to blob in background (don't block the response)
    const blobPromise = put(LIVE_PATH, json, {
      access: "private",
      allowOverwrite: true,
    }).catch(() => {});

    // Return immediately — don't wait for blob write
    const response = NextResponse.json({ ok: true });

    // Wait for blob write to complete before the response is fully sent
    // Using waitUntil-style pattern: fire and forget
    blobPromise;

    return response;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
