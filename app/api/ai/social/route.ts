import { NextRequest, NextResponse } from 'next/server';
import { requireGate } from '@/lib/postioGate';

// AI Social Media Agent for the graphics engine. Tasks: improve copy,
// auto-fill from a topic, captions + hashtags, design critique. Calls
// Claude via the REST API (same pattern as /api/ai). 503 if no key.

const MODEL = 'claude-sonnet-4-20250514';

// clip-analysis only sees this many characters of the transcript. Longer
// podcasts/videos exceed it, so the response flags when it was truncated and
// the UI can tell the user only the first segment was analysed (Codex on #70).
const CLIP_TRANSCRIPT_LIMIT = 12000;

interface Body {
  task: 'improve' | 'autofill' | 'captions' | 'critique' | 'review-layout' | 'clip-analysis' | 'social-copy' | 'template-from-image';
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
  // template-from-image: one base64 data-URL design + how faithful to be
  image?: string;
  mode?: 'reproduce' | 'polish';
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
    case 'social-copy': {
      // Per-platform post copy from a clip/asset's content. Each platform gets
      // text tuned to its norms + its own hashtags. Match the source language.
      const briefLine = b.brief && b.brief.trim() ? `\n\nProduction brief (align the copy to it):\n${b.brief.slice(0, 1000)}` : '';
      return {
        system: `${base} You are writing publish-ready social copy. Tune each platform to its norms: Instagram (warm, a hook + 1-2 emoji, 8-12 hashtags), TikTok (punchy, casual, 3-5 hashtags), Facebook (a touch longer, conversational, 0-3 hashtags), LinkedIn (professional, no emoji spam, 0-3 hashtags). Match the language of the source text (reply in Welsh if it is in Welsh).`,
        user: `Write post copy for EACH platform, based on the content below. Return JSON: {"variants":[{"platform":"Instagram","text":"caption","hashtags":["#tag", ...]},{"platform":"TikTok",...},{"platform":"Facebook",...},{"platform":"LinkedIn",...}]}.${briefLine}\n\nContent:\n${texts.filter(Boolean).join('\n')}`,
      };
    }
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
        user: `From the transcript below, return the best clips as JSON: {"summary":"one-line summary of the content","clips":[{"start":"mm:ss","end":"mm:ss","duration_seconds":0,"title":"short title","hook":"on-screen hook line","reason":"why the moment works","fit":"how it serves the brief, or \\"\\" if no brief","caption":"suggested caption","platforms":["TikTok","Instagram Reels"],"aspect_ratio":"9:16","score":0}]} — up to 6 clips, ranked best first, score 0-100.${briefBlock}\n\nTranscript:\n${(b.transcript || '').slice(0, CLIP_TRANSCRIPT_LIMIT)}`,
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
  // Gate this paid Anthropic proxy behind the server-validated client-area
  // cookie - same exposure as the transcribe route (Codex #72).
  if (!requireGate(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
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

    // ── vision: reverse-engineer one design image into an editable template ──
    if (body.task === 'template-from-image') {
      const m = body.image ? /^data:(image\/\w+);base64,(.+)$/.exec(body.image) : null;
      if (!m) return NextResponse.json({ error: 'no_image' }, { status: 400 });
      const mode = body.mode === 'polish' ? 'polish' : 'reproduce';
      const brand = body.brand ?? {};
      const palette = (brand.colours ?? []).slice(0, 6);
      const fonts = Array.from(new Set([...(brand.fonts ?? []), 'Bitter', 'Inter']));
      const ratio = body.ratio || 'portrait';
      const system = `You are a senior social-media template designer. You reverse-engineer ONE social post image into an EDITABLE, REUSABLE template: a list of positioned elements on a normalised 0..1 canvas (origin top-left; x/y/width/height are fractions of the canvas; fontSize is a fraction of canvas WIDTH). The template must be MULTI-PURPOSE: put every distinct line of text in its OWN element so it can be re-edited, and represent any photo, logo or icon as an EMPTY image/logo PLACEHOLDER (no content) for the user to fill - never try to recreate a photo.

Allowed element types:
- "background": exactly one, FIRST, full-bleed. style:{fill:"#hex"}.
- "text": {content:"the actual words", position:{x,y}, size:{width,height}, style:{color:"#hex", fontFamily, fontWeight:"400".."900", fontSize:0.02..0.30, align:"left"|"center"|"right", lineHeight:1.0..1.4}}.
- "shape": {position, size, style:{fill:"#hex", radius:0..0.5}} (accent bars, chips, panels).
- "image" or "logo": placeholder, {position, size, style:{fit:"contain"|"cover", radius:0..0.5}}, NO content.
Use ONLY these fonts: ${JSON.stringify(fonts)} (Bitter for display/headlines, Inter for body/labels). Max 12 elements. Transcribe the ACTUAL visible words as text content and KEEP their language (e.g. Welsh stays Welsh). Respond with ONLY valid JSON, no markdown.`;
      const modeRule = mode === 'polish'
        ? `MODE = POLISH: treat the image as inspiration but re-lay it out cleanly with strong hierarchy and confident spacing, and recolour using THIS brand palette ${JSON.stringify(palette)} (background = the darkest/most dominant brand colour; accents from the others; text legible on the background). Keep the message and the copy.`
        : `MODE = REPRODUCE: match the source as closely as you can - its background colour, element positions, colours, text content and hierarchy.`;
      const user = `Build a ${ratio} template from this image. ${modeRule}
Return JSON: {"name":"short template name, 2-4 words","elements":[ ...elements back-to-front, background first... ]}.`;
      const content: unknown[] = [
        { type: 'text', text: user },
        { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
      ];
      const vres = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages: [{ role: 'user', content }] }),
      });
      const vdata = await vres.json();
      if (!vres.ok) return NextResponse.json({ error: vdata.error?.message || 'Anthropic API error' }, { status: vres.status });
      const result = parseJSON(vdata?.content?.[0]?.text ?? '');
      if (!result) return NextResponse.json({ error: 'parse_failed' }, { status: 502 });
      return NextResponse.json({ task: 'template-from-image', result });
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
    // Tell the client when the transcript was longer than we analysed, so it
    // can warn that later moments were not considered (Codex on #70).
    const truncated = body.task === 'clip-analysis'
      && (body.transcript?.length || 0) > CLIP_TRANSCRIPT_LIMIT;
    return NextResponse.json({ task: body.task, result, truncated, analysedChars: truncated ? CLIP_TRANSCRIPT_LIMIT : undefined });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'error' }, { status: 500 });
  }
}
