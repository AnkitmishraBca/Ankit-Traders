# Ankit Traders Billing — Herbal Products Invoice & Market Collection

Fullstack billing app for **Ankit Traders** (Barkagoan Mansingh Patti, Buxar):
doctor-wise herbal billing, saved invoice archive, daily market-collection ledger and
48-month reports — with **A5 print**, **A5 PDF** and **A5 JPG (high resolution)** exports.

Tech: **Next.js 16 (App Router) · TypeScript · Tailwind CSS · PostgreSQL + Drizzle ORM**.

---

## ✨ Latest fixes (included in this code)

| # | Fix | Where |
|---|-----|-------|
| 1 | **Print = A5, 10 mm margin** — `@page { size: A5 portrait; margin: 10mm }`, print sheet outside the app shell so the output is never blank, exact colour printing | `src/app/a5-print.css`, `src/lib/export-a5.ts` |
| 2 | **PDF + JPG = exact A5 (148 × 210 mm) at high quality** — `html2canvas scale: 3` (≈300 DPI), JPEG quality 0.96, fonts/images pre-loaded, long sheets continue on extra A5 pages | `src/lib/export-a5.ts` |
| 3 | Everything else unchanged — same design, 5 tabs, 30–60 % discounts, qty 1–300, back dues, 48-month archives, reports | `src/components/*` |

Both the invoice memo **and** the market-collection statement use the same A5 engine.

---

## 🚀 Deploy on Vercel (permanent link)

### 1. Push the code to GitHub

```bash
unzip ankit-traders-project.zip -d ankit-traders-billing
cd ankit-traders-billing
git init
git add .
git commit -m "Ankit Traders billing app with A5 print + HD exports"
git branch -M main
git remote add origin https://github.com/<your-user>/ankit-traders-billing.git
git push -u origin main
```

(No terminal? On GitHub: **New repository → Add file → Upload files** → drag the unzipped
project folder contents → Commit. Skip `node_modules`, `.next`, `.env`.)

### 2. Create a free PostgreSQL database

Any of these works: **Neon**, **Supabase**, **Railway**, **Vercel Postgres**.
Copy the connection string, e.g.

```
postgresql://user:password@host/dbname?sslmode=require
```

### 3. Import the repo in Vercel

1. <https://vercel.com/new> → **Import Git Repository** → pick your repo.
2. Framework preset: **Next.js** (auto-detected). Build `npm run build`, output default.
3. **Environment Variables** → add `DATABASE_URL` = your Postgres URL (Production + Preview).
4. **Deploy**. You get a permanent link like `https://ankit-traders-billing.vercel.app`.

### 4. Create the tables (one time)

Run locally against the production database:

```bash
echo 'DATABASE_URL="postgresql://…"' > .env
npm install
npx drizzle-kit push
```

On the first request the app restores the existing Ankit Traders records
(25 doctors, 42 medicines, saved invoice, market collection) when the tables are empty —
see `src/db/seed.ts` + `src/db/seed-data.json`.

### Other hosts

* **Netlify** — "Import from Git", build `npm run build`, add the `next` plugin (or use
  `@netlify/plugin-nextjs`) and the same `DATABASE_URL` variable.
* **Any VPS** — `npm ci && npm run build && npm start` behind Nginx.
* **No server at all?** Use the **single-file app**: `public/ankit-traders-billing.html`
  (self-contained offline copy for GitHub Pages / Netlify Drop).

---

## 🧑‍💻 Local development

```bash
npm install
cp .env.example .env          # then edit DATABASE_URL
npx drizzle-kit push          # create tables
npm run dev                   # http://localhost:3000
```

Useful scripts:

```bash
npm run build                 # production build
npm start                     # production server
npm run typecheck             # tsc --noEmit
node scripts/build-standalone.mjs   # rebuild the single-file offline HTML app
node scripts/build-project-zip.mjs  # rebuild the downloadable source ZIP
```

---

## 🗂️ Project structure

```
src/
  app/
    page.tsx                  # workspace (server component, loads initial data)
    layout.tsx                # fonts + metadata + manifest
    globals.css               # Tailwind + theme imports
    app-theme.css             # full visual design system
    a5-print.css              # A5 paper, print rules, export stage  ← A5 fix
    download/page.tsx         # /download page (ZIP + single file links)
    api/
      health/                 # GET /api/health
      masters/                # GET doctors + medicines
      doctors/[id]/           # POST, PATCH, DELETE
      medicines/[id]/         # POST, PATCH, DELETE
      invoices/               # GET list, POST save invoice
      invoices/[id]/          # GET / DELETE invoice
      collections/            # GET ledger, POST entry, DELETE entry
      collections/day-summary/# POST save full day, DELETE unlock
      reports/                # GET month/day billing reports
      download/               # GET single-file HTML (attachment)
      download/project/       # GET full source ZIP (attachment)
  components/
    BillingWorkspace.tsx      # client shell: tabs, state, exports, modals
    CreateInvoiceView.tsx     # Create Invoice tab
    MarketCollectionView.tsx  # Market Collection tab
    MastersView.tsx           # Doctors & Medicines tab
    HistoryView.tsx           # Invoice History tab
    ReportsView.tsx           # Billing Reports tab
    papers.tsx                # A5 invoice & collection statement templates
    ui.tsx, icons.tsx         # shared UI primitives
  db/
    index.ts                  # Drizzle client (DATABASE_URL)
    schema.ts                 # doctos, medicines, invoices, items, collections, day saves
    seed.ts / seed-data.json  # restores existing entries when DB is empty
  lib/
    export-a5.ts              # print + A5 PDF/JPG engine (printA5Sheet, exportA5Pdf/Jpg)
    format.ts, types.ts       # helpers & shared types
    server/data.ts            # queries, 48-month aggregation, invoice numbering
standalone/
  index.template.html         # single-file app shell
  app.js                      # single-file app logic (offline, localStorage)
scripts/
  build-standalone.mjs        # builds public/ankit-traders-billing.html
  build-project-zip.mjs       # builds public/ankit-traders-project.zip
```

---

## 📄 A5 export notes

* **Print** — click *Print Cash Memo (A5)*. The dialog pre-selects A5 paper and 10 mm
  margins (`@page`). A hidden `.print-only-sheet` outside `.app-shell` holds the sheet,
  so nothing is clipped and colours stay exact (`print-color-adjust: exact`).
* **PDF / JPG** — rendered off-screen at `148mm` width, captured with
  `html2canvas scale: 3`, flattened onto a white canvas (no transparency, no fades) and
  exported as A5. Long statements add extra A5 pages automatically.
* Files are named `Ankit-Traders-<InvoiceNo>-A5.pdf` / `.jpg` and
  `Ankit-Traders-Collection-<date|month>-A5.*`.

---

## 🔐 Environment variables

| Key | Required | Example |
|-----|----------|---------|
| `DATABASE_URL` | yes (server version) | `postgresql://user:pass@host:5432/db?sslmode=require` |

The app shows a clear runtime error (never a silent 500) if the database is unreachable;
`/api/health` returns `{ ok: true }` only when the database answers.

---

© Ankit Traders — Barkagoan Mansingh Patti · Phone 8002408341, 7488400482
