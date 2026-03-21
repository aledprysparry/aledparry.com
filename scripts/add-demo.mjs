#!/usr/bin/env node

/**
 * Add Demo Script
 *
 * Copies a React component (file or folder) into the portfolio's demos system
 * and wires up all the config + routing automatically.
 *
 * Usage:
 *   npm run add-demo -- --source /path/to/component --client cpshomes --tool socialeditor
 *   npm run add-demo -- --source /path/to/folder --client cpshomes --tool socialeditor --name "Social Editor" --desc "Visual post editor"
 *
 * What it does:
 *   1. Copies source file/folder to components/demos/[ComponentName].tsx (or folder)
 *   2. Adds entry to content/demos.config.ts
 *   3. Adds dynamic import to app/app/[client]/[tool]/page.tsx
 *   4. Lists any external imports that might need installing
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Parse args
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const source = getArg("source");
const clientSlug = getArg("client");
const toolSlug = getArg("tool");
const clientName = getArg("clientName") || getArg("client-name") || clientSlug;
const toolName = getArg("name") || getArg("tool-name") || toolSlug;
const description = getArg("desc") || getArg("description") || "";

if (!source || !clientSlug || !toolSlug) {
  console.error(`
Usage: npm run add-demo -- --source <path> --client <slug> --tool <slug> [options]

Required:
  --source <path>      Path to component file or folder
  --client <slug>      Client URL slug (e.g. cpshomes)
  --tool <slug>        Tool URL slug (e.g. socialeditor)

Optional:
  --client-name <name> Display name for client (default: client slug)
  --name <name>        Display name for tool (default: tool slug)
  --desc <text>        Short description

Example:
  npm run add-demo -- --source ../social-editor/src/App.tsx \\
    --client cpshomes --tool socialeditor \\
    --client-name "CPS Homes" --name "Social Editor" \\
    --desc "Visual editor for branded social media posts"
  `);
  process.exit(1);
}

// Derive component name from tool slug (PascalCase)
const componentName = toolSlug
  .split(/[-_]/)
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");

const demosDir = path.join(ROOT, "components/demos");
const sourcePath = path.resolve(source);

if (!fs.existsSync(sourcePath)) {
  console.error(`Source not found: ${sourcePath}`);
  process.exit(1);
}

const isDir = fs.statSync(sourcePath).isDirectory();

console.log(`\n📦 Adding demo: ${clientName}/${toolName}`);
console.log(`   Component: ${componentName}`);
console.log(`   Source: ${sourcePath}`);
console.log(`   Route: /app/${clientSlug}/${toolSlug}\n`);

// Step 1: Copy source
if (isDir) {
  const targetDir = path.join(demosDir, componentName.toLowerCase());
  fs.mkdirSync(targetDir, { recursive: true });

  // Copy all files recursively
  function copyDir(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
  copyDir(sourcePath, targetDir);

  // Create barrel export if it doesn't exist
  const barrelPath = path.join(demosDir, `${componentName}.tsx`);
  if (!fs.existsSync(barrelPath)) {
    // Try to find the main component file
    const candidates = ["App.tsx", "App.jsx", "index.tsx", "index.jsx", `${componentName}.tsx`, `${componentName}.jsx`];
    let mainFile = null;
    for (const c of candidates) {
      if (fs.existsSync(path.join(targetDir, c))) {
        mainFile = c;
        break;
      }
    }

    if (mainFile) {
      const importPath = `./${componentName.toLowerCase()}/${mainFile.replace(/\.(tsx|jsx)$/, "")}`;
      fs.writeFileSync(
        barrelPath,
        `"use client";\nexport { default } from "${importPath}";\n`
      );
      console.log(`✅ Created barrel: components/demos/${componentName}.tsx → ${importPath}`);
    } else {
      console.warn(`⚠️  Could not find main component file in ${targetDir}`);
      console.warn(`   Create components/demos/${componentName}.tsx manually`);
    }
  }
  console.log(`✅ Copied folder to components/demos/${componentName.toLowerCase()}/`);
} else {
  // Single file
  const ext = path.extname(sourcePath);
  const targetPath = path.join(demosDir, `${componentName}${ext}`);
  let content = fs.readFileSync(sourcePath, "utf-8");

  // Ensure "use client" directive
  if (!content.includes('"use client"') && !content.includes("'use client'")) {
    content = '"use client";\n\n' + content;
  }

  fs.writeFileSync(targetPath, content);
  console.log(`✅ Copied to components/demos/${componentName}${ext}`);
}

// Step 2: Update demos.config.ts
const configPath = path.join(ROOT, "content/demos.config.ts");
let configContent = fs.readFileSync(configPath, "utf-8");

// Check if entry already exists
if (configContent.includes(`toolSlug: "${toolSlug}"`) && configContent.includes(`clientSlug: "${clientSlug}"`)) {
  console.log(`ℹ️  Config entry already exists for ${clientSlug}/${toolSlug}`);
} else {
  const newEntry = `  {
    clientSlug: "${clientSlug}",
    clientName: "${clientName}",
    toolSlug: "${toolSlug}",
    toolName: "${toolName}",
    description: "${description.replace(/"/g, '\\"')}",
    componentPath: "${componentName}",
  },`;

  // Insert before the closing bracket of the array
  const insertPoint = configContent.lastIndexOf("];");
  configContent =
    configContent.slice(0, insertPoint) + newEntry + "\n" + configContent.slice(insertPoint);
  fs.writeFileSync(configPath, configContent);
  console.log(`✅ Added config entry to demos.config.ts`);
}

// Step 3: Update component map in page.tsx
const toolPagePath = path.join(ROOT, "app/app/[client]/[tool]/page.tsx");
let toolPageContent = fs.readFileSync(toolPagePath, "utf-8");

if (toolPageContent.includes(`${componentName}:`)) {
  console.log(`ℹ️  Component map already has ${componentName}`);
} else {
  // Find the closing of componentMap and insert before it
  const mapEnd = toolPageContent.indexOf("// When you add");
  if (mapEnd !== -1) {
    const insertion = `  ${componentName}: dynamic(\n    () => import("@/components/demos/${componentName}"),\n    { ssr: false, loading: () => <DemoLoading /> }\n  ),\n`;
    toolPageContent =
      toolPageContent.slice(0, mapEnd) + insertion + "  " + toolPageContent.slice(mapEnd);
  } else {
    // Fallback: insert before closing brace of componentMap
    const closeBrace = toolPageContent.indexOf("};", toolPageContent.indexOf("componentMap"));
    const insertion = `  ${componentName}: dynamic(\n    () => import("@/components/demos/${componentName}"),\n    { ssr: false, loading: () => <DemoLoading /> }\n  ),\n`;
    toolPageContent =
      toolPageContent.slice(0, closeBrace) + insertion + toolPageContent.slice(closeBrace);
  }
  fs.writeFileSync(toolPagePath, toolPageContent);
  console.log(`✅ Added dynamic import to component map`);
}

// Step 4: Scan for external imports that might need installing
const packageJsonPath = path.join(ROOT, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
const installedDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

function findImports(dir) {
  const imports = new Set();
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.isDirectory()) {
      findImports(path.join(dir, f.name)).forEach((i) => imports.add(i));
    } else if (/\.(tsx?|jsx?)$/.test(f.name)) {
      const content = fs.readFileSync(path.join(dir, f.name), "utf-8");
      const importMatches = content.matchAll(/(?:import|from)\s+['"]([^./][^'"]*)['"]/g);
      for (const m of importMatches) {
        const pkg = m[1].startsWith("@") ? m[1].split("/").slice(0, 2).join("/") : m[1].split("/")[0];
        if (!installedDeps[pkg] && pkg !== "react" && pkg !== "react-dom" && pkg !== "next") {
          imports.add(pkg);
        }
      }
    }
  }
  return imports;
}

const scanDir = isDir ? path.join(demosDir, componentName.toLowerCase()) : demosDir;
const missingDeps = findImports(scanDir);
if (missingDeps.size > 0) {
  console.log(`\n⚠️  Possibly missing dependencies:`);
  console.log(`   npm install ${[...missingDeps].join(" ")}\n`);
} else {
  console.log(`\n✅ No missing dependencies detected`);
}

console.log(`\n🎉 Done! Demo available at: /app/${clientSlug}/${toolSlug}`);
console.log(`   Run 'npm run dev' and visit http://localhost:3000/app/${clientSlug}/${toolSlug}\n`);
