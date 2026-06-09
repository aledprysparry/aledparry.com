"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppGate from "@/components/app/AppGate";
import { FadeIn } from "@/components/ui/FadeIn";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/i18n/context";
import {
  getAllDemos,
  type DemoEntry,
  type DemoStatus,
} from "@/content/demos.config";

const COPY = {
  en: {
    eyebrow: "Showcase",
    title: "Things I design and build",
    intro:
      "Interactive demos, client tools and shipped products - bilingual Welsh/English, designed and built end to end.",
    all: "All",
    status: { live: "Live", demo: "Demo", soon: "Coming soon" },
    open: "Open demo",
    visit: "Visit site",
    projects: "projects",
    clients: "clients",
    welshFirst: "Welsh-first",
  },
  cy: {
    eyebrow: "Arddangosfa",
    title: "Pethau dwi'n eu dylunio a'u datblygu",
    intro:
      "Demos rhyngweithiol, offer i gleientiaid a chynnyrch byw - yn ddwyieithog, Cymraeg a Saesneg, wedi'u dylunio a'u hadeiladu o'r dechrau i'r diwedd.",
    all: "Pawb",
    status: { live: "Byw", demo: "Demo", soon: "Yn dod" },
    open: "Agor demo",
    visit: "Ymweld",
    projects: "prosiect",
    clients: "cleient",
    welshFirst: "Cymraeg yn gyntaf",
  },
} as const;

// Per-client visual identity: gradient cover + monogram. Gives the
// showcase visual richness without per-project screenshot assets.
const CLIENT_VISUAL: Record<string, { from: string; to: string; mono: string }> = {
  momentwm: { from: "#7c3aed", to: "#a855f7", mono: "M" },
  cpshomes: { from: "#2563eb", to: "#38bdf8", mono: "CPS" },
  s4c: { from: "#0d9488", to: "#34d399", mono: "S4C" },
  tinopolis: { from: "#d97706", to: "#fbbf24", mono: "T" },
  aledparry: { from: "#475569", to: "#94a3b8", mono: "AP" },
  msparc: { from: "#e11d48", to: "#fb7185", mono: "MS" },
};
const FALLBACK_VISUAL = { from: "#475569", to: "#94a3b8", mono: "•" };

const STATUS_ORDER: Record<DemoStatus, number> = { live: 0, demo: 1, soon: 2 };

function hrefFor(demo: DemoEntry): string {
  return demo.href || `/app/${demo.clientSlug}/${demo.toolSlug}`;
}

function StatusPill({ status, label }: { status: DemoStatus; label: string }) {
  const dot =
    status === "live" ? "bg-emerald-500" : status === "demo" ? "bg-sky-500" : "bg-stone-400";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider text-stone-700 shadow-sm backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ProjectCard({ demo, locale }: { demo: DemoEntry; locale: "en" | "cy" }) {
  const c = COPY[locale];
  const description = locale === "cy" ? demo.descriptionCy : demo.description;
  const href = hrefFor(demo);
  const isExternal = /^https?:\/\//.test(href);
  const isSoon = demo.status === "soon";
  const vis = CLIENT_VISUAL[demo.clientSlug] ?? FALLBACK_VISUAL;

  const inner = (
    <>
      {/* gradient cover */}
      <div
        className="relative h-32 overflow-hidden"
        style={{ backgroundImage: `linear-gradient(135deg, ${vis.from}, ${vis.to})` }}
      >
        {/* dot texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.22)_1px,transparent_0)] [background-size:14px_14px] opacity-60" />
        {/* monogram */}
        <span className="absolute -bottom-3 left-4 select-none font-serif text-6xl font-bold leading-none text-white/25 transition-transform duration-300 group-hover:scale-105">
          {vis.mono}
        </span>
        <div className="absolute right-3 top-3">
          <StatusPill status={demo.status} label={c.status[demo.status]} />
        </div>
      </div>
      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-[11px] font-sans font-semibold uppercase tracking-[0.14em] text-stone-400">
          {demo.clientName}
        </p>
        <h3 className="mb-2 font-serif text-lg font-semibold text-stone-900 transition-colors group-hover:text-accent-dark">
          {demo.toolName}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">{description}</p>
        {!isSoon && (
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-sans font-medium text-stone-500 transition-colors group-hover:text-stone-900">
            {isExternal ? c.visit : c.open}
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              {isExternal ? "↗" : "→"}
            </span>
          </span>
        )}
      </div>
    </>
  );

  const base =
    "group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-300 motion-reduce:transition-none";
  const interactive =
    "hover:-translate-y-1 hover:border-stone-300 hover:shadow-[0_18px_50px_-12px_rgba(15,23,42,0.18)] motion-reduce:hover:translate-y-0";

  if (isSoon) return <div className={`${base} opacity-75`}>{inner}</div>;
  if (isExternal)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${interactive}`}>
        {inner}
      </a>
    );
  return (
    <Link href={href} className={`${base} ${interactive}`}>
      {inner}
    </Link>
  );
}

export default function DemosIndexPage() {
  const { locale } = useLanguage();
  const c = COPY[locale];
  const all = getAllDemos();
  const [filter, setFilter] = useState<string>("all");

  // Filter options: All + each client (first-appearance order).
  const clients = useMemo(() => {
    const seen: { slug: string; name: string }[] = [];
    for (const d of all) {
      if (!seen.some((s) => s.slug === d.clientSlug)) {
        seen.push({ slug: d.clientSlug, name: d.clientName });
      }
    }
    return seen;
  }, [all]);

  const visible = useMemo(() => {
    const list = filter === "all" ? all : all.filter((d) => d.clientSlug === filter);
    return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [all, filter]);

  return (
    <AppGate>
      <div className="min-h-screen bg-stone-50">
        {/* ambient top gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-stone-100/80 to-transparent" />

        {/* slim sticky bar */}
        <div className="sticky top-0 z-20 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link
              href="/"
              className="font-serif text-sm font-bold text-stone-900 transition-colors hover:text-accent-dark"
            >
              Aled Parry
            </Link>
            <LanguageToggle />
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16">
          {/* hero */}
          <FadeIn>
            <p className="mb-3 text-xs font-sans font-semibold uppercase tracking-[0.2em] text-accent">
              {c.eyebrow}
            </p>
            <h1 className="mb-4 max-w-2xl font-serif text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
              {c.title}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-stone-500 md:text-lg">
              {c.intro}
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-400">
              <span className="font-semibold text-stone-600">{all.length}</span> {c.projects}
              <span className="text-stone-300">·</span>
              <span className="font-semibold text-stone-600">{clients.length}</span> {c.clients}
              <span className="text-stone-300">·</span>
              <span>{c.welshFirst}</span>
            </p>
          </FadeIn>

          {/* filter chips */}
          <FadeIn delay={80}>
            <div className="mt-10 flex flex-wrap gap-2">
              {[{ slug: "all", name: c.all }, ...clients].map((opt) => {
                const active = filter === opt.slug;
                return (
                  <button
                    key={opt.slug}
                    onClick={() => setFilter(opt.slug)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-sans font-medium transition-colors ${
                      active
                        ? "bg-stone-900 text-white"
                        : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                    }`}
                  >
                    {opt.name}
                  </button>
                );
              })}
            </div>
          </FadeIn>

          {/* grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((demo, i) => (
              <FadeIn key={`${demo.clientSlug}/${demo.toolSlug}`} delay={(i % 3) * 70}>
                <ProjectCard demo={demo} locale={locale} />
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </AppGate>
  );
}
