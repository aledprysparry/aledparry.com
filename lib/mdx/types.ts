export interface CaseStudyFrontmatter {
  title: string;
  titleCy?: string;
  client: string;
  year: number;
  role: string;
  roleCy?: string;
  type: "broadcast" | "digital" | "content" | "format";
  heroImage: string;
  featured: boolean;
  summary?: string;
  summaryCy?: string;
  stats?: Array<{ label: string; labelCy?: string; value: string }>;
  testimonial?: {
    quote: string;
    quoteCy?: string;
    author: string;
    role: string;
  };
}

export interface CaseStudy {
  slug: string;
  frontmatter: CaseStudyFrontmatter;
  content: string;
}
