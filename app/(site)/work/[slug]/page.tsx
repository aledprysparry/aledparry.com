import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCaseStudies } from "@/lib/mdx/get-case-studies";
import { getCaseStudy } from "@/lib/mdx/get-case-study";
import { Container } from "@/components/ui/Container";
import { CaseStudyHeader } from "@/components/sections/CaseStudyHeader";
import { CaseStudyContent } from "@/components/sections/CaseStudyContent";
import { StatRow } from "@/components/sections/StatRow";
import { CaseStudyNav } from "@/components/sections/CaseStudyNav";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getCaseStudies().map((cs) => ({ slug: cs.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const cs = getCaseStudy(params.slug);
  if (!cs) return {};

  const { title, client, summary, heroImage, role, type } = cs.frontmatter;
  const metaTitle = `${title} — ${client} | ${type?.charAt(0).toUpperCase()}${type?.slice(1)} Project`;
  const metaDescription =
    summary || `${title} for ${client} — ${role}. A ${type} project by Aled Parry.`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: { canonical: `https://aledparry.com/work/${params.slug}` },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: heroImage ? [{ url: heroImage }] : undefined,
    },
  };
}

export default function CaseStudyPage({ params }: Props) {
  const cs = getCaseStudy(params.slug);
  if (!cs) notFound();

  const all = getCaseStudies();
  const idx = all.findIndex((c) => c.slug === params.slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <section className="py-24">
      <Container>
        {/* Hero image */}
        <div className="aspect-[21/9] bg-stone-200 mb-12 overflow-hidden">
          {cs.frontmatter.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cs.frontmatter.heroImage}
              alt={cs.frontmatter.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <CaseStudyHeader frontmatter={cs.frontmatter} />

        <CaseStudyContent content={cs.content} />

        {cs.frontmatter.stats && <StatRow stats={cs.frontmatter.stats} />}

        {cs.frontmatter.testimonial && (
          <blockquote className="border-l-4 border-accent pl-6 py-4 my-12 max-w-3xl">
            <p className="text-lg italic text-stone-700 mb-4">
              &ldquo;{cs.frontmatter.testimonial.quote}&rdquo;
            </p>
            <footer className="text-sm text-stone-500">
              <strong className="text-stone-700">
                {cs.frontmatter.testimonial.author}
              </strong>
              , {cs.frontmatter.testimonial.role}
            </footer>
          </blockquote>
        )}

        <CaseStudyNav
          prev={
            prev
              ? {
                  slug: prev.slug,
                  title: prev.frontmatter.title,
                  titleCy: prev.frontmatter.titleCy,
                }
              : null
          }
          next={
            next
              ? {
                  slug: next.slug,
                  title: next.frontmatter.title,
                  titleCy: next.frontmatter.titleCy,
                }
              : null
          }
        />
      </Container>
    </section>
  );
}
