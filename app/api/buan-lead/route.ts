import { NextResponse } from "next/server";

/* ============================================================
   Buan early-access lead capture – STUB endpoint.

   Phase 1 marketing only: this route accepts the early-access
   form payload, logs it server-side, and returns 200. It does
   NOT persist anything or notify anyone yet – there is no
   backend, database, CRM or email wired up.

   A real implementation would validate + store the lead (or
   forward it to a CRM / Resend) here. Until then this exists so
   the form has a real submit target rather than a dead action.
   ============================================================ */

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Ignore malformed bodies – this is a stub, not a strict API.
  }

  // STUB: log only a non-PII breadcrumb. We deliberately do NOT log the
  // submitted name / email / business / message – the UI says nothing is
  // stored yet, and writing PII to server logs (which hosts often retain or
  // forward) would contradict that. businessType is a fixed-choice category,
  // not personal data.
  // eslint-disable-next-line no-console
  console.log("[Buan] early-access lead received (stub, not persisted)", {
    businessType: typeof body.businessType === "string" ? body.businessType : "unspecified",
    hasMessage: Boolean(body.message),
  });

  return NextResponse.json({ ok: true, stub: true });
}
