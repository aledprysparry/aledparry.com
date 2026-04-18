import { NextResponse } from "next/server";

// GET /api/gtp/map?lat=51.49&lng=-3.17&zoom=14&w=800&h=600
// Server-side proxy for OpenStreetMap static map images.
// Bypasses CORS so the image can be drawn on canvas without tainting it.
// Cached for 24 hours.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat") || "51.4816";
    const lng = searchParams.get("lng") || "-3.1791";
    const zoom = searchParams.get("zoom") || "14";
    const w = searchParams.get("w") || "800";
    const h = searchParams.get("h") || "600";

    // Use OpenStreetMap's free static map service (no API key required)
    const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${w}x${h}&maptype=mapnik`;

    const resp = await fetch(mapUrl, {
      headers: { "User-Agent": "GuessThePrice/1.0 (aledparry.com)" },
    });

    if (!resp.ok) {
      return new NextResponse("Map service error", { status: resp.status });
    }

    const body = await resp.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new NextResponse("Failed to fetch map", { status: 500 });
  }
}
