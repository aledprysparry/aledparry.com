import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { CaseStudy, CaseStudyFrontmatter } from "./types";

const CASE_STUDIES_DIR = path.join(process.cwd(), "content/case-studies");

export function getCaseStudies(): CaseStudy[] {
  if (!fs.existsSync(CASE_STUDIES_DIR)) return [];

  const files = fs
    .readdirSync(CASE_STUDIES_DIR)
    .filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const filePath = path.join(CASE_STUDIES_DIR, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(raw);

      return {
        slug: filename.replace(/\.mdx$/, ""),
        frontmatter: data as CaseStudyFrontmatter,
        content,
      };
    })
    .sort((a, b) => b.frontmatter.year - a.frontmatter.year);
}

export function getFeaturedCaseStudies(): CaseStudy[] {
  return getCaseStudies().filter((cs) => cs.frontmatter.featured);
}
