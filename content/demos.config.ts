/**
 * Demo registry — the single source of truth for all client demos.
 *
 * To add a new demo:
 * 1. Create your component in components/demos/ (e.g. PropertySearch.tsx)
 * 2. Add an entry here with the correct componentPath
 * 3. That's it — index page, routing, and dynamic imports are automatic
 *
 * Note: componentPath must match the file in components/demos/ (without extension).
 * The component must `export default` and should include "use client" if it uses
 * browser APIs (localStorage, canvas, etc.)
 */

export interface DemoEntry {
  /** URL-safe client slug (lowercase, no spaces) */
  clientSlug: string;
  /** Display name for the client */
  clientName: string;
  /** URL-safe tool slug (lowercase, no spaces) */
  toolSlug: string;
  /** Display name for the tool */
  toolName: string;
  /** Short description shown on the index page */
  description: string;
  /** File name in components/demos/ (without extension) */
  componentPath: string;
  /** Optional custom URL (overrides /app/[client]/[tool] pattern) */
  href?: string;
}

export const demos: DemoEntry[] = [
  {
    clientSlug: "cpshomes",
    clientName: "CPS Homes",
    toolSlug: "socialeditor",
    toolName: "Social Editor",
    description:
      "Visual editor for creating branded social media posts with templates, text overlays, and export to PNG.",
    componentPath: "SocialEditor",
  },
  {
    clientSlug: "cpshomes",
    clientName: "CPS Homes",
    toolSlug: "guessprice",
    toolName: "Guess the Price",
    description:
      "Graphics generator for the Guess the Price social video format — property frames, A/B/C options, reveals, and scoreboards.",
    componentPath: "GuessThePrice",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "mastery",
    toolName: "Mastery Companion",
    description:
      "Learning and training companion app for structured skill development and progress tracking.",
    componentPath: "MasteryCompanion",
    href: "/app/mastery",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "pma",
    toolName: "PMA",
    description:
      "Production management app for broadcast teams — scheduling, task tracking, and resource planning.",
    componentPath: "PMA",
    href: "/app/pma",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "keepitlocal",
    toolName: "Keep it Local",
    description:
      "Community app connecting people with local services, businesses, and events.",
    componentPath: "KeepItLocal",
    href: "/app/keepitlocal",
  },
];

/** Get all demos */
export function getAllDemos() {
  return demos;
}

/** Get demos for a specific client */
export function getDemosByClient(clientSlug: string) {
  return demos.filter((d) => d.clientSlug === clientSlug);
}

/** Get a specific demo */
export function getDemo(clientSlug: string, toolSlug: string) {
  return demos.find(
    (d) => d.clientSlug === clientSlug && d.toolSlug === toolSlug
  );
}

/** Get unique clients */
export function getClients() {
  const seen = new Map<string, string>();
  for (const d of demos) {
    if (!seen.has(d.clientSlug)) {
      seen.set(d.clientSlug, d.clientName);
    }
  }
  return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
}
