/**
 * Demo registry – the single source of truth for all client demos.
 *
 * To add a new demo:
 * 1. Create your component in components/demos/ (e.g. PropertySearch.tsx)
 * 2. Add an entry here with the correct componentPath
 * 3. That's it – index page, routing, and dynamic imports are automatic
 *
 * Note: componentPath must match the file in components/demos/ (without extension).
 * The component must `export default` and should include "use client" if it uses
 * browser APIs (localStorage, canvas, etc.)
 */

export type DemoStatus = "live" | "demo" | "soon";

export interface DemoEntry {
  /** URL-safe client slug (lowercase, no spaces) */
  clientSlug: string;
  /** Display name for the client */
  clientName: string;
  /** URL-safe tool slug (lowercase, no spaces) */
  toolSlug: string;
  /** Display name for the tool */
  toolName: string;
  /** Short description shown on the index page (English) */
  description: string;
  /** Welsh description shown when the showcase is in Cymraeg */
  descriptionCy: string;
  /** File name in components/demos/ (without extension) */
  componentPath: string;
  /** Optional custom URL (overrides /app/[client]/[tool] pattern) */
  href?: string;
  /** Showcase status badge: live product, interactive demo, or coming soon */
  status: DemoStatus;
}

export const demos: DemoEntry[] = [
  {
    clientSlug: "momentwm",
    clientName: "Momentwm",
    toolSlug: "radar",
    toolName: "Editorial Radar",
    description:
      "A Welsh editorial radar: anniversaries, centenaries and 'why now' stories, scored for Welsh relevance and editorial usefulness, with ready Cwis, Heno and pitch drafts.",
    descriptionCy:
      "Radar golygyddol Cymreig: penblwyddi, canmlwyddiannau a straeon 'pam nawr', wedi'u sgorio yn ôl perthnasedd Cymreig a defnydd golygyddol, gyda drafftiau parod ar gyfer Cwis, Heno a chyflwyniadau.",
    componentPath: "",
    href: "/app/momentwm",
    status: "demo",
  },
  {
    clientSlug: "cpshomes",
    clientName: "CPS Homes",
    toolSlug: "socialeditor",
    toolName: "Social Editor",
    description:
      "Visual editor for creating branded social media posts with templates, text overlays, and export to PNG.",
    descriptionCy:
      "Golygydd gweledol ar gyfer creu postiadau cyfryngau cymdeithasol wedi'u brandio - templedi, troshaenau testun, ac allforio i PNG.",
    componentPath: "SocialEditor",
    status: "demo",
  },
  {
    clientSlug: "cpshomes",
    clientName: "CPS Homes",
    toolSlug: "guessprice",
    toolName: "Guess the Price",
    description:
      "Graphics generator for the Guess the Price social video format – property frames, A/B/C options, reveals, and scoreboards.",
    descriptionCy:
      "Cynhyrchydd graffeg ar gyfer fformat fideo 'Guess the Price' - fframiau eiddo, opsiynau A/B/C, datgeliadau, a sgorfyrddau.",
    componentPath: "GuessThePrice",
    status: "demo",
  },
  {
    clientSlug: "s4c",
    clientName: "S4C",
    toolSlug: "cwis-bob-dydd",
    toolName: "Cwis Bob Dydd",
    description:
      "Quiz content creation suite – question bank, leaderboards, social media planner, and branded graphic builder.",
    descriptionCy:
      "Casgliad o offer creu cynnwys cwis - banc cwestiynau, sgorfyrddau, cynllunydd cyfryngau cymdeithasol, ac adeiladwr graffeg wedi'i brandio.",
    componentPath: "",
    href: "https://cwis-creator-hub.vercel.app",
    status: "live",
  },
  {
    clientSlug: "s4c",
    clientName: "S4C",
    toolSlug: "carousel",
    toolName: "Cwis Bob Dydd Carousels",
    description:
      "Auto-builds the weekly Top 10 leaderboard as a branded Instagram carousel – paste or upload (CSV/XLSX) the week's scores and export cover, places 1–5, 6–10, winner spotlight and a call-to-action as PNG/JPEG or a ZIP.",
    descriptionCy:
      "Creu carwsél Instagram o 10 Uchaf yr wythnos yn awtomatig - gludwch neu lwythwch sgorau'r wythnos (CSV/XLSX) ac allforio'r clawr, safleoedd 1-5, 6-10, sylw i'r enillydd a galwad i weithredu fel PNG/JPEG neu ZIP.",
    componentPath: "",
    href: "/app/carousel",
    status: "demo",
  },
  {
    clientSlug: "tinopolis",
    clientName: "Tinopolis Cymru",
    toolSlug: "pressroom",
    toolName: "Pressroom Intelligence",
    description:
      "Newspaper analysis platform – OCR scanning, NLP theme extraction, sentiment analysis, and AI-powered story angle suggestions. Bilingual Welsh and English.",
    descriptionCy:
      "Llwyfan dadansoddi papurau newydd - sganio OCR, echdynnu themâu (NLP), dadansoddi naws, ac awgrymiadau onglau stori gyda chymorth AI. Dwyieithog, Cymraeg a Saesneg.",
    componentPath: "",
    href: "#",
    status: "soon",
  },
  {
    clientSlug: "tinopolis",
    clientName: "Tinopolis Cymru",
    toolSlug: "qt-live",
    toolName: "QT Live",
    description:
      "Live interactive question time platform for broadcast and audience engagement.",
    descriptionCy:
      "Llwyfan 'question time' rhyngweithiol byw ar gyfer darlledu ac ymgysylltu â chynulleidfa.",
    componentPath: "",
    href: "https://qt-live-production.up.railway.app/",
    status: "live",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "mastery",
    toolName: "Mastery Companion",
    description:
      "Learning and training companion app for structured skill development and progress tracking.",
    descriptionCy:
      "Ap cydymaith dysgu a hyfforddi ar gyfer datblygu sgiliau'n strwythuredig ac olrhain cynnydd.",
    componentPath: "MasteryCompanion",
    href: "/app/mastery",
    status: "demo",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "pma",
    toolName: "PMA",
    description:
      "Production management app for broadcast teams – scheduling, task tracking, and resource planning.",
    descriptionCy:
      "Ap rheoli cynhyrchu ar gyfer timau darlledu - amserlennu, olrhain tasgau, a chynllunio adnoddau.",
    componentPath: "",
    href: "https://pma-nine.vercel.app/",
    status: "live",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "notes",
    toolName: "Notes",
    description:
      "AI-powered notes app with smart organisation and search.",
    descriptionCy:
      "Ap nodiadau gyda chymorth AI, gyda threfnu a chwilio clyfar.",
    componentPath: "",
    href: "https://notes-app-aled-parrys-projects.vercel.app/",
    status: "live",
  },
  {
    clientSlug: "msparc",
    clientName: "M-SPARC",
    toolSlug: "tanio",
    toolName: "Tanio",
    description:
      "Bilingual (EN/CY) QR drive-in ordering demo – scan, order from your car, enter your numberplate, mock payment, then track progress live (received → preparing → on its way → delivered) while it lands on the café staff dashboard. Numberplates power visit stats + a simple loyalty layer.",
    descriptionCy:
      "Demo archebu 'drive-in' dwyieithog (CY/EN) drwy god QR - sganiwch, archebwch o'ch car, rhowch rif eich plât, talu ffug, yna dilynwch y cynnydd yn fyw (derbyniwyd → paratoi → ar y ffordd → danfonwyd) wrth iddo gyrraedd dangosfwrdd staff y caffi. Mae rhifau platiau'n pweru ystadegau ymweld a haen deyrngarwch syml.",
    componentPath: "Tanio",
    status: "demo",
  },
  {
    clientSlug: "aledparry",
    clientName: "Aled Parry",
    toolSlug: "keepitlocal",
    toolName: "Keep it Local",
    description:
      "Community app connecting people with local services, businesses, and events.",
    descriptionCy:
      "Ap cymunedol sy'n cysylltu pobl â gwasanaethau, busnesau a digwyddiadau lleol.",
    componentPath: "KeepItLocal",
    href: "https://deft-alpaca-a1d2aa.netlify.app/",
    status: "live",
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

/** Demos grouped by client, preserving first-appearance order. */
export function getDemosGroupedByClient() {
  const order: string[] = [];
  const groups = new Map<string, DemoEntry[]>();
  for (const d of demos) {
    if (!groups.has(d.clientName)) {
      groups.set(d.clientName, []);
      order.push(d.clientName);
    }
    groups.get(d.clientName)!.push(d);
  }
  return order.map((clientName) => ({ clientName, items: groups.get(clientName)! }));
}
