import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { commitFiles, type CommitFile } from "@/lib/admin/github-commit";

const REPO_OWNER = "aledprysparry";
const REPO_NAME = "aledparry.com";
const REPO_BRANCH = "main";

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

function checkAuth(request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return request.headers.get("x-admin-password") === adminPassword;
}

// ── GET: List all projects or load one by slug ──────────────────────────────
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = request.nextUrl.searchParams.get("slug");
  const caseStudiesDir = path.join(process.cwd(), "content/case-studies");

  // Single project by slug
  if (slug) {
    const mdxPath = path.join(caseStudiesDir, `${slug}.mdx`);
    if (!fs.existsSync(mdxPath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const raw = fs.readFileSync(mdxPath, "utf-8");
    const { data, content } = matter(raw);

    return NextResponse.json({
      slug,
      ...data,
      body: content.trim(),
    });
  }

  // List all projects
  if (!fs.existsSync(caseStudiesDir)) {
    return NextResponse.json([]);
  }
  const files = fs.readdirSync(caseStudiesDir).filter((f) => f.endsWith(".mdx"));
  const projects = files.map((file) => {
    const raw = fs.readFileSync(path.join(caseStudiesDir, file), "utf-8");
    const { data } = matter(raw);
    return {
      slug: file.replace(".mdx", ""),
      title: data.title || file.replace(".mdx", ""),
      client: data.client || "",
      year: data.year || 0,
      type: data.type || "",
      featured: data.featured || false,
      displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : null,
    };
  });
  projects.sort((a, b) => {
    if (a.displayOrder !== null && b.displayOrder !== null) return a.displayOrder - b.displayOrder;
    if (a.displayOrder !== null) return -1;
    if (b.displayOrder !== null) return 1;
    return b.year - a.year;
  });
  return NextResponse.json(projects);
}

// ── POST: Create or update a project ────────────────────────────────────────
export async function POST(request: Request) {
  if (!checkAuth(request)) {
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

  const editSlug = formData.get("editSlug") as string | null; // If present, this is an update
  const title = formData.get("title") as string;
  const titleCy = formData.get("titleCy") as string;
  const client = formData.get("client") as string;
  const year = formData.get("year") as string;
  const displayOrderRaw = formData.get("displayOrder") as string | null;
  const displayOrder = displayOrderRaw && displayOrderRaw.trim() !== "" ? Number(displayOrderRaw) : null;
  const role = formData.get("role") as string;
  const roleCy = formData.get("roleCy") as string;
  const type = formData.get("type") as string;
  const featured = formData.get("featured") === "true";
  const summary = formData.get("summary") as string;
  const summaryCy = formData.get("summaryCy") as string;
  const statsJson = formData.get("stats") as string;
  const testimonialJson = formData.get("testimonial") as string;
  // FormData multipart normalises newlines to CRLF — flatten back to LF for consistent diffs
  const body = ((formData.get("body") as string) || "").replace(/\r\n?/g, "\n");
  const heroImageFile = formData.get("heroImage") as File | null;

  if (!title || !client || !year || !role || !type) {
    return NextResponse.json(
      { error: "Title, client, year, role, and type are required." },
      { status: 400 }
    );
  }

  const caseStudiesDir = path.join(process.cwd(), "content/case-studies");
  const imagesDir = path.join(process.cwd(), "public/images/work");

  // Determine slug: use editSlug for updates, generate new for creates
  const slug = editSlug || slugify(title);
  const mdxPath = path.join(caseStudiesDir, `${slug}.mdx`);

  // For new projects, check duplicate
  if (!editSlug && fs.existsSync(mdxPath)) {
    return NextResponse.json(
      { error: `A project with slug "${slug}" already exists.` },
      { status: 409 }
    );
  }

  // Read existing heroImage path if updating (preserve if no new image uploaded)
  let heroImagePath = `/images/work/${slug}-hero.jpg`;
  if (editSlug && fs.existsSync(mdxPath)) {
    const raw = fs.readFileSync(mdxPath, "utf-8");
    const { data } = matter(raw);
    if (data.heroImage) heroImagePath = data.heroImage;
  }

  // Capture hero image buffer if a new one was uploaded (write below)
  let heroImageBuffer: Buffer | null = null;
  if (heroImageFile && heroImageFile.size > 0) {
    const ext = heroImageFile.name.split(".").pop() || "jpg";
    heroImagePath = `/images/work/${slug}-hero.${ext}`;
    heroImageBuffer = Buffer.from(await heroImageFile.arrayBuffer());
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
  if (displayOrder !== null && Number.isFinite(displayOrder)) {
    lines.push(`displayOrder: ${displayOrder}`);
  }
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

  // Body (raw markdown, written verbatim — supports any section structure)
  if (body.trim()) {
    lines.push(body.trim());
    lines.push("");
  }

  const mdxContent = lines.join("\n");
  const githubToken = process.env.GITHUB_CONTENTS_TOKEN;

  // ── Persistence path A: commit to GitHub (works on Vercel + local) ──────────
  if (githubToken) {
    const filesToCommit: CommitFile[] = [
      { path: `content/case-studies/${slug}.mdx`, content: mdxContent },
    ];
    if (heroImageBuffer) {
      // heroImagePath looks like "/images/work/foo.jpg" — repo path is "public/images/work/foo.jpg"
      filesToCommit.push({
        path: `public${heroImagePath}`,
        content: heroImageBuffer,
      });
    }

    try {
      const result = await commitFiles({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        branch: REPO_BRANCH,
        message: `${editSlug ? "Admin: update" : "Admin: add"} ${title} (${slug})`,
        files: filesToCommit,
        token: githubToken,
      });

      return NextResponse.json({
        success: true,
        slug,
        updated: !!editSlug,
        via: "github",
        commitUrl: result.commitUrl,
        liveInSeconds: 120,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `GitHub commit failed: ${message}` },
        { status: 502 }
      );
    }
  }

  // ── Persistence path B: write to local filesystem (npm run dev fallback) ────
  if (heroImageBuffer) {
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.writeFileSync(path.join(process.cwd(), "public", heroImagePath), heroImageBuffer);
  }
  fs.mkdirSync(caseStudiesDir, { recursive: true });
  fs.writeFileSync(mdxPath, mdxContent, "utf-8");

  return NextResponse.json({ success: true, slug, updated: !!editSlug, via: "filesystem" });
}
