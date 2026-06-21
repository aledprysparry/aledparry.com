import { NextRequest, NextResponse } from 'next/server';

// AI Social Media Agent for the graphics engine. Tasks: improve copy,
// auto-fill from a topic, captions + hashtags, design critique. Calls
// Claude via the REST API (same pattern as /api/ai). 503 if no key.

const MODEL = 'claude-sonnet-4-20250514';

interface Body {
  task: 'improve' | 'autofill' | 'captions' | 'critique' | 'review-layout' | 'clip-analysis';
  brand?: { name?: string; toneNotes?: string; colours?: string[]; fonts?: string[] };
  platform?: string;
  texts?: string[];
  topic?: string;
  // clip-analysis: a video/audio transcript to mine for short-form moments
  transcript?: string;
  // clip-analysis (optional): a production brief. When absent the AI works in
  // "discovery" mode from the content alone; when present it also judges fit.
  brief?: string;
  // review-layout: base64 data-URL images of each slide + the format
  images?: string[];
  ratio?: string;
  slideLabels?: string[];
}

function buildPrompt(b: Body): { system: string; user: string } {
  const brand = b.brand ?? {};
  const brandCtx = `Brand: ${brand.name || 'Unnamed'}. Tone: ${brand.toneNotes || 'clear, modern'}. Platform: ${b.platform || 'Instagram'}.`;
  const texts = (b.texts ?? []).filter(Boolean);
  const base = `You are a senior social-media creative director. ${brandCtx} Match the language of the existing copy (e.g. reply in Welsh if it is in Welsh). Be concise and on-brand. Respond with ONLY valid JSON, no markdown fences, no commentary.`;

  switch (b.task) {
    case 'improve':
      return {
        system: base,
        user: `Improve each line of post copy below - punchier, clearer, on-brand, similar length. Return JSON: {"items":[{"original":"...","suggestion":"..."}]} in the same order.\n\nLines:\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
      };
    case 'autofill':
      return {
        system: base,
        user: `Draft post copy for this topic: "${b.topic || ''}". Return JSON: {"headline":"short punchy headline","subheading":"one supporting line","cta":"short call to action"}.`,
      };
    case 'captions':
      return {
        system: base,
        user: `Write a social caption and hashtags for a post whose on-graphic text is below. Return JSON: {"caption":"engaging caption with a hook and 1-2 emoji","hashtags":["#tag", ...8-12 relevant tags]}.\n\nText:\n${texts.join(' / ')}`,
      };
    case 'critique':
      return {
        system: base,
        user: `Critique this post's copy for impact, clarity, hierarchy and length-for-platform. Return JSON: {"issues":[{"title":"short issue","detail":"specific actionable fix"}]} (max 5, most important first).\n\nText:\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
      };
    case 'clip-analysis': {
      const hasBrief = Boolean(b.brief && b.brief.trim());
      // Two modes: discovery (content alone) vs brief-aligned. The brief is an
      // optional enhancer — never required — so any content gives good results.
      const modeRules = hasBrief
        ? `A production brief is provided. Rank and judge each clip by how well it serves the brief (objective, audience, platform, tone, call-to-action) AS WELL AS its standalone short-form merit. For each clip add a "fit" line: how it serves the brief, or flag tension with it. "reason" stays about why the moment works on its own.`
        : `No brief is provided, and that is fine. First infer the content's own topic, angle and likely audience, then rank purely on universal short-form merit (hook strength, a self-contained payoff, emotion, clarity, a clean beginning + end). Give a specific "reason" for each. Leave "fit" as "".`;
      const briefBlock = hasBrief ? `\n\nProduction brief:\n${b.brief!.slice(0, 1500)}` : '';
      return {
        system: `You are a senior short-form social video editor. Analyse a transcript and find the strongest moments for short-form clips (Reels / TikTok / Shorts). ${modeRules} Match the transcript's language (reply in Welsh if it is in Welsh). Respond with ONLY valid JSON, no markdown, no commentary.`,
        user: `From the transcript below, return the best clips as JSON: {"summary":"one-line summary of the content","clips":[{"start":"mm:ss","end":"mm:ss","duration_seconds":0,"title":"short title","hook":"on-screen hook line","reason":"why the moment works","fit":"how it serves the brief, or \\"\\" if no brief","caption":"suggested caption","platforms":["TikTok","Instagram Reels"],"aspect_ratio":"9:16","score":0}]} — up to 6 clips, ranked best first, score 0-100.${briefBlock}\n\nTranscript:\n${(b.transcript || '').slice(0, 12000)}`,
      };
    }
    default:
      return { system: base, user: 'Return JSON: {}' };
  }
}

function parseJSON(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fallthrough */ } }
    return null;
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'not_configured', message: 'ANTHROPIC_API_KEY is not set.' }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;

    // ── vision layout review: judge each rendered slide for the format ──
    if (body.task === 'review-layout') {
      const ratio = body.ratio || 'portrait';
      const labels = body.slideLabels ?? [];
      const imgs = (body.images ?? []).slice(0, 6);
      if (!imgs.length) return NextResponse.json({ error: 'no_images' }, { status: 400 });
      const system = `You are a world-class social-media graphic designer reviewing slides of a ${ratio} carousel for the brand "${body.brand?.name || 'Unnamed'}". For EACH image judge: text legibility + overflow/clipping, element collisions, visual balance + use of space for this exact aspect ratio, hierarchy, and on-brand polish. Be specific and actionable. Respond with ONLY valid JSON, no markdown.`;
      const user = `Review these ${imgs.length} slide(s) for a ${ratio} post. Return JSON: {"slides":[{"slide":1,"label":"...","ok":true,"issues":["specific fix", ...]}],"overall":"one-line verdict"}. ok=false if anything overflows, collides, or sits poorly for this ratio.`;
      const content: unknown[] = [{ type: 'text', text: user }];
      imgs.forEach((d, i) => {
        const m = /^data:(image\/\w+);base64,(.+)$/.exec(d);
        if (m) {
          content.push({ type: 'text', text: `Slide ${i + 1}${labels[i] ? ` (${labels[i]})` : ''}:` });
          content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
        }
      });
      const vres = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 1500, system, messages: [{ role: 'user', content }] }),
      });
      const vdata = await vres.json();
      if (!vres.ok) return NextResponse.json({ error: vdata.error?.message || 'Anthropic API error' }, { status: vres.status });
      const result = parseJSON(vdata?.content?.[0]?.text ?? '');
      if (!result) return NextResponse.json({ error: 'parse_failed' }, { status: 502 });
      return NextResponse.json({ task: 'review-layout', result });
    }

    const { system, user } = buildPrompt(body);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: body.task === 'clip-analysis' ? 2200 : 1200, system, messages: [{ role: 'user', content: user }] }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Anthropic API error' }, { status: res.status });
    }
    const text = data?.content?.[0]?.text ?? '';
    const result = parseJSON(text);
    if (!result) return NextResponse.json({ error: 'parse_failed', raw: text }, { status: 502 });
    return NextResponse.json({ task: body.task, result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
