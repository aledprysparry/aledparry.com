import { NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUAN_LIVE } from "@/lib/buan/config";

// Buan marketing lead capture (P1). Stores to the `leads` table via PostgREST
// when Supabase is configured; otherwise accepts and logs so the form still
// works in a not-yet-wired environment.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  if (!data?.email || typeof data.email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  if (!BUAN_LIVE) {
    console.log("[buan lead] (no DB configured):", data.email);
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        business_name: data.business_name ?? null,
        business_type: data.business_type ?? null,
        existing_url: data.existing_url ?? null,
        message: data.message ?? null,
        source: "marketing",
      }),
    });
    if (!res.ok) throw new Error("rest " + res.status);
    return NextResponse.json({ ok: true, stored: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 503 });
  }
}
