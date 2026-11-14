/**
 * Builds the single-file offline app:
 *   public/standalone/ankit-traders-billing.html
 *   public/ankit-traders-billing.html  (root copy, served as a direct download)
 *
 * Everything — theme CSS, A5 print CSS, logo, html2canvas-pro + jsPDF, the seed
 * data and the entire app JS — is inlined, so the file can be dropped on
 * Vercel / Netlify / GitHub Pages, opened from a pendrive, or run offline.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const readBuffer = (p) => fs.readFileSync(path.join(root, p));

const template = read("standalone/index.template.html");
const theme = read("src/app/app-theme.css");
const a5 = read("src/app/a5-print.css");
const appJs = read("standalone/app.js");
const seed = JSON.parse(read("src/db/seed-data.json"));
const vendorH2C = read("node_modules/html2canvas-pro/dist/html2canvas-pro.min.js");
const vendorJsPdf = read("node_modules/jspdf/dist/jspdf.umd.min.js");

const fontVars = `:root{--font-display:"Playfair Display",Georgia,"Times New Roman",serif;--font-sans:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}`;

const baseCss = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--canvas,#f5f7f3);color:var(--ink,#17251e);font-family:var(--font-sans);-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer}
input,select,textarea{font-family:inherit}
.standalone-actions{display:grid;gap:6px;margin-top:12px}
.standalone-actions .secondary-button{width:100%;justify-content:center;min-height:34px;font-size:11.5px}
.file-pick{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.file-pick input{position:absolute;inset:0;opacity:0;cursor:pointer}
.a5-preview-frame{overflow:auto}
`;

const logo = `data:image/jpeg;base64,${readBuffer("public/images/ankit-traders-logo.jpg").toString("base64")}`;

// plain split/join replacement (avoids `$` sequences being treated as patterns)
const put = (haystack, token, value) => haystack.split(token).join(value);

let html = template;
html = put(html, "/*__CSS__*/", `${fontVars}\n${baseCss}\n${theme}\n${a5}`);
html = put(html, "/*__LIB_H2C__*/", vendorH2C);
html = put(html, "/*__LIB_JSPDF__*/", vendorJsPdf);
html = put(html, "__SEED_JSON__", JSON.stringify(seed).replace(/</g, "\\u003c"));
html = put(html, "__LOGO_SRC__", logo);
html = put(html, "/*__JS__*/", appJs);

// fail loudly instead of shipping a half-built file
const leftovers = ["/*__CSS__*/", "/*__LIB_H2C__*/", "/*__LIB_JSPDF__*/", "__SEED_JSON__", "__LOGO_SRC__", "/*__JS__*/"].filter(
  (token) => html.includes(token),
);
if (leftovers.length) throw new Error(`Unreplaced tokens: ${leftovers.join(", ")}`);

fs.mkdirSync(path.join(root, "public/standalone"), { recursive: true });
const outputs = [
  path.join(root, "public/standalone/ankit-traders-billing.html"),
  path.join(root, "public/ankit-traders-billing.html"),
];
for (const outFile of outputs) fs.writeFileSync(outFile, html);
console.log(`Wrote single-file app (${(html.length / 1024).toFixed(0)} KB):`);
outputs.forEach((f) => console.log(`  ${path.relative(root, f)}`));
