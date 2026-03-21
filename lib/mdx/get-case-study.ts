import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CaseStudy, CaseStudyFrontmatter } from "./types";

const CASE_STUDIES_DIR = path.join(process.cwd(), "content/case-studies");

export function getCaseStudy(slug: string): CaseStudy | null {
  const filePath = path.join(CASE_STUDIES_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    frontmatter: data as CaseStudyFrontmatter,
    content,
  };
}
