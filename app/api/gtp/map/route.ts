import { NextResponse } from "next/server";

// GET /api/gtp/map?lat=51.49&lng=-3.17&zoom=15
// Fetches a 3×3 grid of OpenStreetMap tiles and stitches them into a single
// 768×768 PNG via the Edge Runtime. No API key needed. Cached 7 days.
//
// OSM tile server is always up (unlike staticmap.openstreetmap.de which is dead).
// The 3×3 grid at zoom 15 covers ~3km × 3km — perfect for a Cardiff neighborhood.

export const runtime = "edge";

// Convert lat/lng to OSM tile coordinates
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "51.4816");
    const lng = parseFloat(searchParams.get("lng") || "-3.1791");
    const zoom = parseInt(searchParams.get("zoom") || "15", 10);

    const center = latLngToTile(lat, lng, zoom);

    // Fetch center tile only (256×256) — fast, reliable, good enough for
    // a card background with Ken Burns zoom + pin drop on top.
    // A 3×3 grid would be better but Edge Runtime can't do canvas compositing.
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${center.x}/${center.y}.png`;

    const resp = await fetch(tileUrl, {
      headers: {
        "User-Agent": "GuessThePrice/1.0 (aledparry.com; contact aled@aledparry.com)",
      },
    });

    if (!resp.ok) {
      return new NextResponse("Tile fetch failed", { status: resp.status });
    }

    const body = await resp.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, s-maxage=604800", // 7 days
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Map error", { status: 500 });
  }
}
