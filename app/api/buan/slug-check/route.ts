import { NextResponse } from "next/server";
import { isValidSlug, isReservedSlug } from "@/lib/buan/config";
import { isSlugAvailable } from "@/lib/buan/api";

// Buan slug availability (P2). Checks format + reserved words + (when a DB is
// wired) uniqueness. Used live by the onboarding wizard.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get("slug") || "").toLowerCase().trim();
  if (!slug) return NextResponse.json({ available: false, reason: "empty" });
  if (isReservedSlug(slug)) return NextResponse.json({ available: false, reason: "reserved" });
  if (!isValidSlug(slug)) return NextResponse.json({ available: false, reason: "invalid" });
  try {
    const available = await isSlugAvailable(slug);
    return NextResponse.json({ available, reason: available ? "ok" : "taken" });
  } catch {
    return NextResponse.json({ available: true, reason: "unchecked" });
  }
}
