import { NextRequest, NextResponse } from 'next/server';

// AI Social Media Agent for the graphics engine. Tasks: improve copy,
// auto-fill from a topic, captions + hashtags, design critique. Calls
// Claude via the REST API (same pattern as /api/ai). 503 if no key.

const MODEL = 'claude-sonnet-4-20250514';

interface Body {
  task: 'improve' | 'autofill' | 'captions' | 'critique';
  brand?: { name?: string; toneNotes?: string; colours?: string[]; fonts?: string[] };
  platform?: string;
  texts?: string[];
  topic?: string;
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
    const { system, user } = buildPrompt(body);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, system, messages: [{ role: 'user', content: user }] }),
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
