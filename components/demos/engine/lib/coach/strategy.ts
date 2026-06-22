// ═══ Postio Coach: Strategy / Playbook engine ═══
//
// Generative counterpart to the post analyser. A per-brand business brief
// feeds seven "plays". Each play runs AI-first (the gated coach-strategy task)
// with a deterministic, brief-aware offline fallback so the whole layer works
// with no ANTHROPIC_API_KEY. Every play returns one of four structured shapes
// (sections / pillars / calendar / post) so the UI stays scannable, not chat.

import type {
  Brand,
  CoachBrief,
  StrategyPlayId,
  StrategyData,
  StrategyDataKind,
  StrategySection,
  AspirationalAccount,
  PerformanceEntry,
} from '@engine/lib/model/types';
import { callCoach, referenceLessonsFrom, performanceSummaryFrom } from './analysis';

export interface StrategyPlay {
  id: StrategyPlayId;
  kind: StrategyDataKind;
  /** English label + intent - i18n fallback + part of the server prompt. */
  label: string;
  intent: string;
}

export const STRATEGY_PLAYS: StrategyPlay[] = [
  { id: 'full_strategy', kind: 'sections', label: 'Full social media strategy', intent: 'A complete strategy: brand positioning, content direction, audience targeting, and how to monetize.' },
  { id: 'audience_psychology', kind: 'sections', label: 'Audience psychology breakdown', intent: 'The audience’s frustrations, desires, fears and daily content habits, turned into messaging angles and scroll-stopping content topics.' },
  { id: 'authority_positioning', kind: 'sections', label: 'Authority positioning plan', intent: 'A positioning strategy that separates this brand from everyone else and makes it the go-to name in its space.' },
  { id: 'content_pillars', kind: 'pillars', label: 'Content pillars that convert', intent: 'Five content pillars that attract followers, build credibility and drive leads or sales, each with example topics and why it connects.' },
  { id: 'thirty_day_plan', kind: 'calendar', label: '30-day content plan', intent: 'A 30-day calendar: a daily idea, post format, message angle and the goal of each post (reach, trust, or sell).' },
  { id: 'scroll_post', kind: 'post', label: 'Post that stops the scroll', intent: 'A single high-engagement post on a topic: a hook that stops the scroll, a clear useful insight, and a CTA that drives comments, saves or clicks.' },
  { id: 'monetization', kind: 'sections', label: 'Audience monetization strategy', intent: 'Turn followers into paying customers: offer ideas, pricing structure, and the content angles that move people from follower to buyer.' },
];

export const PLAY_BY_ID: Record<StrategyPlayId, StrategyPlay> = Object.fromEntries(
  STRATEGY_PLAYS.map((p) => [p.id, p]),
) as Record<StrategyPlayId, StrategyPlay>;

/** True when the brief has enough to give a grounded answer. */
export function briefIsReady(b: CoachBrief | undefined): boolean {
  return !!(b && (b.niche.trim() || b.audience.trim()) && b.goals.trim());
}

export interface RunStrategyParams {
  play: StrategyPlayId;
  brief: CoachBrief;
  brand?: Brand;
  referenceAccounts: AspirationalAccount[];
  performanceEntries: PerformanceEntry[];
  /** scroll_post only: the topic to write about. */
  topic?: string;
  /** thirty_day_plan: feed existing pillars so the calendar uses them. */
  pillars?: string[];
}

export interface RunStrategyResult {
  data: StrategyData;
  usedAI: boolean;
  note?: 'not_configured' | 'unauthorized' | 'error';
}

export async function runStrategy(p: RunStrategyParams): Promise<RunStrategyResult> {
  const kind = PLAY_BY_ID[p.play].kind;
  const { result, error } = await callCoach<unknown>('coach-strategy', {
    play: p.play,
    strategyBrief: { niche: p.brief.niche, audience: p.brief.audience, goals: p.brief.goals, businessModel: p.brief.businessModel, competitors: p.brief.competitors, notes: p.brief.notes },
    brand: p.brand ? { name: p.brand.name, toneNotes: p.brand.toneNotes, colours: p.brand.colours, fonts: p.brand.fonts } : undefined,
    referenceLessons: referenceLessonsFrom(p.referenceAccounts),
    performanceSummary: performanceSummaryFrom(p.performanceEntries),
    topic: p.topic,
    pillars: p.pillars,
  });

  const normalised = result ? normalise(kind, result) : null;
  if (normalised) return { data: normalised, usedAI: true };

  const note = error === 'not_configured' || error === 'unauthorized' ? error : error ? 'error' : undefined;
  return { data: offlineStrategy(p), usedAI: false, note };
}

// ── normalise an AI JSON blob into a typed StrategyData ──
const arr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v) => typeof v === 'string') : []);
const str = (x: unknown, d = ''): string => (typeof x === 'string' ? x : d);

function normalise(kind: StrategyDataKind, raw: unknown): StrategyData | null {
  const r = raw as Record<string, unknown>;
  if (kind === 'sections') {
    const sections = Array.isArray(r.sections)
      ? (r.sections as Record<string, unknown>[]).filter((s) => s && s.heading).map((s) => ({ heading: str(s.heading), body: s.body ? str(s.body) : undefined, bullets: arr(s.bullets) }))
      : [];
    return sections.length ? { kind, summary: r.summary ? str(r.summary) : undefined, sections } : null;
  }
  if (kind === 'pillars') {
    const pillars = Array.isArray(r.pillars)
      ? (r.pillars as Record<string, unknown>[]).filter((s) => s && s.name).map((s) => ({ name: str(s.name), why: str(s.why), topics: arr(s.topics) }))
      : [];
    return pillars.length ? { kind, summary: r.summary ? str(r.summary) : undefined, pillars } : null;
  }
  if (kind === 'calendar') {
    const days = Array.isArray(r.days)
      ? (r.days as Record<string, unknown>[]).filter((d) => d && (d.idea || d.day)).map((d, i) => ({ day: typeof d.day === 'number' ? d.day : i + 1, idea: str(d.idea), format: str(d.format), angle: str(d.angle), goal: str(d.goal) }))
      : [];
    return days.length ? { kind, summary: r.summary ? str(r.summary) : undefined, days } : null;
  }
  // post
  const hook = str(r.hook);
  if (!hook && !r.insight) return null;
  return { kind: 'post', hook, insight: str(r.insight), cta: str(r.cta), caption: r.caption ? str(r.caption) : undefined, hashtags: arr(r.hashtags) };
}

// ── deterministic, brief-aware offline fallback ──
function offlineStrategy(p: RunStrategyParams): StrategyData {
  const b = p.brief;
  const niche = b.niche.trim() || 'your niche';
  const audience = b.audience.trim() || 'your audience';
  const goal = b.goals.trim() || 'grow and convert your audience';
  const model = b.businessModel.trim() || 'your offer';
  const sec = (heading: string, body: string, bullets: string[]): StrategySection => ({ heading, body, bullets });

  switch (p.play) {
    case 'full_strategy':
      return { kind: 'sections', summary: `A starter strategy for ${niche}, aimed at ${audience}, built around the goal to ${goal}.`, sections: [
        sec('Brand positioning', `Own a clear spot in ${niche}.`, [`Position as the practical, trustworthy choice for ${audience}.`, 'Pick one promise you can repeat in every post.', 'Use a consistent palette, type and tone so the feed is recognisable at a glance.']),
        sec('Content direction', 'Lead with value, not announcements.', ['Teach one useful thing per post.', 'Show proof (results, behind the scenes, client wins).', 'Have a point of view that filters in the right people.']),
        sec('Audience targeting', `Speak directly to ${audience}.`, ['Name their problem in the first line.', 'Mirror their words, not industry jargon.', 'Engage in comments and DMs to compound reach.']),
        sec('Monetization', `Turn attention into ${model}.`, ['Offer a low-friction first step.', 'Warm the audience with proof before the ask.', 'Add one clear CTA per week toward the offer.']),
      ] };
    case 'audience_psychology':
      return { kind: 'sections', summary: `What ${audience} feel and do, turned into angles.`, sections: [
        sec('Frustrations', `What annoys ${audience} daily.`, ['Wasting time on things that do not move the needle.', 'Conflicting advice and overwhelm.', 'Feeling behind everyone else.']),
        sec('Desires', 'What they secretly want.', ['A simple, proven path.', 'To look credible to their peers.', `Real results in ${niche} without burning out.`]),
        sec('Fears', 'What holds them back.', ['Looking foolish for trying.', 'Wasting money on the wrong thing.', 'Starting and not finishing.']),
        sec('Daily content habits', 'How they scroll.', ['Short attention, mute on.', 'Save useful posts for later.', 'Trust people who show, not just tell.']),
        sec('Messaging angles', 'Use these to stop the scroll.', ['Name the frustration in line one.', 'Promise the desire, then prove it.', 'Reframe a common myth in your space.']),
        sec('Content topics', 'Ready to post.', [`The 3 mistakes ${audience} make in ${niche}.`, 'A before/after with the steps between.', 'A myth you used to believe, and what is true.']),
      ] };
    case 'authority_positioning':
      return { kind: 'sections', summary: `How to become the go-to name in ${niche}.`, sections: [
        sec('Your edge', 'What only you can claim.', ['Combine your background with your niche in one line.', 'Lean into the angle competitors avoid.']),
        sec('Positioning statement', 'Repeat this everywhere.', [`The go-to for ${audience} who want results in ${niche} without the fluff.`]),
        sec('Differentiators', 'Make the choice obvious.', ['A signature method or framework with a name.', 'A consistent visual identity.', 'Proof posted regularly.']),
        sec('Proof to build', 'Earn the authority.', ['Document wins and case studies.', 'Share strong, specific opinions.', 'Show your process in public.']),
      ] };
    case 'content_pillars':
      return { kind: 'pillars', summary: `Five pillars for ${niche}.`, pillars: [
        { name: 'Educate', why: `Teaching builds trust with ${audience} and earns saves.`, topics: ['How-to in 5 steps', 'A common mistake and the fix', 'A quick framework'] },
        { name: 'Proof', why: 'Results and stories make the promise believable.', topics: ['Before and after', 'A client win', 'A myth busted with evidence'] },
        { name: 'Behind the scenes', why: 'Humanises the brand and builds connection.', topics: ['How you work', 'A day in the life', 'A lesson learned'] },
        { name: 'Point of view', why: 'Opinions filter in the right people and spark comments.', topics: ['An unpopular take', 'What you would never do', 'What the industry gets wrong'] },
        { name: 'Offers', why: `Moves ${audience} toward ${model}.`, topics: ['Who the offer is for', 'A testimonial', 'A clear invitation'] },
      ] };
    case 'thirty_day_plan': {
      const pillars = p.pillars?.length ? p.pillars : ['Educate', 'Proof', 'Behind the scenes', 'Point of view', 'Offers'];
      const formats = ['Carousel', 'Reel', 'Single image', 'Story', 'Reel'];
      const goals = ['Trust', 'Reach', 'Trust', 'Reach', 'Sell'];
      const days = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        idea: `${pillars[i % pillars.length]}: ${ideaFor(pillars[i % pillars.length], niche)}`,
        format: formats[i % formats.length],
        angle: angleFor(pillars[i % pillars.length], audience),
        goal: goals[i % goals.length],
      }));
      return { kind: 'calendar', summary: `A 30-day plan for ${niche}, cycling your pillars.`, days };
    }
    case 'scroll_post': {
      const topic = (p.topic || '').trim() || `getting started in ${niche}`;
      return { kind: 'post', hook: `Most ${audience} get ${topic} wrong. Here is the fix.`, insight: `The shortcut: focus on the one step that actually moves the needle for ${topic}, and ignore the rest until it is working.`, cta: 'Save this for later, and comment your biggest blocker so I can help.', caption: `${topic} does not have to be complicated. Steal this and let me know how it goes.`, hashtags: ['#tips', '#howto'] };
    }
    case 'monetization':
      return { kind: 'sections', summary: `Turn ${audience} into buyers of ${model}.`, sections: [
        sec('Offer ideas', 'Build an offer ladder.', ['A free lead magnet (checklist or mini-guide).', 'A low-cost entry offer.', 'A core paid offer or service.']),
        sec('Pricing structure', 'Make the next step easy.', ['Anchor with the core offer.', 'Add a clear entry price to remove risk.', 'Bundle for higher value where it fits.']),
        sec('Content angles that sell', 'Move follower to buyer.', ['Show the transformation, not the features.', 'Handle one objection per week.', 'Post proof, then invite.']),
        sec('Next step', 'This week.', ['Publish the lead magnet.', 'Add one CTA toward it.', 'DM warm leads who engage.']),
      ] };
    default:
      return { kind: 'sections', sections: [sec('Strategy', 'Fill in your brief for tailored advice.', [])] };
  }
}

function ideaFor(pillar: string, niche: string): string {
  const map: Record<string, string> = {
    Educate: `a 5-step how-to in ${niche}`,
    Proof: 'a before/after with the steps',
    'Behind the scenes': 'how you actually work',
    'Point of view': 'an honest take the industry avoids',
    Offers: 'who your offer is for and why',
  };
  return map[pillar] || `a useful tip in ${niche}`;
}
function angleFor(pillar: string, audience: string): string {
  const map: Record<string, string> = {
    Educate: `Teach ${audience} one quick win`,
    Proof: 'Make the promise believable',
    'Behind the scenes': 'Build connection',
    'Point of view': 'Filter in the right people',
    Offers: 'Invite without pressure',
  };
  return map[pillar] || `Speak to ${audience}`;
}
