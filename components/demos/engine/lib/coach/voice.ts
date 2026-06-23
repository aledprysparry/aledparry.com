// ═══ Postio Coach: brand-voice learning ═══
// Derive a voice profile from a brand's past posts (deterministic, offline)
// and optionally refine it with the model. The profile is fed into every
// generative play + analysis so the Coach writes in the brand's own voice.

import type { Brand, GeneratedGraphic, VoiceProfile } from '@engine/lib/model/types';
import { extractPostText, callCoach } from './analysis';

const EMOJI_RE = /[←-⇿⌀-➿⬀-⯿]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
const HASHTAG_RE = /#[A-Za-z0-9_À-ɏḀ-ỿ]+/g;
// Welsh-distinctive tokens only - whole function words + diacritics that do not
// collide with common English substrings (so an English brand is not misread as
// Welsh). Deliberately drops ' a ' / ' y ' / 'll' / 'dd ' / ' i ' / ' o '.
const WELSH_HINTS = [' yn ', ' yw ', ' wedi ', ' eich ', ' ein ', ' gyda ', ' mae ', ' hefyd ', ' sydd ', ' ond ', ' neu ', ' chi ', ' wrth ', ' iawn ', ' rhag', ' gan ', 'ŵ', 'ŷ', ' â ', ' ô'];
const CTA_WORDS = ['shop', 'buy', 'learn', 'sign up', 'book', 'download', 'join', 'follow', 'comment', 'save', 'share', 'tap', 'click', 'discover', 'register', 'get', 'dysgwch', 'cofrestrwch', 'archebwch', 'dilynwch', 'rhannwch', 'prynwch', 'ymunwch'];
const STOP = new Set(['the', 'a', 'an', 'to', 'of', 'and', 'for', 'in', 'on', 'is', 'are', 'your', 'you', 'we', 'our', 'with', 'this', 'that', 'it', 'at', 'be', 'or', 'yn', 'y', 'a', 'i', 'o', 'am', 'ein', 'eich', 'mae', 'yw']);

type DerivedVoice = Omit<VoiceProfile, 'id' | 'brandId' | 'updatedAt'>;

/** Deterministic voice profile from the brand's posts. Always works offline. */
export function deriveVoiceProfile(graphics: GeneratedGraphic[]): DerivedVoice {
  const posts = graphics.map((g) => extractPostText(g).joined).filter((s) => s.trim().length > 0);
  const sampleCount = posts.length;
  const all = posts.join('\n');
  const words = all.split(/\s+/).filter(Boolean);
  const avgWordsPerPost = sampleCount ? Math.round(words.length / sampleCount) : 0;

  const emojiCount = (all.match(EMOJI_RE) || []).length;
  const hashtagCount = (all.match(HASHTAG_RE) || []).length;
  const questionCount = (all.match(/\?/g) || []).length;
  const emojiPerPost = sampleCount ? emojiCount / sampleCount : 0;
  const tagPerPost = sampleCount ? hashtagCount / sampleCount : 0;

  const low = ` ${all.toLowerCase()} `;
  const welshScore = WELSH_HINTS.filter((h) => low.includes(h)).length;
  const hasEnglish = /\b(the|and|you|your|with|for)\b/i.test(all);
  const language: VoiceProfile['language'] = !sampleCount ? 'unknown'
    : welshScore >= 2 && hasEnglish ? 'bilingual'
    : welshScore >= 2 ? 'cy'
    : 'en';

  const ctaHits = CTA_WORDS.filter((w) => low.includes(` ${w}`)).length;
  const ctaStyle = ctaHits >= 2 ? 'direct CTAs' : (sampleCount > 0 && questionCount >= sampleCount) ? 'questions that invite replies' : 'soft invitations';

  const emojiUsage: VoiceProfile['emojiUsage'] = emojiPerPost >= 2 ? 'heavy' : emojiPerPost >= 0.4 ? 'light' : 'none';
  const hashtagStyle: VoiceProfile['hashtagStyle'] = tagPerPost >= 6 ? 'many' : tagPerPost >= 1 ? 'few' : 'none';

  const tone: string[] = [];
  if (emojiPerPost >= 0.4) tone.push('friendly');
  if (questionCount >= Math.max(1, sampleCount * 0.5)) tone.push('conversational');
  const capsWords = words.filter((w) => w.length >= 3 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
  if (capsWords / Math.max(1, words.length) > 0.04) tone.push('bold');
  tone.push(avgWordsPerPost > 25 ? 'detailed' : 'concise');
  if (!tone.includes('friendly') && !tone.includes('bold')) tone.push('considered');

  // signature phrases: 2-3 word n-grams that recur
  const signaturePhrases = topPhrases(posts).slice(0, 3);

  const doList: string[] = [];
  if (avgWordsPerPost) doList.push(`Keep posts around ${avgWordsPerPost} words - that is your natural length.`);
  doList.push(emojiUsage === 'none' ? 'You rarely use emoji; keep the clean look unless a post calls for warmth.' : `Keep emoji ${emojiUsage} and consistent.`);
  doList.push(hashtagStyle === 'none' ? 'Add a few specific hashtags to widen reach.' : `Stick to ${hashtagStyle === 'many' ? 'a tighter, more specific' : 'your'} hashtag set.`);
  if (signaturePhrases.length) doList.push(`Lean on your recurring phrases: ${signaturePhrases.join(', ')}.`);

  return {
    language, toneAdjectives: dedupe(tone).slice(0, 4), avgWordsPerPost,
    emojiUsage, hashtagStyle, ctaStyle, signaturePhrases, doList,
    sampleCount, modelUsed: 'deterministic',
  };
}

/** A short voice line for AI prompts + offline generators. */
export function voiceSummary(p: VoiceProfile | undefined): string {
  if (!p || !p.sampleCount) return '';
  const langword = p.language === 'cy' ? 'Welsh' : p.language === 'bilingual' ? 'bilingual (Welsh + English)' : 'English';
  const sig = p.signaturePhrases.length ? ` Recurring phrases: ${p.signaturePhrases.join(', ')}.` : '';
  return `Brand voice (learned from ${p.sampleCount} of their posts): ${p.toneAdjectives.join(', ')}; ${langword}; about ${p.avgWordsPerPost} words/post; ${p.emojiUsage} emoji; ${p.hashtagStyle} hashtags; ${p.ctaStyle}.${sig} Write in this voice.`;
}

/** AI-refine on top of the deterministic profile (falls back to deterministic). */
export async function refineVoiceProfile(graphics: GeneratedGraphic[], brand: Brand | undefined): Promise<{ profile: DerivedVoice; usedAI: boolean }> {
  const base = deriveVoiceProfile(graphics);
  const posts = graphics.map((g) => extractPostText(g).joined).filter((s) => s.trim().length > 0).slice(0, 20);
  if (posts.length < 2) return { profile: base, usedAI: false };
  const { result } = await callCoach<Partial<DerivedVoice>>('coach-voice', {
    brand: brand ? { name: brand.name, toneNotes: brand.toneNotes } : undefined,
    texts: posts,
  });
  if (!result) return { profile: base, usedAI: false };
  const arr = (x: unknown, fallback: string[]) => (Array.isArray(x) && x.every((v) => typeof v === 'string') && x.length ? (x as string[]) : fallback);
  return {
    profile: {
      ...base,
      toneAdjectives: arr(result.toneAdjectives, base.toneAdjectives).slice(0, 4),
      ctaStyle: typeof result.ctaStyle === 'string' && result.ctaStyle ? result.ctaStyle : base.ctaStyle,
      signaturePhrases: arr(result.signaturePhrases, base.signaturePhrases).slice(0, 4),
      doList: arr(result.doList, base.doList).slice(0, 5),
      modelUsed: 'claude',
    },
    usedAI: true,
  };
}

// ── helpers ──
function dedupe(xs: string[]): string[] { return Array.from(new Set(xs)); }

function topPhrases(posts: string[]): string[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    const tokens = post.toLowerCase().replace(/[^a-zA-Z0-9À-ÿ\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i + n <= tokens.length; i++) {
        const gram = tokens.slice(i, i + n).join(' ');
        counts.set(gram, (counts.get(gram) || 0) + 1);
      }
    }
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);
}
