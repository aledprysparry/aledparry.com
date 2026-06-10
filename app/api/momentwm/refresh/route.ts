import { NextResponse } from "next/server";

/**
 * Triggers the Momentwm "Refresh Momentwm snapshot" GitHub Action (which does
 * the ~30-min Claude regen and opens a PR in each repo). Powers the in-app
 * "Ailgynhyrchu'r data" button.
 *
 * Cost guards (this spends Claude credits): refuses if a run is already
 * in-progress or one started in the last 30 min, only accepts same-origin
 * POSTs, and the Action itself only ever opens a PR (a human merges to deploy).
 * Needs GITHUB_DISPATCH_TOKEN (a fine-grained PAT with actions:write on
 * aledprysparry/momentwm) as a Vercel env var; returns 503 until it's set.
 */
export const dynamic = "force-dynamic";

const OWNER = "aledprysparry";
const REPO = "momentwm";
const WORKFLOW = "refresh.yml";
const COOLDOWN_MS = 30 * 60 * 1000;

const GH = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "momentwm-refresh-button",
};

export async function POST(request: Request) {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, reason: "not_configured", message: "GITHUB_DISPATCH_TOKEN is not set yet." },
      { status: 503 },
    );
  }

  // Same-origin only — basic abuse guard for an unauthenticated endpoint.
  const origin = request.headers.get("origin") ?? "";
  if (origin && !/(^https?:\/\/(www\.)?aledparry\.com$)|(^https?:\/\/localhost)/.test(origin)) {
    return NextResponse.json({ ok: false, reason: "bad_origin" }, { status: 403 });
  }

  const auth = { ...GH, Authorization: `Bearer ${token}` };

  // Refuse if a run is queued/in-progress or one started within the cooldown.
  try {
    const runsRes = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=5`,
      { headers: auth, cache: "no-store" },
    );
    if (runsRes.ok) {
      const data = (await runsRes.json()) as {
        workflow_runs?: { status: string; created_at: string; html_url: string }[];
      };
      const runs = data.workflow_runs ?? [];
      const active = runs.find((r) => r.status === "queued" || r.status === "in_progress");
      if (active) {
        return NextResponse.json(
          { ok: false, reason: "in_progress", url: active.html_url, message: "A refresh is already running." },
          { status: 409 },
        );
      }
      const last = runs[0]?.created_at ? new Date(runs[0].created_at).getTime() : 0;
      if (last && Date.now() - last < COOLDOWN_MS) {
        const mins = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 60000);
        return NextResponse.json(
          { ok: false, reason: "cooldown", message: `Refreshed recently — try again in ~${mins} min.` },
          { status: 429 },
        );
      }
    }
  } catch {
    // if the pre-check fails, fall through and let the dispatch attempt decide
  }

  // Dispatch the workflow.
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    { method: "POST", headers: auth, body: JSON.stringify({ ref: "main" }) },
  );
  if (res.status === 204) {
    return NextResponse.json({
      ok: true,
      status: "dispatched",
      message: "Refresh started. It takes ~30 min, then a PR appears in each repo to review and merge.",
    });
  }
  const detail = await res.text().catch(() => "");
  return NextResponse.json(
    { ok: false, reason: "dispatch_failed", status: res.status, detail: detail.slice(0, 300) },
    { status: 502 },
  );
}
