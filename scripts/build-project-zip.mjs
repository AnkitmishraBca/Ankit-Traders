/**
 * Builds the downloadable full-source ZIP:
 *   public/ankit-traders-project.zip
 *
 * Contains every file needed to deploy the Next.js + PostgreSQL app on Vercel
 * (and to rebuild the single-file offline app), excluding node_modules, .next,
 * .env and generated artefacts.
 */
import fs from "node:fs";
import path from "node:path";
import archiver from "archiver";

const root = process.cwd();
const zipName = "ankit-traders-project.zip";
const topFolder = "ankit-traders-billing";

const includeFiles = [
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "drizzle.config.json",
  "vercel.json",
  "README.md",
  "DEPLOY.md",
  ".env.example",
  ".gitignore",
  "scripts/build-standalone.mjs",
  "scripts/build-project-zip.mjs",
  "standalone/index.template.html",
  "standalone/app.js",
  "public/manifest.json",
  "public/images/ankit-traders-logo.jpg",
];

const includeDirs = ["src"];

const skip = (absPath) => {
  const rel = path.relative(root, absPath).split(path.sep).join("/");
  if (rel.startsWith("node_modules") || rel.startsWith(".next") || rel.startsWith(".git")) return true;
  if (rel === "public/ankit-traders-billing.html") return true;
  if (rel.startsWith("public/standalone")) return true;
  if (rel === `public/${zipName}`) return true;
  if (rel.endsWith(".zip")) return true;
  if (rel.startsWith(".env") && rel !== ".env.example") return true;
  return false;
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (skip(abs)) continue;
    if (entry.isDirectory()) walk(abs, out);
    else out.push(abs);
  }
  return out;
}

const files = new Set();
for (const rel of includeFiles) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) files.add(abs);
  else console.warn(`  (missing, skipped) ${rel}`);
}
for (const dir of includeDirs) {
  const abs = path.join(root, dir);
  if (fs.existsSync(abs)) walk(abs).forEach((file) => files.add(file));
}

fs.mkdirSync(path.join(root, "public"), { recursive: true });
const outFile = path.join(root, "public", zipName);
const output = fs.createWriteStream(outFile);
const archive = archiver("zip", { zlib: { level: 9 } });

const done = new Promise((resolve, reject) => {
  output.on("close", resolve);
  output.on("error", reject);
  archive.on("warning", (err) => (err.code === "ENOENT" ? console.warn(err.message) : reject(err)));
  archive.on("error", reject);
});

archive.pipe(output);

archive.append(
  `Ankit Traders Billing — full source code

Deploy on Vercel:
  1) Create a repository and push this folder, or upload it via GitHub "Add file → Upload files".
  2) Create a free PostgreSQL database (Neon / Supabase / Railway / Vercel Postgres).
  3) Import the repo at https://vercel.com/new, framework preset "Next.js".
  4) Add environment variable DATABASE_URL with your Postgres connection string.
  5) Deploy, then run "npx drizzle-kit push" once against that DATABASE_URL to create tables.

Included fixes:
  * Print: @page { size: A5 portrait; margin: 10mm }
  * PDF / JPG: exact A5 (148 x 210 mm), html2canvas scale: 3 (~300 DPI, JPEG 0.96)
  * Everything else unchanged (design, entries, 5 tabs, 48-month archive, reports)

Need a no-server version? See public/ankit-traders-billing.html (single-file offline app)
or run "node scripts/build-standalone.mjs" to rebuild it.

Full instructions: README.md and DEPLOY.md
`,
  { name: `${topFolder}/START-HERE.txt` },
);

const sorted = [...files].sort();
for (const abs of sorted) {
  archive.file(abs, { name: `${topFolder}/${path.relative(root, abs).split(path.sep).join("/")}` });
}

// ship the ready-made offline copy as well (no build needed on the new host)
const offline = path.join(root, "public", "ankit-traders-billing.html");
if (fs.existsSync(offline)) {
  archive.file(offline, { name: `${topFolder}/offline/ankit-traders-billing.html` });
}
const offlineZip = path.join(root, "public", "ankit-traders-project.zip");
void offlineZip;

await archive.finalize();
await done;

const size = fs.statSync(outFile).size;
console.log(`Wrote public/${zipName} (${(size / 1024).toFixed(0)} KB, ${sorted.length} files)`);
