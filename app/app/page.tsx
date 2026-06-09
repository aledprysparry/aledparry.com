"use client";

import Link from "next/link";
import AppGate from "@/components/app/AppGate";
import { FadeIn } from "@/components/ui/FadeIn";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/i18n/context";
import {
  getDemosGroupedByClient,
  type DemoEntry,
  type DemoStatus,
} from "@/content/demos.config";

const COPY = {
  en: {
    eyebrow: "Showcase",
    title: "Things I design and build",
    intro:
      "A selection of interactive demos, client tools and shipped products - bilingual Welsh/English, designed and built end to end.",
    status: { live: "Live", demo: "Demo", soon: "Coming soon" },
    open: "Open",
    visit: "Visit site",
  },
  cy: {
    eyebrow: "Arddangosfa",
    title: "Pethau dwi'n eu dylunio a'u datblygu",
    intro:
      "Detholiad o ddemos rhyngweithiol, offer i gleientiaid a chynnyrch byw - yn ddwyieithog, Cymraeg a Saesneg, wedi'u dylunio a'u hadeiladu o'r dechrau i'r diwedd.",
    status: { live: "Byw", demo: "Demo", soon: "Yn dod yn fuan" },
    open: "Agor",
    visit: "Ymweld",
  },
} as const;

function statusClasses(s: DemoStatus): string {
  switch (s) {
    case "live":
      return "text-emerald-700 bg-emerald-50 ring-1 ring-inset ring-emerald-600/20";
    case "demo":
      return "text-accent-dark bg-stone-100 ring-1 ring-inset ring-stone-300/70";
    case "soon":
      return "text-stone-400 bg-stone-50 ring-1 ring-inset ring-stone-200";
  }
}

function hrefFor(demo: DemoEntry): string {
  return demo.href || `/app/${demo.clientSlug}/${demo.toolSlug}`;
}

function DemoCard({ demo, locale }: { demo: DemoEntry; locale: "en" | "cy" }) {
  const c = COPY[locale];
  const description = locale === "cy" ? demo.descriptionCy : demo.description;
  const href = hrefFor(demo);
  const isExternal = /^https?:\/\//.test(href);
  const isSoon = demo.status === "soon";

  const body = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-accent-dark transition-colors">
          {demo.toolName}
        </h3>
        <span
          className={`shrink-0 text-[10px] font-sans font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${statusClasses(
            demo.status
          )}`}
        >
          {c.status[demo.status]}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-stone-600">{description}</p>
      {!isSoon && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-sans font-medium text-stone-500 group-hover:text-stone-900 transition-colors">
          {isExternal ? c.visit : c.open}
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            {isExternal ? "↗" : "→"}
          </span>
        </span>
      )}
    </>
  );

  const cardClass =
    "group relative block h-full border border-stone-200 bg-white p-6 transition-all duration-200";
  const liveClass =
    "hover:border-stone-400 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]";

  if (isSoon) {
    return <div className={`${cardClass} opacity-70`}>{body}</div>;
  }
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cardClass} ${liveClass}`}
      >
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className={`${cardClass} ${liveClass}`}>
      {body}
    </Link>
  );
}

export default function DemosIndexPage() {
  const { locale } = useLanguage();
  const c = COPY[locale];
  const groups = getDemosGroupedByClient();

  let cardIndex = 0;

  return (
    <AppGate>
      <div className="min-h-screen bg-stone-50">
        {/* slim showcase top bar */}
        <div className="sticky top-0 z-10 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm font-serif font-bold text-stone-900 hover:text-accent-dark transition-colors"
            >
              Aled Parry
            </Link>
            <LanguageToggle />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-16 pb-24">
          {/* hero */}
          <FadeIn>
            <p className="text-xs font-sans font-semibold tracking-[0.2em] uppercase text-accent mb-3">
              {c.eyebrow}
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4 max-w-2xl leading-tight">
              {c.title}
            </h1>
            <p className="text-base md:text-lg text-stone-500 max-w-2xl leading-relaxed">
              {c.intro}
            </p>
          </FadeIn>

          {/* grouped by client */}
          <div className="mt-16 space-y-14">
            {groups.map((group) => (
              <section key={group.clientName}>
                <div className="flex items-baseline gap-3 mb-5">
                  <h2 className="text-xs font-sans font-semibold tracking-[0.18em] uppercase text-stone-500">
                    {group.clientName}
                  </h2>
                  <span className="h-px flex-1 bg-stone-200" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.items.map((demo) => {
                    const delay = (cardIndex % 4) * 70;
                    cardIndex += 1;
                    return (
                      <FadeIn
                        key={`${demo.clientSlug}/${demo.toolSlug}`}
                        delay={delay}
                      >
                        <DemoCard demo={demo} locale={locale} />
                      </FadeIn>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </AppGate>
  );
}
