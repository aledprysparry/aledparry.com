import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/lib/mdx-components";

interface CaseStudyContentProps {
  content: string;
}

export function CaseStudyContent({ content }: CaseStudyContentProps) {
  return (
    <article className="prose-custom max-w-3xl">
      <MDXRemote source={content} components={mdxComponents} />
    </article>
  );
}
