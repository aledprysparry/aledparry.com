import { NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUAN_LIVE } from "@/lib/buan/config";

// Buan customer order capture (P4). Inserts into `orders` when Supabase is
// wired; otherwise accepts + simulates so the customer flow works in-browser.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function newId() {
  return "BN" + Math.floor(1000 + Math.random() * 9000);
}

export async function POST(req: Request) {
  const d = await req.json().catch(() => null);
  if (!d?.location_id || !Array.isArray(d.items)) {
    return NextResponse.json({ error: "bad order" }, { status: 400 });
  }
  const order = {
    id: newId(),
    business_id: d.business_id,
    location_id: d.location_id,
    items: d.items,
    total: d.total ?? 0,
    status: "new",
    collection_slot: d.collection_slot ?? null,
    customer_name: d.customer_name ?? null,
    customer_contact: d.customer_contact ?? null,
    placed_at: new Date().toISOString(),
  };

  if (!BUAN_LIVE) {
    console.log("[buan order] (no DB):", order.id);
    return NextResponse.json({ ok: true, stored: false, order });
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error("rest " + res.status);
    const rows = await res.json();
    return NextResponse.json({ ok: true, stored: true, order: rows[0] ?? order });
  } catch (e: any) {
    // Return the order anyway so the customer still gets a confirmation in the demo.
    return NextResponse.json({ ok: false, error: String(e?.message || e), order });
  }
}
