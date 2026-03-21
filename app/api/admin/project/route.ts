import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeYaml(str: string): string {
  if (!str) return '""';
  if (str.includes('"') || str.includes(":") || str.includes("#") || str.includes("\n")) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return `"${str}"`;
}

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 401 });
  }

  const providedPassword = request.headers.get("x-admin-password");
  if (providedPassword !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auth check only
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await request.json();
    if (json._authCheck) {
      return NextResponse.json({ success: true });
    }
  }

  // Parse form data
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const titleCy = formData.get("titleCy") as string;
  const client = formData.get("client") as string;
  const year = formData.get("year") as string;
  const role = formData.get("role") as string;
  const roleCy = formData.get("roleCy") as string;
  const type = formData.get("type") as string;
  const featured = formData.get("featured") === "true";
  const summary = formData.get("summary") as string;
  const summaryCy = formData.get("summaryCy") as string;
  const statsJson = formData.get("stats") as string;
  const testimonialJson = formData.get("testimonial") as string;
  const brief = formData.get("brief") as string;
  const myRole = formData.get("myRole") as string;
  const approach = formData.get("approach") as string;
  const outcome = formData.get("outcome") as string;
  const heroImageFile = formData.get("heroImage") as File | null;

  if (!title || !client || !year || !role || !type) {
    return NextResponse.json(
      { error: "Title, client, year, role, and type are required." },
      { status: 400 }
    );
  }

  const slug = slugify(title);
  const caseStudiesDir = path.join(process.cwd(), "content/case-studies");
  const imagesDir = path.join(process.cwd(), "public/images/work");

  // Check if slug already exists
  const mdxPath = path.join(caseStudiesDir, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) {
    return NextResponse.json(
      { error: `A project with slug "${slug}" already exists.` },
      { status: 409 }
    );
  }

  // Save hero image
  let heroImagePath = `/images/work/${slug}-hero.jpg`;
  if (heroImageFile && heroImageFile.size > 0) {
    const ext = heroImageFile.name.split(".").pop() || "jpg";
    heroImagePath = `/images/work/${slug}-hero.${ext}`;
    const buffer = Buffer.from(await heroImageFile.arrayBuffer());
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.writeFileSync(path.join(process.cwd(), "public", heroImagePath), buffer);
  }

  // Build frontmatter
  const lines: string[] = [
    "---",
    `title: ${escapeYaml(title)}`,
  ];

  if (titleCy) lines.push(`titleCy: ${escapeYaml(titleCy)}`);
  lines.push(`client: ${escapeYaml(client)}`);
  lines.push(`year: ${year}`);
  lines.push(`role: ${escapeYaml(role)}`);
  if (roleCy) lines.push(`roleCy: ${escapeYaml(roleCy)}`);
  lines.push(`type: ${escapeYaml(type)}`);
  lines.push(`heroImage: ${escapeYaml(heroImagePath)}`);
  lines.push(`featured: ${featured}`);
  if (summary) lines.push(`summary: ${escapeYaml(summary)}`);
  if (summaryCy) lines.push(`summaryCy: ${escapeYaml(summaryCy)}`);

  // Stats
  const stats = statsJson ? JSON.parse(statsJson) : [];
  if (stats.length > 0) {
    lines.push("stats:");
    for (const stat of stats) {
      lines.push(`  - label: ${escapeYaml(stat.label)}`);
      if (stat.labelCy) lines.push(`    labelCy: ${escapeYaml(stat.labelCy)}`);
      lines.push(`    value: ${escapeYaml(stat.value)}`);
    }
  }

  // Testimonial
  if (testimonialJson) {
    const testimonial = JSON.parse(testimonialJson);
    if (testimonial.quote) {
      lines.push("testimonial:");
      lines.push(`  quote: ${escapeYaml(testimonial.quote)}`);
      if (testimonial.quoteCy) lines.push(`  quoteCy: ${escapeYaml(testimonial.quoteCy)}`);
      if (testimonial.author) lines.push(`  author: ${escapeYaml(testimonial.author)}`);
      if (testimonial.role) lines.push(`  role: ${escapeYaml(testimonial.role)}`);
    }
  }

  lines.push("---");
  lines.push("");

  // Body sections
  if (brief) {
    lines.push("## The Brief");
    lines.push("");
    lines.push(brief.trim());
    lines.push("");
  }

  if (myRole) {
    lines.push("## My Role");
    lines.push("");
    lines.push(myRole.trim());
    lines.push("");
  }

  if (approach) {
    lines.push("## Approach");
    lines.push("");
    lines.push(approach.trim());
    lines.push("");
  }

  if (outcome) {
    lines.push("## Outcome");
    lines.push("");
    lines.push(outcome.trim());
    lines.push("");
  }

  // Write MDX file
  fs.mkdirSync(caseStudiesDir, { recursive: true });
  fs.writeFileSync(mdxPath, lines.join("\n"), "utf-8");

  return NextResponse.json({ success: true, slug });
}
