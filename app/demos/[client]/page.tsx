import { notFound } from "next/navigation";
import Link from "next/link";

const clientDemos: Record<string, Array<{ tool: string; title: string; href: string }>> = {
  cpshomes: [
    {
      tool: "socialeditor",
      title: "Social Editor",
      href: "/demos/cpshomes/socialeditor",
    },
  ],
};

interface Props {
  params: { client: string };
}

export default function ClientDemosPage({ params }: Props) {
  const demos = clientDemos[params.client];
  if (!demos) notFound();

  return (
    <div className="pt-16 px-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-stone-900 mb-8 capitalize">
        {params.client}
      </h1>
      <div className="space-y-4">
        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className="block border border-stone-200 p-6 hover:border-stone-400 transition-colors"
          >
            <h2 className="text-lg font-serif font-semibold text-stone-900">
              {demo.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
