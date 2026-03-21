import { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h1: (props) => (
    <h1 className="text-3xl md:text-4xl font-serif font-bold mt-12 mb-6" {...props} />
  ),
  h2: (props) => (
    <h2 className="text-2xl md:text-3xl font-serif font-bold mt-10 mb-4" {...props} />
  ),
  h3: (props) => (
    <h3 className="text-xl md:text-2xl font-serif font-semibold mt-8 mb-3" {...props} />
  ),
  p: (props) => (
    <p className="text-base md:text-lg leading-relaxed text-stone-700 mb-6" {...props} />
  ),
  ul: (props) => (
    <ul className="list-disc list-inside space-y-2 mb-6 text-stone-700" {...props} />
  ),
  ol: (props) => (
    <ol className="list-decimal list-inside space-y-2 mb-6 text-stone-700" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-accent pl-6 py-2 my-8 italic text-stone-600"
      {...props}
    />
  ),
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="rounded-lg my-8 w-full" alt={props.alt || ""} {...props} />
  ),
  a: (props) => (
    <a
      className="text-accent-dark underline underline-offset-2 hover:text-stone-900 transition-colors"
      {...props}
    />
  ),
};
