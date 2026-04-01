import { NextResponse } from "next/server";

// POST /api/gtp/scrape — fetch property data from Rightmove or Zoopla URL
export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    const isRightmove = url.includes("rightmove.co.uk");
    const isZoopla = url.includes("zoopla.co.uk");
    if (!isRightmove && !isZoopla) {
      return NextResponse.json({ error: "Only Rightmove and Zoopla URLs supported" }, { status: 400 });
    }

    // Fetch the page HTML server-side
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${res.status}` }, { status: 502 });
    }

    const html = await res.text();
    const property = isRightmove ? parseRightmove(html) : parseZoopla(html);

    return NextResponse.json({
      success: true,
      property: { ...property, rightmoveUrl: url },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Scrape failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── Rightmove parser ──
function parseRightmove(html: string) {
  const property: any = { address: "", location: "", beds: 0, type: "", tenure: "", price: "", addedDate: "", photos: [] };

  // Try PAGE_MODEL (Rightmove's client-side data)
  const pageModelMatch = html.match(/window\.PAGE_MODEL\s*=\s*({[\s\S]*?});\s*<\/script>/);
  if (pageModelMatch) {
    try {
      const pd = JSON.parse(pageModelMatch[1])?.propertyData;
      if (pd) {
        property.address = pd.address?.displayAddress || "";
        property.location = extractLocation(property.address);
        property.beds = pd.bedrooms || 0;
        property.type = pd.propertySubType || pd.propertyType || "";
        property.tenure = pd.tenure?.tenureType || "";
        property.price = pd.prices?.primaryPrice || "";
        property.photos = (pd.images || [])
          .map((img: any) => (img.url || img.srcUrl || "").replace(/_max_\d+x\d+/, "_max_2400x2400"))
          .filter(Boolean);
      }
    } catch {}
  }

  // Fallbacks from HTML
  if (!property.address) property.address = extractMeta(html, "og:title") || extractTitle(html);
  if (!property.price) property.price = firstMatch(html, /£[\d,]+/);
  if (!property.beds) property.beds = parseInt(firstMatch(html, /(\d+)\s*bed/i, 1) || "0");
  if (!property.type) property.type = capitalize(firstMatch(html, /(terraced|semi-detached|detached|flat|bungalow|end[- ]of[- ]terrace|maisonette|apartment)/i) || "");
  if (!property.tenure) property.tenure = capitalize(firstMatch(html, /(freehold|leasehold|share of freehold)/i) || "");
  if (!property.location) property.location = extractLocation(property.address);

  // Added date
  property.addedDate = firstMatch(html, /Added on (\d{2}\/\d{2}\/\d{4})/, 1) || "";

  // Photos from HTML
  if (property.photos.length === 0) {
    property.photos = extractPhotos(html, /https:\/\/media\.rightmove\.co\.uk[^"'\s]+\.(jpg|jpeg|png|webp)/gi);
  }

  return property;
}

// ── Zoopla parser ──
function parseZoopla(html: string) {
  const property: any = { address: "", location: "", beds: 0, type: "", tenure: "", price: "", addedDate: "", photos: [] };

  // Try JSON-LD
  const jsonLdMatches = Array.from(html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi));
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1]);
      if (data["@type"] === "Residence" || data["@type"] === "Product" || data["@type"] === "SingleFamilyResidence") {
        property.address = data.name || data.address?.streetAddress || "";
        property.beds = data.numberOfRooms || data.numberOfBedrooms || 0;
      }
      if (data["@type"] === "Product" && data.offers) {
        property.price = data.offers.price ? `£${Number(data.offers.price).toLocaleString()}` : "";
      }
    } catch {}
  }

  // Try Zoopla's __NEXT_DATA__ or window.__data
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const listing = nd?.props?.pageProps?.listingDetails || nd?.props?.pageProps?.data?.listing;
      if (listing) {
        property.address = listing.address?.displayAddress || listing.displayAddress || property.address;
        property.beds = listing.counts?.numBedrooms || listing.bedrooms || property.beds;
        property.type = listing.propertyType || property.type;
        property.tenure = listing.tenure || property.tenure;
        property.price = listing.pricing?.label || listing.price || property.price;
        property.photos = (listing.images || listing.photos || [])
          .map((img: any) => typeof img === "string" ? img : (img.url || img.src || img.original || ""))
          .filter(Boolean)
          .map((u: string) => u.replace(/\?.*$/, "")) // strip query params for clean URLs
          .slice(0, 30);
      }
    } catch {}
  }

  // Fallbacks from HTML
  if (!property.address) property.address = extractMeta(html, "og:title") || extractTitle(html);
  if (!property.price) property.price = firstMatch(html, /£[\d,]+/);
  if (!property.beds) property.beds = parseInt(firstMatch(html, /(\d+)\s*bed/i, 1) || "0");
  if (!property.type) property.type = capitalize(firstMatch(html, /(terraced|semi-detached|detached|flat|bungalow|end[- ]of[- ]terrace|maisonette|apartment)/i) || "");
  if (!property.tenure) property.tenure = capitalize(firstMatch(html, /(freehold|leasehold|share of freehold)/i) || "");
  if (!property.location) property.location = extractLocation(property.address);
  if (!property.addedDate) property.addedDate = firstMatch(html, /Listed on (\d{1,2}\w{0,2}\s+\w+\s+\d{4})/, 1) || "";

  // Photos from HTML
  if (property.photos.length === 0) {
    property.photos = extractPhotos(html, /https:\/\/lid\.zoocdn\.com[^"'\s]+\.(jpg|jpeg|png|webp)/gi);
  }

  return property;
}

// ── Helpers ──
function extractMeta(html: string, property: string): string {
  const match = html.match(new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, "i"));
  return match ? match[1].replace(/\s*\|.*$/, "").replace(/\s*-\s*(Rightmove|Zoopla).*$/i, "").trim() : "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s*\|.*$/, "").replace(/\s*-\s*(Rightmove|Zoopla).*$/i, "").trim() : "";
}

function extractLocation(address: string): string {
  if (!address) return "";
  const parts = address.split(",").map(s => s.trim());
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

function firstMatch(html: string, regex: RegExp, group = 0): string {
  const m = html.match(regex);
  return m ? m[group] || "" : "";
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function extractPhotos(html: string, regex: RegExp): string[] {
  const set = new Set<string>();
  for (const m of Array.from(html.matchAll(regex))) {
    set.add(m[0].replace(/_max_\d+x\d+/, "_max_2400x2400"));
  }
  return Array.from(set).slice(0, 30);
}
