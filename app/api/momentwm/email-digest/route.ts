import { NextResponse } from "next/server";
import { Resend } from "resend";
import snapshot from "../../../../components/demos/momentwm-snapshot.json";

/**
 * Weekly Momentwm email: Top 5 anniversaries next week + Top 5 coming this month.
 *
 * Triggered by a Vercel cron (daily 07:00 UTC; only actually emails on Mondays,
 * so it works on any plan). Sends via Resend to DIGEST_EMAIL_TO. Reads the same
 * bundled snapshot the embed uses, so the Welsh is already publication-draft.
 *
 *   GET ?preview=1   -> returns the email HTML (no send, no auth) for checking.
 *   GET (cron)       -> sends if it's Monday and RESEND_API_KEY is set.
 *
 * Setup (one-time, by the user): a free Resend account + RESEND_API_KEY as a
 * Vercel env var; optional DIGEST_EMAIL_TO (defaults to Aled@aledparry.com) and
 * CRON_SECRET (to allow manual ?secret= triggering). Until the key is set it
 * returns 503 not_configured.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Opp {
  candidate: { eventTitle: string; sourceUrl: string; sourceName: string };
  anniversary: { occursOn: string | null; occursYear: number; anniversaryType: string; milestoneYear: number; isRound: boolean };
  editorial: { score: number };
  drafts?: { brief?: { whyNow?: string } };
}

const MONTHS_CY = ["Ionawr", "Chwefror", "Mawrth", "Ebrill", "Mai", "Mehefin", "Gorffennaf", "Awst", "Medi", "Hydref", "Tachwedd", "Rhagfyr"];
const welshDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS_CY[m - 1]} ${y}`; };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function pick(opps: Opp[], today: number, lo: number, hi: number): Opp[] {
  const dayMs = 86400000;
  const inWin = opps.filter((o) => {
    if (!o.anniversary.occursOn) return false;
    const d = Math.round((new Date(o.anniversary.occursOn + "T00:00:00Z").getTime() - today) / dayMs);
    return d >= lo && d <= hi;
  });
  // top 5 by editorial score, then shown chronologically
  return inWin
    .sort((a, b) => b.editorial.score - a.editorial.score)
    .slice(0, 5)
    .sort((a, b) => (a.anniversary.occursOn ?? "").localeCompare(b.anniversary.occursOn ?? ""));
}

function section(title: string, items: Opp[], emptyMsg: string): string {
  const rows = items.length
    ? items.map((o) => `
        <tr><td style="padding:14px 0;border-top:1px solid #e6ddcd;">
          <div style="font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#9c9486;">${esc(welshDate(o.anniversary.occursOn!))} &middot; ${esc(o.anniversary.anniversaryType)}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#211e19;margin:3px 0 4px;">${esc(o.candidate.eventTitle)}</div>
          <div style="font-size:14px;line-height:1.5;color:#4a443b;">${esc(o.drafts?.brief?.whyNow ?? "")}</div>
          <div style="font-size:12px;margin-top:4px;"><a href="${esc(o.candidate.sourceUrl)}" style="color:#9c9486;">${esc(o.candidate.sourceName)} &#8599;</a></div>
        </td></tr>`).join("")
    : `<tr><td style="padding:12px 0;color:#9c9486;font-size:14px;">${esc(emptyMsg)}</td></tr>`;
  return `
    <h2 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:22px;color:#211e19;margin:30px 0 4px;">${esc(title)}</h2>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${rows}</table>`;
}

function buildHtml(): string {
  const opps = (snapshot as unknown as { opportunities: Opp[]; today?: string }).opportunities;
  const today = Date.now();
  const week = pick(opps, today, 0, 7);
  const month = pick(opps, today, 8, 31);
  return `<!doctype html><html lang="cy"><body style="margin:0;background:#faf6ee;font-family:-apple-system,Inter,Helvetica,Arial,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:32px 24px 48px;">
      <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#b23a2e;font-weight:600;">Momentwm</div>
      <h1 style="font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:30px;color:#211e19;margin:6px 0 2px;">Pum uchaf yr wythnos</h1>
      <p style="font-size:15px;color:#6f675b;margin:0 0 6px;">Penblwyddi a cherrig milltir Cymreig sydd ar y gorwel. Amser i gynllunio.</p>
      ${section("Yr wythnos nesaf", week, "Dim dyddiad pendant yr wythnos nesaf. Edrychwch ar y mis.")}
      ${section("Yn ystod y mis", month, "Dim byd pendant eto y mis hwn.")}
      <p style="margin:34px 0 0;font-size:13px;color:#9c9486;">
        <a href="https://www.aledparry.com/app/momentwm" style="color:#b23a2e;">Agor Momentwm &#8599;</a>
        &middot; pob penblwydd ar y radar llawn.
      </p>
    </div></body></html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  // Preview: render the email without sending (no auth, public anniversary data).
  if (url.searchParams.get("preview")) {
    return new NextResponse(buildHtml(), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Only Vercel cron (or a manual call with the right secret) may actually send.
  const isCron = request.headers.get("x-vercel-cron") === "1";
  const secretOk = !!process.env.CRON_SECRET && url.searchParams.get("secret") === process.env.CRON_SECRET;
  if (!isCron && !secretOk) return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 401 });

  // Weekly: a daily cron, but only email on Mondays (so it works on any plan).
  const force = url.searchParams.get("force") === "1";
  if (!force && new Date().getUTCDay() !== 1) {
    return NextResponse.json({ ok: true, skipped: "not Monday" });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: "not_configured", message: "RESEND_API_KEY is not set yet." }, { status: 503 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.DIGEST_EMAIL_TO || "aled@aledparry.com";
    const { data, error } = await resend.emails.send({
      from: "Momentwm <momentwm@aledparry.com>",
      to,
      subject: "Momentwm — pum uchaf yr wythnos a'r mis",
      html: buildHtml(),
    });
    if (error) return NextResponse.json({ ok: false, error }, { status: 502 });
    return NextResponse.json({ ok: true, id: data?.id, to });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String((e as Error)?.message || e) }, { status: 500 });
  }
}
