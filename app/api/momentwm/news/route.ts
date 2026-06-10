import { NextResponse } from "next/server";

/**
 * Live Welsh-press headlines for the Momentwm "Newyddion" surface.
 * Browsers cannot fetch these RSS feeds cross-origin, so the embed calls
 * this route and we fetch + parse server-side. Headline + link only, never
 * article bodies. A short in-memory cache keeps us polite to the publishers.
 */
export const dynamic = "force-dynamic";

interface Headline {
  source: string;
  title: string;
  link: string;
  dateISO: string | null;
}

const FEEDS: { source: string; url: string }[] = [
  { source: "BBC Cymru Fyw", url: "https://feeds.bbci.co.uk/cymrufyw/rss.xml" },
  { source: "BBC Wales", url: "https://feeds.bbci.co.uk/news/wales/rss.xml" },
  { source: "Nation.Cymru", url: "https://nation.cymru/feed/" },
  { source: "WalesOnline", url: "https://www.walesonline.co.uk/news/?service=rss" },
  { source: "Y Cymro", url: "https://www.ycymro.cymru/feed/" },
];

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRss(xml: string): { title: string; link: string; pubDate: string }[] {
  const items: { title: string; link: string; pubDate: string }[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const raw of blocks) {
    const seg = raw.split(/<\/item>/i)[0];
    const get = (tag: string): string => {
      const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(seg);
      return m ? decode(m[1]) : "";
    };
    const title = get("title");
    const link = get("link");
    if (!title && !link) continue;
    items.push({ title, link, pubDate: get("pubDate") });
  }
  return items;
}

async function fetchHeadlines(): Promise<Headline[]> {
  const out: Headline[] = [];
  const seen = new Set<string>();
  for (const f of FEEDS) {
    try {
      const res = await fetch(f.url, {
        headers: { "User-Agent": "MomentwmBot/0.1 (editorial radar)" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      for (const it of parseRss(await res.text()).slice(0, 6)) {
        const key = it.title.toLowerCase().slice(0, 60);
        if (!it.title || !it.link || seen.has(key)) continue;
        seen.add(key);
        const d = it.pubDate ? new Date(it.pubDate) : null;
        out.push({
          source: f.source,
          title: it.title,
          link: it.link,
          dateISO: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
        });
      }
    } catch {
      // skip an unreachable feed
    }
  }
  out.sort((a, b) => (b.dateISO ?? "").localeCompare(a.dateISO ?? ""));
  return out.slice(0, 24);
}

// Light in-memory cache (per warm lambda) so rapid refreshes don't hammer feeds.
let cache: { at: number; news: Headline[] } | null = null;
const TTL = 90 * 1000;

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at > TTL) {
    const news = await fetchHeadlines();
    // keep the previous payload if a transient fetch returned nothing
    if (news.length || !cache) cache = { at: now, news };
  }
  return NextResponse.json(
    { news: cache?.news ?? [], today: new Date().toISOString().slice(0, 10) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
