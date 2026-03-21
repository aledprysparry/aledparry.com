import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemosByClient } from "@/content/demos.config";

interface Props {
  params: { client: string };
}

export default function ClientDemosPage({ params }: Props) {
  const demos = getDemosByClient(params.client);
  if (demos.length === 0) notFound();

  return (
    <div className="pt-16 px-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-bold text-stone-900 mb-8">
        {demos[0].clientName}
      </h1>
      <div className="space-y-4">
        {demos.map((demo) => (
          <Link
            key={demo.toolSlug}
            href={`/app/${demo.clientSlug}/${demo.toolSlug}`}
            className="block border border-stone-200 p-6 hover:border-stone-400 transition-colors"
          >
            <h2 className="text-lg font-serif font-semibold text-stone-900">
              {demo.toolName}
            </h2>
            <p className="text-sm text-stone-600 mt-1">{demo.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
