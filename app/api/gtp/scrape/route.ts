import { NextResponse } from "next/server";

// GET /api/gtp/scrape?img=<url> — proxy external images to avoid CORS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const imgUrl = searchParams.get("img");
    if (!imgUrl) return new NextResponse("Missing img param", { status: 400 });

    const referer = imgUrl.includes("rightmove") ? "https://www.rightmove.co.uk/" : "https://www.zoopla.co.uk/";
    const headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      "Referer": referer,
    };

    // Try the URL as-is first
    let res = await fetch(imgUrl, { headers });

    // If 2400x2400 fails, try without the size suffix
    if (!res.ok && imgUrl.includes("_max_2400x2400")) {
      const fallbackUrl = imgUrl.replace("_max_2400x2400", "_max_1024x1024");
      res = await fetch(fallbackUrl, { headers });
    }

    // If /dir/ path fails, try without /dir/
    if (!res.ok && imgUrl.includes("/dir/")) {
      const noDirUrl = imgUrl.replace("/dir/", "/");
      res = await fetch(noDirUrl, { headers });
    }

    if (!res.ok) return new NextResponse(`Image fetch failed: ${res.status}`, { status: 502 });

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": blob.type || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 500 });
  }
}

// POST /api/gtp/scrape — fetch property data from Rightmove or Zoopla URL
export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    const isRightmove = url.includes("rightmove.co.uk");
    const isZoopla = url.includes("zoopla.co.uk");
    const isOnTheMarket = url.includes("onthemarket.com");
    const isPrimeLocation = url.includes("primelocation.com");
    if (!isRightmove && !isZoopla && !isOnTheMarket && !isPrimeLocation) {
      return NextResponse.json({ error: "Supported: Rightmove, Zoopla, OnTheMarket, PrimeLocation" }, { status: 400 });
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
    const property = isRightmove ? parseRightmove(html)
      : isOnTheMarket ? parseOnTheMarket(html)
      : isPrimeLocation ? parsePrimeLocation(html)
      : parseZoopla(html);

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
  // Regex fails on large JSON (~120KB) — use bracket counting instead
  const pageModelIdx = html.indexOf("window.PAGE_MODEL = ");
  if (pageModelIdx >= 0) {
    try {
      const jsonStart = pageModelIdx + "window.PAGE_MODEL = ".length;
      let depth = 0, jsonEnd = jsonStart;
      for (let i = jsonStart; i < html.length; i++) {
        if (html[i] === "{") depth++;
        else if (html[i] === "}") { depth--; if (depth === 0) { jsonEnd = i + 1; break; } }
      }
      const pd = JSON.parse(html.substring(jsonStart, jsonEnd))?.propertyData;
      if (pd) {
        property.address = pd.address?.displayAddress || "";
        property.location = extractLocation(property.address);
        property.beds = pd.bedrooms || 0;
        property.type = pd.propertySubType || pd.propertyType || "";
        property.tenure = pd.tenure?.tenureType || "";
        property.price = pd.prices?.primaryPrice || "";
        // Only property photos, deduplicated — keep largest version of each
        // Rightmove stores 3 sizes per photo (135x100, 476x317, 656x437)
        // Each has the same hash in the filename, different size suffix
        const allUrls = (pd.images || [])
          .map((img: any) => (img.url || img.srcUrl || ""))
          .filter((u: string) => u && u.includes("/property-photo/"));
        // Group by hash (first 9+ chars of the filename), keep the longest URL (largest image)
        const byHash: Record<string, string> = {};
        for (const u of allUrls) {
          const parts = u.split("/");
          const filename = parts[parts.length - 1] || "";
          const hash = filename.replace(/[._].*/,""); // strip size suffix + extension
          if (!byHash[hash] || u.length > byHash[hash].length) byHash[hash] = u;
        }
        property.photos = Object.values(byHash).slice(0, 30);
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

  // Photos from HTML — only match property-photo paths
  if (property.photos.length === 0) {
    property.photos = extractPhotos(html, /https:\/\/media\.rightmove\.co\.uk[^"'\s]*property-photo[^"'\s]+\.(jpg|jpeg)/gi);
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

// ── OnTheMarket parser ──
function parseOnTheMarket(html: string) {
  const property: any = { address: "", location: "", beds: 0, type: "", tenure: "", price: "", addedDate: "", photos: [] };

  // Try __NEXT_DATA__
  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const listing = nd?.props?.pageProps?.property || nd?.props?.pageProps?.listing;
      if (listing) {
        property.address = listing.displayAddress || listing.address || "";
        property.beds = listing.bedrooms || listing.numberOfBedrooms || 0;
        property.type = listing.propertyType || listing.propertySubType || "";
        property.tenure = listing.tenure || "";
        property.price = listing.price || listing.priceLabel || "";
        property.photos = (listing.images || listing.photos || listing.gallery || [])
          .map((img: any) => typeof img === "string" ? img : (img.url || img.src || img.original || ""))
          .filter(Boolean).slice(0, 30);
      }
    } catch {}
  }

  // Fallbacks
  if (!property.address) property.address = extractMeta(html, "og:title") || extractTitle(html);
  if (!property.price) property.price = firstMatch(html, /£[\d,]+/);
  if (!property.beds) property.beds = parseInt(firstMatch(html, /(\d+)\s*bed/i, 1) || "0");
  if (!property.type) property.type = capitalize(firstMatch(html, /(terraced|semi-detached|detached|flat|bungalow|end[- ]of[- ]terrace|maisonette|apartment)/i) || "");
  if (!property.tenure) property.tenure = capitalize(firstMatch(html, /(freehold|leasehold|share of freehold)/i) || "");
  if (!property.location) property.location = extractLocation(property.address);

  // Photos from og:image or media CDN
  if (property.photos.length === 0) {
    const ogImage = extractMeta(html, "og:image");
    if (ogImage) property.photos.push(ogImage);
  }
  if (property.photos.length === 0) {
    property.photos = extractPhotos(html, /https:\/\/media\.onthemarket\.com\/properties[^"'\s]+\.(jpg|jpeg|png|webp)/gi);
  }

  return property;
}

// ── PrimeLocation parser (powered by Zoopla — similar data structures) ──
function parsePrimeLocation(html: string) {
  const property: any = { address: "", location: "", beds: 0, type: "", tenure: "", price: "", addedDate: "", photos: [] };

  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const nd = JSON.parse(nextDataMatch[1]);
      const listing = nd?.props?.pageProps?.listingDetails || nd?.props?.pageProps?.data?.listing || nd?.props?.pageProps?.property;
      if (listing) {
        property.address = listing.address?.displayAddress || listing.displayAddress || "";
        property.beds = listing.counts?.numBedrooms || listing.bedrooms || 0;
        property.type = listing.propertyType || "";
        property.tenure = listing.tenure || "";
        property.price = listing.pricing?.label || listing.price || "";
        property.photos = (listing.images || listing.photos || [])
          .map((img: any) => typeof img === "string" ? img : (img.url || img.src || img.original || ""))
          .filter(Boolean).slice(0, 30);
      }
    } catch {}
  }

  // Fallbacks
  if (!property.address) property.address = extractMeta(html, "og:title") || extractTitle(html);
  if (!property.price) property.price = firstMatch(html, /£[\d,]+/);
  if (!property.beds) property.beds = parseInt(firstMatch(html, /(\d+)\s*bed/i, 1) || "0");
  if (!property.type) property.type = capitalize(firstMatch(html, /(terraced|semi-detached|detached|flat|bungalow|end[- ]of[- ]terrace|maisonette|apartment)/i) || "");
  if (!property.tenure) property.tenure = capitalize(firstMatch(html, /(freehold|leasehold|share of freehold)/i) || "");
  if (!property.location) property.location = extractLocation(property.address);

  // Photos — PrimeLocation uses Zoopla's CDN
  if (property.photos.length === 0) {
    property.photos = extractPhotos(html, /https:\/\/lid\.zoocdn\.com[^"'\s]+\.(jpg|jpeg|png|webp)/gi);
  }

  return property;
}

// ── Helpers ──
function extractMeta(html: string, property: string): string {
  const match = html.match(new RegExp(`<meta[^>]*property="${property}"[^>]*content="([^"]*)"`, "i"));
  return match ? match[1].replace(/\s*\|.*$/, "").replace(/\s*-\s*(Rightmove|Zoopla|OnTheMarket|PrimeLocation).*$/i, "").trim() : "";
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].replace(/\s*\|.*$/, "").replace(/\s*-\s*(Rightmove|Zoopla|OnTheMarket|PrimeLocation).*$/i, "").trim() : "";
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
    const url = m[0];
    if (isPropertyPhoto(url)) set.add(url);
  }
  return Array.from(set).slice(0, 30);
}

// Filter: only keep actual property photos — strict whitelist approach
function isPropertyPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  // Rightmove: only accept "property-photo" paths (NOT floorplans, logos, agents, etc.)
  if (lower.includes("rightmove.co.uk")) {
    return lower.includes("property-photo");
  }
  // OnTheMarket: only accept property photo paths
  if (lower.includes("onthemarket.com")) {
    return lower.includes("properties/") || lower.includes("property-photo");
  }
  // Zoopla / PrimeLocation: accept from their photo CDN
  if (lower.includes("zoocdn.com")) {
    if (lower.includes("logo") || lower.includes("brand") || lower.includes("icon") || lower.includes("agent")) return false;
    return true;
  }
  // Generic: only accept if path clearly indicates a property photo
  if (lower.includes("property-photo") || lower.includes("property/photo")) return true;
  return false;
}
