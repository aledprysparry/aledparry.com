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
  task: 'improve' | 'autofill' | 'captions' | 'critique' | 'review-layout' | 'clip-analysis' | 'social-copy' | 'template-from-image' | 'coach-analyse' | 'coach-account' | 'coach-performance' | 'coach-strategy';
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
  // ── Postio Coach ──
  // coach-analyse: the enabled benchmark modules to score against
  benchmarks?: { id: string; label: string; desc: string }[];
  // coach-analyse (optional context): lessons from reference accounts +
  // a summary of the user's own performance, so advice is grounded.
  referenceLessons?: string[];
  performanceSummary?: string;
  templateName?: string;
  // coach-account: one reference account to extract (NOT scrape) patterns from
  account?: { platform?: string; handle?: string; displayName?: string; notes?: string };
  // coach-performance: rows of imported/manual metrics to learn from
  entries?: { label?: string; platform?: string; metrics?: Record<string, unknown> }[];
  // coach-strategy: which play + the per-brand business brief (topic reuses
  // the existing `topic` field; pillars feed the 30-day plan).
  play?: string;
  strategyBrief?: { niche?: string; audience?: string; goals?: string; businessModel?: string; competitors?: string; notes?: string };
  pillars?: string[];
}

// Strategy plays -> the structured shape + intent the model must return.
const STRATEGY_SPEC: Record<string, { kind: 'sections' | 'pillars' | 'calendar' | 'post'; intent: string }> = {
  full_strategy: { kind: 'sections', intent: 'A complete strategy covering brand positioning, content direction, audience targeting, and how to monetize. Use one section per area.' },
  audience_psychology: { kind: 'sections', intent: 'Break the audience down: sections for Frustrations, Desires, Fears, Daily content habits, then Messaging angles and Content topics that stop the scroll and build trust.' },
  authority_positioning: { kind: 'sections', intent: 'A positioning strategy that separates this brand from everyone else and makes it the go-to name: sections for the edge, a positioning statement, differentiators, and proof to build.' },
  content_pillars: { kind: 'pillars', intent: 'Exactly 5 content pillars that attract followers, build credibility and drive leads or sales. Each pillar: a name, why it connects with this audience, and 3 example post topics.' },
  thirty_day_plan: { kind: 'calendar', intent: 'A 30-day content calendar. One entry per day (day 1..30): a content idea, a post format (Carousel/Reel/Single image/Story), the message angle, and the goal (Reach, Trust, or Sell). Cycle the content pillars.' },
  scroll_post: { kind: 'post', intent: 'One high-engagement post on the given topic: a hook that stops the scroll, a clear useful insight, and a CTA that drives comments, saves or clicks, plus a caption and a few hashtags.' },
  monetization: { kind: 'sections', intent: 'Turn followers into paying customers: sections for offer ideas, pricing structure, content angles that move follower to buyer, and the immediate next step.' },
};

// The exact JSON envelope the model must return for each shape.
const STRATEGY_SHAPE: Record<string, string> = {
  sections: '{"summary":"one-line summary","sections":[{"heading":"...","body":"optional 1-2 sentences","bullets":["specific, actionable points"]}]}',
  pillars: '{"summary":"one-line summary","pillars":[{"name":"pillar name","why":"why it connects with this audience","topics":["example post topic", "..."]}]}',
  calendar: '{"summary":"one-line summary","days":[{"day":1,"idea":"the post idea","format":"Carousel|Reel|Single image|Story","angle":"the message angle","goal":"Reach|Trust|Sell"}]}',
  post: '{"hook":"scroll-stopping first line","insight":"the clear useful insight","cta":"comment/save/click CTA","caption":"the full caption","hashtags":["#tag"]}',
};

// The Postio Coach system instruction (spec #10). Reused by every coach task.
const COACH_SYSTEM = `You are Postio's AI Content Coach. You help social media managers improve content quality and performance. Never give vague feedback. Every observation MUST include: (1) what you noticed, (2) why it matters, (3) what to change, and (4) the expected benefit. Respect the selected benchmark settings. Learn from the user's previous posts, their best-performing content, the selected reference accounts, the intended platform, the brand style, and the current template. Never copy another account directly - identify the patterns and adapt them ethically. Match the language of the post copy (reply in Welsh if the copy is in Welsh). Respond with ONLY valid JSON, no markdown fences, no commentary.`;

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
    case 'coach-analyse': {
      const mods = (b.benchmarks ?? []).filter((m) => m && m.id);
      const modList = mods.map((m) => `- ${m.id} (${m.label}): ${m.desc}`).join('\n') || '- overall_content_score (Overall): general content quality';
      const refBlock = b.referenceLessons?.length
        ? `\n\nPatterns from reference accounts the user admires (adapt ethically, never copy):\n${b.referenceLessons.slice(0, 8).map((l) => `- ${l}`).join('\n')}`
        : '';
      const perfBlock = b.performanceSummary ? `\n\nWhat has worked for this user before:\n${b.performanceSummary.slice(0, 800)}` : '';
      const tplBlock = b.templateName ? `\n\nCurrent template: ${b.templateName}.` : '';
      return {
        system: `${COACH_SYSTEM} ${brandCtx}`,
        user: `Analyse this post for ${b.platform || 'Instagram'}. Score ONLY these benchmark modules (use their exact ids):\n${modList}${refBlock}${perfBlock}${tplBlock}\n\nReturn JSON exactly:
{"overallScore":0-100,
 "results":[{"id":"module_id","score":0-100,"summary":"what you noticed (one line)","issue":"the problem, or omit if none","recommendation":"what to change + the expected benefit","priority":"low|medium|high"}],
 "strengths":["top 3 strengths, most important first"],
 "issues":["top 3 issues, most important first"],
 "actionPlan":{"quickWins":["2-4 specific quick wins"],"recommendedEdits":["2-4 concrete edits"],"experimentalIdeas":["1-3 things to test"],"risks":["1-3 risks of posting as-is"]},
 "platformNotes":"one line of platform-specific guidance",
 "recommendations":[{"type":"headline|caption|cta|visual|animation|platform|accessibility|timing","originalValue":"current text if relevant","suggestedValue":"the concrete replacement or action","reason":"why + expected benefit","priority":"low|medium|high"}]}
Be specific ("Move the strongest phrase to line 1, cut the caption ~30%, add a closing question"), never vague.\n\nPost text (each line is a separate text element):\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n') || '(no text on the post yet)'}`,
      };
    }
    case 'coach-account': {
      const a = b.account ?? {};
      return {
        system: `${COACH_SYSTEM} You are extracting reusable PATTERNS from a reference account the user admires, based on what the user tells you and your general knowledge of social media. You have NOT scraped the account. Frame everything as patterns to adapt, never "copy this account".`,
        user: `Reference account: ${a.displayName || a.handle || 'an account'} (@${a.handle || ''}) on ${a.platform || 'instagram'}.${a.notes ? ` The user notes: "${a.notes}".` : ''}\n\nReturn JSON with arrays of short, specific strings: {"commonFormats":[],"toneOfVoice":[],"visualStyle":[],"postingPatterns":[],"recurringHooks":[],"captionPatterns":[],"ctaPatterns":[],"highPerformingThemes":[],"contentPillars":[],"lessonsForUser":["3-5 lessons the user can apply, each with the expected benefit"]}.`,
      };
    }
    case 'coach-performance': {
      const rows = (b.entries ?? []).slice(0, 40);
      return {
        system: `${COACH_SYSTEM} You are analysing the user's OWN post performance to find what works for them.`,
        user: `Here are the user's posts with metrics. Find patterns in best vs worst (topics, formats, hooks, caption styles, posting times, CTAs, reusable templates). Return JSON: {"insights":[{"insight":"the pattern","evidence":"the numbers that show it","recommendation":"what to do + expected benefit","confidence":"low|medium|high"}]} (up to 6, most useful first).\n\nData:\n${JSON.stringify(rows)}`,
      };
    }
    case 'coach-strategy': {
      const spec = STRATEGY_SPEC[b.play || ''] || STRATEGY_SPEC.full_strategy;
      const shape = STRATEGY_SHAPE[spec.kind];
      const br = b.strategyBrief ?? {};
      const briefBlock = [
        br.niche && `Niche: ${br.niche}`,
        br.audience && `Audience: ${br.audience}`,
        br.goals && `Goals: ${br.goals}`,
        br.businessModel && `Business model: ${br.businessModel}`,
        br.competitors && `Competitors: ${br.competitors}`,
        br.notes && `Notes: ${br.notes}`,
      ].filter(Boolean).join('\n');
      const refBlock = b.referenceLessons?.length ? `\n\nPatterns from accounts they admire (adapt, never copy):\n${b.referenceLessons.slice(0, 8).map((l) => `- ${l}`).join('\n')}` : '';
      const perfBlock = b.performanceSummary ? `\n\nWhat has worked for them before:\n${b.performanceSummary.slice(0, 800)}` : '';
      const topicBlock = b.play === 'scroll_post' && b.topic ? `\n\nTopic for the post: ${b.topic}` : '';
      const pillarBlock = b.play === 'thirty_day_plan' && b.pillars?.length ? `\n\nUse these content pillars across the 30 days: ${b.pillars.join(', ')}.` : '';
      return {
        system: `${COACH_SYSTEM} You are also a social media strategist who has built brands from zero to a large, engaged following. Be specific and practical, never generic. Do not invent fake statistics, testimonials or guarantees. ${brandCtx}`,
        user: `Play: ${spec.intent}\n\nBusiness brief:\n${briefBlock || '(sparse - infer sensibly and keep advice general where the brief is thin)'}${refBlock}${perfBlock}${topicBlock}${pillarBlock}\n\nReturn JSON exactly in this shape (no extra keys):\n${shape}`,
      };
    }
    default:
      return { system: base, user: 'Return JSON: {}' };
  }
}

// Token budget per task: the Coach analysis returns a large structured object.
function coachMaxTokens(task: Body['task']): number {
  if (task === 'coach-analyse') return 3200;
  if (task === 'coach-strategy') return 3600; // the 30-day calendar is large
  if (task === 'coach-account' || task === 'coach-performance') return 1600;
  if (task === 'clip-analysis') return 2200;
  return 1200;
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

    // ── Coach analysis WITH a rendered image: judge the visual from pixels ──
    if (body.task === 'coach-analyse' && body.images?.length) {
      const m = /^data:(image\/\w+);base64,(.+)$/.exec(body.images[0]);
      const { system, user } = buildPrompt(body);
      const visionUser = `${user}\n\nA rendered image of the post is attached. Judge the VISUAL benchmarks (visual clarity, text hierarchy, brand consistency, accessibility/contrast, format) from what you actually see in the image, not just the text.`;
      const content: unknown[] = [{ type: 'text', text: visionUser }];
      if (m) content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
      const vres = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: coachMaxTokens('coach-analyse'), system, messages: [{ role: 'user', content }] }),
      });
      const vdata = await vres.json();
      if (!vres.ok) return NextResponse.json({ error: vdata.error?.message || 'Anthropic API error' }, { status: vres.status });
      const result = parseJSON(vdata?.content?.[0]?.text ?? '');
      if (!result) return NextResponse.json({ error: 'parse_failed' }, { status: 502 });
      return NextResponse.json({ task: 'coach-analyse', result });
    }

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
      body: JSON.stringify({ model: MODEL, max_tokens: coachMaxTokens(body.task), system, messages: [{ role: 'user', content: user }] }),
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
