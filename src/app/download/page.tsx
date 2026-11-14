import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Download Ankit Traders Billing — full source ZIP & offline app",
  description:
    "Download the complete Ankit Traders billing project as a ZIP (Next.js + PostgreSQL) or as a single offline HTML file. Includes the A5 print, A5 PDF and A5 JPG (html2canvas scale 3) fixes. Ready for Vercel, Netlify or GitHub Pages.",
};

const updates = [
  {
    title: "1 · Print = A5 page size",
    body: "@page { size: A5 portrait; margin: 10mm } — the print dialog opens with A5 paper and 10 mm margins, borderless colour printing, sheet rendered outside the app shell so nothing is clipped.",
  },
  {
    title: "2 · PDF + JPG = A5, high quality",
    body: "Exact A5 (148 × 210 mm) exports captured with html2canvas scale: 3 (≈300 DPI, JPEG 0.96) after fonts and images are loaded — sharp text, solid colours, no fading. Long statements continue on extra A5 pages.",
  },
  {
    title: "3 · Everything else untouched",
    body: "Same design and all five tabs, 30–60 % discounts, qty 1–300, back dues, invoice history, 48-month market-collection archive and reports. Existing entries are included (25 doctors, 42 medicines, saved invoice, collection).",
  },
];

const vcon = [
  "Unzip the download → you get the folder ankit-traders-billing/",
  "Create a free PostgreSQL database (Neon / Supabase / Railway / Vercel Postgres) and copy its URL",
  "Push the folder to GitHub (or upload the files with GitHub → Add file → Upload files)",
  "vercel.com/new → Import the repository → Framework: Next.js",
  "Add Environment Variable DATABASE_URL = your Postgres URL → Deploy",
  "Run npx drizzle-kit push once against that URL to create the tables",
];

export default function DownloadPage() {
  return (
    <main className="download-page">
      <section className="download-hero">
        <p className="topbar-eyebrow">Ankit Traders · Herbal Products Billing</p>
        <h1>Download the full project — ZIP or single file</h1>
        <p>
          The preview link runs in a temporary sandbox that asks for a traffic token. These
          downloads don&apos;t: take the <b>complete source code as a ZIP</b> (Next.js +
          PostgreSQL, ready for Vercel) or the <b>entire app as one offline HTML file</b>. Both
          already contain the <b>A5 print</b> and <b>HD A5 PDF/JPG</b> fixes.
        </p>

        <div className="download-actions">
          <a
            className="primary-button download-cta"
            href="/api/download/project"
            download="ankit-traders-project.zip"
          >
            ⬇ Download full source code (ZIP · 1.2 MB)
          </a>
          <a
            className="secondary-button"
            href="/api/download"
            download="ankit-traders-billing.html"
          >
            ⬇ Single-file offline app (HTML · 1.5 MB)
          </a>
        </div>
        <p className="download-hint">
          ZIP contains <b>README.md</b>, <b>START-HERE.txt</b>, <b>vercel.json</b>,{" "}
          <b>.env.example</b> and an <b>offline/</b> copy of the single-file app. Inside the app the
          sidebar also has <b>Save app file</b>, <b>Backup JSON</b> and <b>Restore JSON</b>.
        </p>

        <div className="download-actions" style={{ marginTop: 4 }}>
          <a className="secondary-button" href="/source">
            ZIP blocked? Get every file individually →
          </a>
          <a className="secondary-button" href="/ankit-traders-source-bundle.html" target="_blank" rel="noreferrer">
            Source bundle (single HTML, copy/paste)
          </a>
        </div>
      </section>

      <section className="download-grid">
        <article className="panel-card download-card">
          <h2>What&apos;s inside the ZIP</h2>
          <ul>
            <li>
              <strong>Next.js 16 + TypeScript app</strong>
              <span>
                src/app (5 tabs + 10 API routes), src/components, src/lib/export-a5.ts (A5 engine),
                src/db (Drizzle schema, seed of your existing entries).
              </span>
            </li>
            <li>
              <strong>Config &amp; docs</strong>
              <span>
                package.json + lockfile, next.config.ts, drizzle.config.json, vercel.json,
                .env.example, README.md, DEPLOY.md, START-HERE.txt.
              </span>
            </li>
            <li>
              <strong>Single-file app sources</strong>
              <span>
                standalone/index.template.html, standalone/app.js and scripts/build-standalone.mjs
                (run <code>node scripts/build-standalone.mjs</code> to rebuild).
              </span>
            </li>
            <li>
              <strong>No node_modules / .next / .env</strong>
              <span>Clean project — just run npm install and deploy.</span>
            </li>
          </ul>
        </article>

        <article className="panel-card download-card">
          <h2>Host on Vercel in 6 steps</h2>
          <div className="download-hosts">
            <div>
              <strong>Permanent link</strong>
              <ol>
                {vcon.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <strong>Other hosts</strong>
              <ol>
                <li>
                  Netlify — Import from Git, build <code>npm run build</code>, add the same{" "}
                  <code>DATABASE_URL</code>
                </li>
                <li>
                  GitHub Pages / Netlify Drop — use the single-file app (no server, data in the
                  browser)
                </li>
                <li>
                  Any VPS — <code>npm ci &amp;&amp; npm run build &amp;&amp; npm start</code>
                </li>
              </ol>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-card download-card">
        <h2>Included fixes (in both downloads)</h2>
        <div className="download-fixes">
          {updates.map((item) => (
            <div key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-card download-card download-note">
        <h2>Existing entries are safe</h2>
        <p>
          The server version restores your records automatically on first start when the tables are
          empty: <b>25 doctors</b>, <b>42 medicines</b>, the saved invoice{" "}
          <b>AT-20261112-ORE00U</b> (2 medicines, ₹2,210) and the market collection{" "}
          <b>₹1,500</b> for 12 Nov 2026 — see <code>src/db/seed-data.json</code>. The single-file app
          has the same records embedded and stores new entries in the browser.
        </p>
        <p>
          While the sandbox is awake you can also open <Link className="view-link" href="/">the live workspace</Link>{" "}
          — its sidebar has the same two download buttons.
        </p>
      </section>
    </main>
  );
}
