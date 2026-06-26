import { NextRequest, NextResponse } from "next/server";
import { getSession, buanConfigured } from "@/lib/buan/auth";

// Buan AI menu import: a photo of a physical/printed menu -> draft items the
// staff dashboard can review and save. Adapts the in-repo Anthropic vision
// pattern (app/api/ai/social/route.ts, template-from-image): base64 image ->
// Claude vision -> structured JSON. Returns DRAFTS only; it never writes to the
// catalogue (the manager confirms + saves via the Supabase Product store).
//
// Auth: once Supabase auth is live (buanConfigured), a signed-in session is
// required (this proxies a paid API). Before that, it is open in dev so the
// flow can be tried with just ANTHROPIC_API_KEY set.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6"; // same model the social vision route uses

interface DraftItem {
  name: string;
  price_pennies: number;
  category: string | null;
  description: string | null;
  allergens?: string[];
}

function parseJSON(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Gate behind a signed-in session whenever auth is available.
  if (buanConfigured() && !(await getSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured", message: "ANTHROPIC_API_KEY is not set." }, { status: 503 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { image?: string };
    const m = body.image ? /^data:(image\/\w+);base64,(.+)$/.exec(body.image) : null;
    if (!m) return NextResponse.json({ error: "no_image", message: "Send { image: <base64 data-URL> }." }, { status: 400 });

    const system = `You are a precise menu-digitising assistant for a food/drink business. You read a photo of a physical or printed menu (a board, card, chalkboard or sheet) and transcribe it into structured data. Transcribe ONLY what is actually visible - never invent items or prices. Keep each item's text in the language it is printed in (Welsh stays Welsh). Convert every price to integer pennies (e.g. "£3.20" -> 320, "£4" -> 400); if an item has no visible price use 0. Group sensibly with a short category (e.g. Coffee, Kitchen, Bakery, Drinks) inferred from the menu's own sections or the item type. Never use em-dashes. Respond with ONLY valid JSON, no markdown fences, no commentary.`;
    const user = `Extract the menu from this image. Return JSON exactly:
{"items":[{"name":"item name","price_pennies":0,"category":"short category or null","description":"short description if printed, else null","allergens":["only if explicitly shown"]}],"notes":"one short line if some text was unreadable, else \\"\\""}
Order items as they appear on the menu.`;

    const content: unknown[] = [
      { type: "text", text: user },
      { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
    ];

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages: [{ role: "user", content }] }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Anthropic API error" }, { status: res.status });
    }

    const parsed = parseJSON(data?.content?.[0]?.text ?? "") as { items?: DraftItem[]; notes?: string } | null;
    if (!parsed || !Array.isArray(parsed.items)) {
      return NextResponse.json({ error: "parse_failed" }, { status: 502 });
    }
    // Normalise: keep only sane drafts, clamp pennies to integers.
    const items: DraftItem[] = parsed.items
      .filter((it) => it && typeof it.name === "string" && it.name.trim())
      .map((it) => ({
        name: String(it.name).trim(),
        price_pennies: Math.max(0, Math.round(Number(it.price_pennies) || 0)),
        category: it.category ? String(it.category).trim() : null,
        description: it.description ? String(it.description).trim() : null,
        allergens: Array.isArray(it.allergens) ? it.allergens.map(String) : undefined,
      }));

    return NextResponse.json({ items, notes: parsed.notes || "" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
