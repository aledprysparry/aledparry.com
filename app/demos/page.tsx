import Link from "next/link";

interface Demo {
  client: string;
  tool: string;
  title: string;
  description: string;
  href: string;
}

const demos: Demo[] = [
  {
    client: "CPS Homes",
    tool: "Social Editor",
    title: "CPS Homes Social Editor",
    description:
      "Visual editor for creating branded social media posts with templates, text overlays, and export to PNG.",
    href: "/demos/cpshomes/socialeditor",
  },
];

export default function DemosIndexPage() {
  return (
    <div className="pt-16 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">
        Demos
      </h1>
      <p className="text-base text-stone-500 mb-12">
        Client demos and prototypes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className="group block border border-stone-200 p-6 hover:border-stone-400 transition-colors"
          >
            <p className="text-xs font-sans font-medium tracking-wider uppercase text-stone-400 mb-2">
              {demo.client}
            </p>
            <h2 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-accent-dark transition-colors mb-2">
              {demo.tool}
            </h2>
            <p className="text-sm text-stone-600">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
